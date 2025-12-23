from decimal import Decimal
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db.models import Q
from datetime import timedelta
from .models import Order, PricingConfig, CourierStatus
from .serializers import (
    OrderSerializer, OrderCreateSerializer, OrderStatusUpdateSerializer,
    CourierAssignmentSerializer, PricingConfigSerializer, CourierStatusSerializer,
    RealTimeUpdatesResponseSerializer
)
from .services import ConfigurationService, OrderService
from accounts.permissions import IsAdminUser, IsCourierUser, IsCustomerUser

User = get_user_model()


class OrderViewSet(viewsets.ModelViewSet):
    """ViewSet for order management"""
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Filter orders based on user role"""
        user = self.request.user
        
        if user.role == 'ADMIN':
            # Admins can see all orders
            return Order.objects.all().select_related('customer', 'assigned_courier')
        elif user.role == 'COURIER':
            # Couriers can see their assigned orders and available orders
            return Order.objects.filter(
                Q(assigned_courier=user) | Q(status='CREATED')
            ).select_related('customer', 'assigned_courier')
        elif user.role == 'CUSTOMER':
            # Customers can only see their own orders
            return Order.objects.filter(customer=user).select_related('assigned_courier')
        else:
            return Order.objects.none()

    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'create':
            return OrderCreateSerializer
        elif self.action == 'update_status':
            return OrderStatusUpdateSerializer
        elif self.action == 'assign_courier':
            return CourierAssignmentSerializer
        return OrderSerializer

    def get_permissions(self):
        """Set permissions based on action"""
        if self.action == 'create':
            permission_classes = [IsCustomerUser]
        elif self.action in ['assign_courier', 'destroy']:
            permission_classes = [IsAdminUser]
        elif self.action == 'update_status':
            permission_classes = [permissions.IsAuthenticated]  # Will check in view logic
        else:
            permission_classes = [permissions.IsAuthenticated]
        
        return [permission() for permission in permission_classes]

    def create(self, request, *args, **kwargs):
        """Create a new order"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        
        # Try auto-assignment
        self._try_auto_assignment(order)
        
        # Return full order data
        response_serializer = OrderSerializer(order)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        """Update order status"""
        order = self.get_object()
        
        # Check permissions for status update
        if request.user.role == 'COURIER' and order.assigned_courier != request.user:
            return Response(
                {'error': 'You can only update status of your assigned orders'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = OrderStatusUpdateSerializer(order, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated_order = serializer.save()
        
        # Update courier workload if order is completed or cancelled
        if updated_order.status in ['DELIVERED', 'CANCELLED'] and updated_order.assigned_courier:
            self._update_courier_workload(updated_order.assigned_courier, -1)
        
        response_serializer = OrderSerializer(updated_order)
        return Response(response_serializer.data)

    @action(detail=True, methods=['post'])
    def assign_courier(self, request, pk=None):
        """Manually assign courier to order"""
        order = self.get_object()
        
        if order.status not in ['CREATED', 'ASSIGNED']:
            return Response(
                {'error': 'Can only assign couriers to orders with CREATED or ASSIGNED status'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = CourierAssignmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        courier_id = serializer.validated_data['courier_id']
        courier = User.objects.get(id=courier_id)
        
        # Handle reassignment - decrease workload of previous courier
        if order.assigned_courier and order.assigned_courier != courier:
            self._update_courier_workload(order.assigned_courier, -1)
        
        # Assign new courier
        old_courier = order.assigned_courier
        order.assigned_courier = courier
        order.status = 'ASSIGNED'
        order.assigned_at = timezone.now()
        order.save()
        
        # Update new courier workload (only if different from old courier)
        if old_courier != courier:
            self._update_courier_workload(courier, 1)
        
        response_serializer = OrderSerializer(order)
        return Response(response_serializer.data)

    @action(detail=True, methods=['post'])
    def reassign_courier(self, request, pk=None):
        """Reassign order from one courier to another"""
        order = self.get_object()
        
        if order.status not in ['ASSIGNED', 'PICKED_UP']:
            return Response(
                {'error': 'Can only reassign orders with ASSIGNED or PICKED_UP status'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not order.assigned_courier:
            return Response(
                {'error': 'Order is not currently assigned to any courier'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = CourierAssignmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        new_courier_id = serializer.validated_data['courier_id']
        new_courier = User.objects.get(id=new_courier_id)
        old_courier = order.assigned_courier
        
        if old_courier == new_courier:
            return Response(
                {'error': 'Order is already assigned to this courier'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update workloads
        self._update_courier_workload(old_courier, -1)  # Decrease old courier's workload
        self._update_courier_workload(new_courier, 1)   # Increase new courier's workload
        
        # Reassign order
        order.assigned_courier = new_courier
        order.assigned_at = timezone.now()
        # Reset status to ASSIGNED if it was PICKED_UP (new courier needs to pick up)
        if order.status == 'PICKED_UP':
            order.status = 'ASSIGNED'
            order.picked_up_at = None
        order.save()
        
        response_serializer = OrderSerializer(order)
        return Response({
            'message': f'Order reassigned from {old_courier.get_full_name()} to {new_courier.get_full_name()}',
            'order': response_serializer.data
        })

    @action(detail=True, methods=['post'])
    def accept_order(self, request, pk=None):
        """Allow courier to accept an available order"""
        if request.user.role != 'COURIER':
            return Response(
                {'error': 'Only couriers can accept orders'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        order = self.get_object()
        
        if order.status != 'CREATED':
            return Response(
                {'error': 'Order is not available for acceptance'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if courier is available
        courier_status, created = CourierStatus.objects.get_or_create(
            courier=request.user,
            defaults={'is_available': True, 'current_orders_count': 0}
        )
        
        if not courier_status.is_available:
            return Response(
                {'error': 'You are not available for new orders'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Assign order to courier
        order.assigned_courier = request.user
        order.status = 'ASSIGNED'
        order.assigned_at = timezone.now()
        order.save()
        
        # Update courier workload
        self._update_courier_workload(request.user, 1)
        
        response_serializer = OrderSerializer(order)
        return Response(response_serializer.data)

    @action(detail=False, methods=['get'])
    def available_orders(self, request):
        """Get orders available for assignment"""
        if request.user.role != 'COURIER':
            return Response(
                {'error': 'Only couriers can view available orders'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        orders = Order.objects.filter(status='CREATED').select_related('customer')
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def tracking_info(self, request, pk=None):
        """Get real-time tracking information for an order"""
        order = self.get_object()
        
        # Check permissions - customer can track their own orders, couriers can track assigned orders
        if request.user.role == 'CUSTOMER' and order.customer != request.user:
            return Response(
                {'error': 'You can only track your own orders'},
                status=status.HTTP_403_FORBIDDEN
            )
        elif request.user.role == 'COURIER' and order.assigned_courier != request.user:
            return Response(
                {'error': 'You can only track orders assigned to you'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Calculate progress percentage
        progress_map = {
            'CREATED': 0,
            'ASSIGNED': 25,
            'PICKED_UP': 50,
            'IN_TRANSIT': 75,
            'DELIVERED': 100,
            'CANCELLED': 0
        }
        
        progress_percentage = progress_map.get(order.status, 0)
        
        # Get recent notifications for this order
        from notifications.models import Notification
        recent_notifications = Notification.objects.filter(
            related_order=order,
            user=request.user
        ).order_by('-created_at')[:5]
        
        from notifications.serializers import NotificationSerializer
        
        # Calculate estimated delivery time (simple estimation)
        estimated_delivery = None
        if order.status in ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT']:
            # Simple estimation: 5 minutes per km + 10 minutes base time
            estimated_minutes = (float(order.distance_km) * 5) + 10
            if order.assigned_at:
                estimated_delivery = order.assigned_at + timezone.timedelta(minutes=estimated_minutes)
        
        tracking_data = {
            'order': OrderSerializer(order).data,
            'progress_percentage': progress_percentage,
            'status_timeline': {
                'created_at': order.created_at,
                'assigned_at': order.assigned_at,
                'picked_up_at': order.picked_up_at,
                'in_transit_at': order.in_transit_at,
                'delivered_at': order.delivered_at,
            },
            'estimated_delivery': estimated_delivery,
            'recent_notifications': NotificationSerializer(recent_notifications, many=True).data,
            'last_updated': timezone.now(),
            'tracking_steps': [
                {
                    'status': 'CREATED',
                    'label': 'Order Created',
                    'completed': order.status != 'CREATED',
                    'timestamp': order.created_at,
                    'progress': 0
                },
                {
                    'status': 'ASSIGNED',
                    'label': 'Courier Assigned',
                    'completed': order.status not in ['CREATED'],
                    'timestamp': order.assigned_at,
                    'progress': 25
                },
                {
                    'status': 'PICKED_UP',
                    'label': 'Order Picked Up',
                    'completed': order.status not in ['CREATED', 'ASSIGNED'],
                    'timestamp': order.picked_up_at,
                    'progress': 50
                },
                {
                    'status': 'IN_TRANSIT',
                    'label': 'In Transit',
                    'completed': order.status not in ['CREATED', 'ASSIGNED', 'PICKED_UP'],
                    'timestamp': order.in_transit_at,
                    'progress': 75
                },
                {
                    'status': 'DELIVERED',
                    'label': 'Delivered',
                    'completed': order.status == 'DELIVERED',
                    'timestamp': order.delivered_at,
                    'progress': 100
                }
            ]
        }
        
        return Response(tracking_data)

    @action(detail=False, methods=['get'])
    def real_time_updates(self, request):
        """Get real-time updates for user's orders"""
        user = request.user
        
        # Get timestamp from query params for polling
        since = request.query_params.get('since')
        if since:
            try:
                from datetime import datetime
                since_datetime = datetime.fromisoformat(since.replace('Z', '+00:00'))
            except (ValueError, AttributeError):
                return Response(
                    {'error': 'Invalid since parameter format. Use ISO format.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            since_datetime = None
        
        # Get orders based on user role
        if user.role == 'CUSTOMER':
            orders = Order.objects.filter(customer=user)
        elif user.role == 'COURIER':
            # Couriers can see their assigned orders and available orders
            orders = Order.objects.filter(
                Q(assigned_courier=user) | Q(status='CREATED')
            )
        elif user.role == 'ADMIN':
            orders = Order.objects.all()
        else:
            orders = Order.objects.none()
        
        # Filter by timestamp if provided
        if since_datetime:
            orders = orders.filter(
                Q(created_at__gt=since_datetime) |
                Q(assigned_at__gt=since_datetime) |
                Q(picked_up_at__gt=since_datetime) |
                Q(in_transit_at__gt=since_datetime) |
                Q(delivered_at__gt=since_datetime)
            )
        
        # Get recent notifications
        from notifications.models import Notification
        notifications_query = Notification.objects.filter(user=user)
        if since_datetime:
            notifications_query = notifications_query.filter(created_at__gt=since_datetime)
        
        recent_notifications = notifications_query.order_by('-created_at')[:10]
        
        from notifications.serializers import NotificationSerializer
        
        # Serialize the data properly
        orders_data = OrderSerializer(orders.select_related('customer', 'assigned_courier'), many=True).data
        notifications_data = NotificationSerializer(recent_notifications, many=True).data
        
        response_data = {
            'orders': orders_data,
            'notifications': notifications_data,
            'timestamp': timezone.now().isoformat().replace('+00:00', 'Z'),
            'has_updates': orders.exists() or recent_notifications.exists()
        }
        
        return Response(response_data)

    @action(detail=False, methods=['get'])
    def dispatch_statistics(self, request):
        """Get dispatch statistics for admin dashboard"""
        if request.user.role != 'ADMIN':
            return Response(
                {'error': 'Only admins can view dispatch statistics'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        from django.db.models import Count, Avg
        
        # Get courier workload statistics
        courier_stats = CourierStatus.objects.filter(
            courier__role='COURIER'
        ).select_related('courier').annotate(
            assigned_orders=Count('courier__courier_orders', 
                                filter=Q(courier__courier_orders__status__in=['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT']))
        )
        
        # Get order statistics
        total_orders = Order.objects.count()
        pending_orders = Order.objects.filter(status='CREATED').count()
        assigned_orders = Order.objects.filter(status='ASSIGNED').count()
        in_progress_orders = Order.objects.filter(status__in=['PICKED_UP', 'IN_TRANSIT']).count()
        completed_orders = Order.objects.filter(status='DELIVERED').count()
        
        # Available couriers
        available_couriers = courier_stats.filter(is_available=True).count()
        total_couriers = courier_stats.count()
        
        # Average workload
        avg_workload = courier_stats.aggregate(avg_workload=Avg('current_orders_count'))['avg_workload'] or 0
        
        return Response({
            'courier_statistics': {
                'total_couriers': total_couriers,
                'available_couriers': available_couriers,
                'average_workload': round(avg_workload, 2),
                'courier_details': CourierStatusSerializer(courier_stats, many=True).data
            },
            'order_statistics': {
                'total_orders': total_orders,
                'pending_orders': pending_orders,
                'assigned_orders': assigned_orders,
                'in_progress_orders': in_progress_orders,
                'completed_orders': completed_orders,
            }
        })

    def _try_auto_assignment(self, order):
        """Try to automatically assign order to available courier"""
        # Find available couriers with lowest workload
        available_couriers = CourierStatus.objects.filter(
            is_available=True,
            courier__role='COURIER'
        ).select_related('courier').order_by('current_orders_count')
        
        if available_couriers.exists():
            courier_status = available_couriers.first()
            courier = courier_status.courier
            
            # Assign order
            order.assigned_courier = courier
            order.status = 'ASSIGNED'
            order.assigned_at = timezone.now()
            order.save()
            
            # Update courier workload
            self._update_courier_workload(courier, 1)

    def _update_courier_workload(self, courier, change):
        """Update courier's current order count"""
        courier_status, created = CourierStatus.objects.get_or_create(
            courier=courier,
            defaults={'is_available': True, 'current_orders_count': 0}
        )
        
        courier_status.current_orders_count = max(0, courier_status.current_orders_count + change)
        courier_status.save()


class PricingConfigViewSet(viewsets.ModelViewSet):
    """ViewSet for pricing configuration management"""
    queryset = PricingConfig.objects.all()
    serializer_class = PricingConfigSerializer
    permission_classes = [IsAdminUser]

    def perform_create(self, serializer):
        """Set created_by field when creating pricing config"""
        # Deactivate all existing configs
        PricingConfig.objects.update(is_active=False)
        
        # Create new active config
        serializer.save(created_by=self.request.user, is_active=True)

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate a pricing configuration"""
        config = self.get_object()
        
        # Deactivate all other configs
        PricingConfig.objects.update(is_active=False)
        
        # Activate this config
        config.is_active = True
        config.save()
        
        serializer = PricingConfigSerializer(config)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get the currently active pricing configuration"""
        config = PricingConfig.objects.filter(is_active=True).first()
        if config:
            serializer = PricingConfigSerializer(config)
            return Response(serializer.data)
        return Response({'error': 'No active pricing configuration found'}, 
                       status=status.HTTP_404_NOT_FOUND)


class CourierStatusViewSet(viewsets.ModelViewSet):
    """ViewSet for courier status management"""
    queryset = CourierStatus.objects.all()
    serializer_class = CourierStatusSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Filter based on user role"""
        user = self.request.user
        
        if user.role == 'ADMIN':
            return CourierStatus.objects.all().select_related('courier')
        elif user.role == 'COURIER':
            return CourierStatus.objects.filter(courier=user)
        else:
            return CourierStatus.objects.none()

    def get_permissions(self):
        """Set permissions based on action"""
        if self.action in ['list', 'retrieve']:
            permission_classes = [permissions.IsAuthenticated]
        elif self.action in ['update', 'partial_update']:
            permission_classes = [permissions.IsAuthenticated]  # Will check in view logic
        else:
            permission_classes = [IsAdminUser]
        
        return [permission() for permission in permission_classes]

    @action(detail=False, methods=['get'])
    def available_couriers(self, request):
        """Get list of available couriers"""
        if request.user.role not in ['ADMIN', 'COURIER']:
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        available = CourierStatus.objects.filter(
            is_available=True,
            courier__role='COURIER'
        ).select_related('courier').order_by('current_orders_count')
        
        serializer = CourierStatusSerializer(available, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['patch'])
    def update_availability(self, request):
        """Update courier's own availability"""
        if request.user.role != 'COURIER':
            return Response(
                {'error': 'Only couriers can update their availability'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        courier_status, created = CourierStatus.objects.get_or_create(
            courier=request.user,
            defaults={'is_available': True, 'current_orders_count': 0}
        )
        
        is_available = request.data.get('is_available')
        location_description = request.data.get('location_description', '')
        
        if is_available is not None:
            courier_status.is_available = is_available
        
        if location_description is not None:
            courier_status.location_description = location_description
        
        courier_status.save()
        
        serializer = CourierStatusSerializer(courier_status)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def my_profile(self, request):
        """Get courier's own profile and statistics"""
        if request.user.role != 'COURIER':
            return Response(
                {'error': 'Only couriers can view courier profile'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        courier_status, created = CourierStatus.objects.get_or_create(
            courier=request.user,
            defaults={'is_available': True, 'current_orders_count': 0}
        )
        
        from django.db.models import Count
        from accounts.serializers import UserProfileSerializer
        
        # Get courier statistics
        total_completed = Order.objects.filter(
            assigned_courier=request.user,
            status='DELIVERED'
        ).count()
        
        current_orders = Order.objects.filter(
            assigned_courier=request.user,
            status__in=['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT']
        ).select_related('customer')
        
        return Response({
            'profile': UserProfileSerializer(request.user).data,
            'courier_status': CourierStatusSerializer(courier_status).data,
            'statistics': {
                'total_completed_orders': total_completed,
                'current_active_orders': len(current_orders),
                'current_orders': OrderSerializer(current_orders, many=True).data
            }
        })


# Configuration Management API Views

@api_view(['GET'])
@permission_classes([IsAdminUser])
def get_pricing_config_api(request):
    """Get current pricing configuration"""
    config_service = ConfigurationService()
    active_config = config_service.get_active_pricing_config()
    
    if not active_config:
        return Response(
            {'error': 'No active pricing configuration found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    return Response({
        'success': True,
        'data': {
            'id': active_config.id,
            'base_fee': active_config.base_fee,
            'per_km_rate': active_config.per_km_rate,
            'is_active': active_config.is_active,
            'created_at': active_config.created_at,
            'created_by': {
                'id': active_config.created_by.id,
                'username': active_config.created_by.username,
                'name': f"{active_config.created_by.first_name} {active_config.created_by.last_name}".strip()
            }
        }
    })


@api_view(['POST'])
@permission_classes([IsAdminUser])
def update_pricing_config_api(request):
    """Update pricing configuration with validation"""
    config_service = ConfigurationService()
    
    try:
        base_fee = Decimal(str(request.data.get('base_fee', 0)))
        per_km_rate = Decimal(str(request.data.get('per_km_rate', 0)))
    except (ValueError, TypeError):
        return Response(
            {'error': 'Invalid base_fee or per_km_rate format'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validate configuration
    validation_result = config_service.validate_configuration_change(base_fee, per_km_rate)
    
    if not validation_result['is_valid']:
        return Response({
            'success': False,
            'errors': validation_result['errors'],
            'warnings': validation_result['warnings'],
            'sample_impacts': validation_result['sample_impacts']
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        new_config = config_service.update_pricing_config(
            base_fee=base_fee,
            per_km_rate=per_km_rate,
            admin_user=request.user
        )
        
        return Response({
            'success': True,
            'message': 'Pricing configuration updated successfully',
            'data': {
                'id': new_config.id,
                'base_fee': new_config.base_fee,
                'per_km_rate': new_config.per_km_rate,
                'is_active': new_config.is_active,
                'created_at': new_config.created_at,
                'created_by': {
                    'id': new_config.created_by.id,
                    'username': new_config.created_by.username,
                    'name': f"{new_config.created_by.first_name} {new_config.created_by.last_name}".strip()
                }
            },
            'validation': validation_result
        })
        
    except ValueError as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['POST'])
@permission_classes([IsAdminUser])
def validate_pricing_config_api(request):
    """Validate pricing configuration changes without applying them"""
    config_service = ConfigurationService()
    
    try:
        base_fee = Decimal(str(request.data.get('base_fee', 0)))
        per_km_rate = Decimal(str(request.data.get('per_km_rate', 0)))
    except (ValueError, TypeError):
        return Response(
            {'error': 'Invalid base_fee or per_km_rate format'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    validation_result = config_service.validate_configuration_change(base_fee, per_km_rate)
    
    return Response({
        'success': True,
        'validation': validation_result
    })


@api_view(['GET'])
@permission_classes([IsAdminUser])
def get_pricing_history_api(request):
    """Get pricing configuration history"""
    config_service = ConfigurationService()
    limit = int(request.GET.get('limit', 50))
    
    if limit > 200:
        limit = 200  # Cap at 200 records
    
    history = config_service.get_pricing_history(limit=limit)
    
    return Response({
        'success': True,
        'data': {
            'history': history,
            'total_records': len(history)
        }
    })


@api_view(['POST'])
@permission_classes([IsAdminUser])
def calculate_price_preview_api(request):
    """Calculate price preview for given distance and configuration"""
    config_service = ConfigurationService()
    
    try:
        distance_km = Decimal(str(request.data.get('distance_km', 0)))
        base_fee = request.data.get('base_fee')
        per_km_rate = request.data.get('per_km_rate')
    except (ValueError, TypeError):
        return Response(
            {'error': 'Invalid distance_km format'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if distance_km <= 0:
        return Response(
            {'error': 'Distance must be greater than 0'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Calculate with current configuration
        current_price = config_service.calculate_price(distance_km)
        
        # Calculate with proposed configuration if provided
        proposed_price = None
        if base_fee is not None and per_km_rate is not None:
            try:
                base_fee = Decimal(str(base_fee))
                per_km_rate = Decimal(str(per_km_rate))
                proposed_price = (base_fee + (distance_km * per_km_rate)).quantize(Decimal('0.01'))
            except (ValueError, TypeError):
                return Response(
                    {'error': 'Invalid base_fee or per_km_rate format'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        response_data = {
            'success': True,
            'data': {
                'distance_km': distance_km,
                'current_price': current_price,
                'current_config': {
                    'base_fee': config_service.get_active_pricing_config().base_fee,
                    'per_km_rate': config_service.get_active_pricing_config().per_km_rate
                }
            }
        }
        
        if proposed_price is not None:
            response_data['data']['proposed_price'] = proposed_price
            response_data['data']['proposed_config'] = {
                'base_fee': base_fee,
                'per_km_rate': per_km_rate
            }
            response_data['data']['price_difference'] = proposed_price - current_price
            response_data['data']['price_change_percent'] = float(
                ((proposed_price - current_price) / current_price * 100) if current_price > 0 else 0
            )
        
        return Response(response_data)
        
    except ValueError as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )