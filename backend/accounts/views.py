from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import logout
from django.db.models import Q
from .models import User
from .serializers import (
    CustomTokenObtainPairSerializer,
    UserRegistrationSerializer,
    UserProfileSerializer,
    AdminUserManagementSerializer,
    CourierCreationSerializer
)
from .permissions import (
    IsAdminUser,
    IsOwnerOrAdmin,
    RoleBasedPermission
)


class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom JWT token view that includes user role information"""
    serializer_class = CustomTokenObtainPairSerializer


class UserRegistrationView(generics.CreateAPIView):
    """View for user registration"""
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Generate tokens for the new user
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'message': 'User registered successfully',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'role': user.role,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'phone_number': user.phone_number,
            },
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)


class UserProfileView(generics.RetrieveUpdateAPIView):
    """View for user profile management"""
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]

    def get_object(self):
        return self.request.user


class LogoutView(APIView):
    """View for user logout"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh_token")
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            
            logout(request)
            return Response(
                {"message": "Successfully logged out"}, 
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {"error": "Invalid token"}, 
                status=status.HTTP_400_BAD_REQUEST
            )


# Admin User Management Views

class AdminUserListView(generics.ListAPIView):
    """Admin view to list all users with filtering and search"""
    serializer_class = AdminUserManagementSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        queryset = User.objects.all().order_by('-created_at')
        
        # Filter by role
        role = self.request.query_params.get('role', None)
        if role:
            queryset = queryset.filter(role=role)
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            is_active_bool = is_active.lower() == 'true'
            queryset = queryset.filter(is_active=is_active_bool)
        
        # Search functionality
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(username__icontains=search) |
                Q(email__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)
            )
        
        return queryset


class AdminUserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Admin view to manage individual users"""
    queryset = User.objects.all()
    serializer_class = AdminUserManagementSerializer
    permission_classes = [IsAdminUser]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class AdminUserActivationView(APIView):
    """Admin view to activate/deactivate users"""
    permission_classes = [IsAdminUser]

    def patch(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
            is_active = request.data.get('is_active')
            
            if is_active is None:
                return Response(
                    {"error": "is_active field is required"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            user.is_active = is_active
            user.save()
            
            action = "activated" if is_active else "deactivated"
            return Response({
                "message": f"User {user.username} has been {action}",
                "user": AdminUserManagementSerializer(user).data
            }, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            return Response(
                {"error": "User not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )


class AdminCourierCreationView(generics.CreateAPIView):
    """Admin view to create courier accounts"""
    serializer_class = CourierCreationSerializer
    permission_classes = [IsAdminUser]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        courier = serializer.save()
        
        return Response({
            'message': 'Courier account created successfully',
            'courier': AdminUserManagementSerializer(courier).data
        }, status=status.HTTP_201_CREATED)


class AvailableCouriersView(generics.ListAPIView):
    """View to list available couriers (for admin assignment)"""
    serializer_class = AdminUserManagementSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        return User.objects.filter(
            role='COURIER',
            is_active=True
        ).order_by('username')


# Role-based dashboard views

class CustomerDashboardView(APIView):
    """Dashboard view for customers"""
    permission_classes = [permissions.IsAuthenticated]
    allowed_roles = ['CUSTOMER']

    def get(self, request):
        if request.user.role != 'CUSTOMER':
            return Response(
                {"error": "Access denied. Customer role required."}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Return customer-specific dashboard data
        return Response({
            "message": "Welcome to customer dashboard",
            "user": UserProfileSerializer(request.user).data,
            "dashboard_data": {
                "recent_orders": [],  # Will be populated when orders are implemented
                "order_count": 0,
            }
        })


class CourierDashboardView(APIView):
    """Dashboard view for couriers"""
    permission_classes = [permissions.IsAuthenticated]
    allowed_roles = ['COURIER']

    def get(self, request):
        if request.user.role != 'COURIER':
            return Response(
                {"error": "Access denied. Courier role required."}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        from orders.models import Order, CourierStatus
        from orders.serializers import OrderSerializer, CourierStatusSerializer
        
        # Get courier status
        courier_status, created = CourierStatus.objects.get_or_create(
            courier=request.user,
            defaults={'is_available': True, 'current_orders_count': 0}
        )
        
        # Get available orders (not assigned to anyone)
        available_orders = Order.objects.filter(status='CREATED').select_related('customer')
        
        # Get assigned orders for this courier
        assigned_orders = Order.objects.filter(
            assigned_courier=request.user,
            status__in=['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT']
        ).select_related('customer')
        
        # Get completed orders count
        completed_orders_count = Order.objects.filter(
            assigned_courier=request.user,
            status='DELIVERED'
        ).count()
        
        # Return courier-specific dashboard data
        return Response({
            "message": "Welcome to courier dashboard",
            "user": UserProfileSerializer(request.user).data,
            "courier_status": CourierStatusSerializer(courier_status).data,
            "dashboard_data": {
                "available_orders": OrderSerializer(available_orders, many=True).data,
                "assigned_orders": OrderSerializer(assigned_orders, many=True).data,
                "completed_orders_count": completed_orders_count,
                "current_workload": courier_status.current_orders_count,
                "is_available": courier_status.is_available,
            }
        })


class AdminDashboardView(APIView):
    """Dashboard view for admins"""
    permission_classes = [IsAdminUser]

    def get(self, request):
        # Return admin-specific dashboard data
        total_users = User.objects.count()
        total_customers = User.objects.filter(role='CUSTOMER').count()
        total_couriers = User.objects.filter(role='COURIER').count()
        active_users = User.objects.filter(is_active=True).count()
        
        return Response({
            "message": "Welcome to admin dashboard",
            "user": UserProfileSerializer(request.user).data,
            "dashboard_data": {
                "total_users": total_users,
                "total_customers": total_customers,
                "total_couriers": total_couriers,
                "active_users": active_users,
                "total_orders": 0,  # Will be populated when orders are implemented
                "pending_orders": 0,
            }
        })
