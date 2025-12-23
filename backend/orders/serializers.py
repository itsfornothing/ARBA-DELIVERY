from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Order, PricingConfig, CourierStatus
from decimal import Decimal

User = get_user_model()


class PricingConfigSerializer(serializers.ModelSerializer):
    """Serializer for pricing configuration"""
    
    class Meta:
        model = PricingConfig
        fields = ['id', 'base_fee', 'per_km_rate', 'is_active', 'created_at', 'created_by']
        read_only_fields = ['id', 'created_at', 'created_by']


class CourierStatusSerializer(serializers.ModelSerializer):
    """Serializer for courier status"""
    courier_name = serializers.CharField(source='courier.get_full_name', read_only=True)
    courier_email = serializers.CharField(source='courier.email', read_only=True)
    
    class Meta:
        model = CourierStatus
        fields = [
            'id', 'courier', 'courier_name', 'courier_email', 
            'is_available', 'current_orders_count', 'last_activity', 
            'location_description'
        ]
        read_only_fields = ['id', 'courier', 'current_orders_count', 'last_activity']


class OrderSerializer(serializers.ModelSerializer):
    """Serializer for order management"""
    customer_name = serializers.CharField(source='customer.get_full_name', read_only=True)
    customer_email = serializers.CharField(source='customer.email', read_only=True)
    assigned_courier_name = serializers.CharField(source='assigned_courier.get_full_name', read_only=True)
    assigned_courier_email = serializers.CharField(source='assigned_courier.email', read_only=True)
    
    class Meta:
        model = Order
        fields = [
            'id', 'customer', 'customer_name', 'customer_email',
            'assigned_courier', 'assigned_courier_name', 'assigned_courier_email',
            'pickup_address', 'delivery_address', 'distance_km', 'price', 'status',
            'created_at', 'assigned_at', 'picked_up_at', 'in_transit_at', 'delivered_at'
        ]
        read_only_fields = [
            'id', 'customer', 'customer_name', 'customer_email',
            'assigned_courier_name', 'assigned_courier_email', 'price',
            'created_at', 'assigned_at', 'picked_up_at', 'in_transit_at', 'delivered_at'
        ]

    def validate_distance_km(self, value):
        """Validate distance is positive"""
        if value <= 0:
            raise serializers.ValidationError("Distance must be greater than 0")
        return value

    def validate_pickup_address(self, value):
        """Validate pickup address is not empty"""
        if not value or not value.strip():
            raise serializers.ValidationError("Pickup address is required")
        return value.strip()

    def validate_delivery_address(self, value):
        """Validate delivery address is not empty"""
        if not value or not value.strip():
            raise serializers.ValidationError("Delivery address is required")
        return value.strip()

    def validate(self, data):
        """Cross-field validation"""
        if 'pickup_address' in data and 'delivery_address' in data:
            if data['pickup_address'].strip().lower() == data['delivery_address'].strip().lower():
                raise serializers.ValidationError(
                    "Pickup and delivery addresses cannot be the same"
                )
        return data


class OrderCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new orders"""
    
    class Meta:
        model = Order
        fields = ['pickup_address', 'delivery_address', 'distance_km']

    def validate_distance_km(self, value):
        """Validate distance is positive"""
        if value <= 0:
            raise serializers.ValidationError("Distance must be greater than 0")
        return value

    def validate_pickup_address(self, value):
        """Validate pickup address is not empty"""
        if not value or not value.strip():
            raise serializers.ValidationError("Pickup address is required")
        return value.strip()

    def validate_delivery_address(self, value):
        """Validate delivery address is not empty"""
        if not value or not value.strip():
            raise serializers.ValidationError("Delivery address is required")
        return value.strip()

    def validate(self, data):
        """Cross-field validation"""
        if data['pickup_address'].strip().lower() == data['delivery_address'].strip().lower():
            raise serializers.ValidationError(
                "Pickup and delivery addresses cannot be the same"
            )
        return data

    def create(self, validated_data):
        """Create order with calculated price"""
        # Get active pricing config
        pricing_config = PricingConfig.objects.filter(is_active=True).first()
        if not pricing_config:
            raise serializers.ValidationError("No active pricing configuration found")
        
        # Calculate price: base_fee + (distance_km × per_km_rate)
        distance = validated_data['distance_km']
        price = pricing_config.base_fee + (distance * pricing_config.per_km_rate)
        # Round to 2 decimal places to match model field
        price = price.quantize(Decimal('0.01'))
        
        # Create order
        order = Order.objects.create(
            customer=self.context['request'].user,
            pickup_address=validated_data['pickup_address'],
            delivery_address=validated_data['delivery_address'],
            distance_km=distance,
            price=price,
            status='CREATED'
        )
        
        return order


class OrderStatusUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating order status"""
    
    class Meta:
        model = Order
        fields = ['status']

    def validate_status(self, value):
        """Validate status transition"""
        if not self.instance:
            return value
            
        current_status = self.instance.status
        valid_transitions = {
            'CREATED': ['ASSIGNED', 'CANCELLED'],
            'ASSIGNED': ['PICKED_UP', 'CANCELLED'],
            'PICKED_UP': ['IN_TRANSIT', 'CANCELLED'],
            'IN_TRANSIT': ['DELIVERED', 'CANCELLED'],
            'DELIVERED': [],  # Final state
            'CANCELLED': []   # Final state
        }
        
        if value not in valid_transitions.get(current_status, []):
            raise serializers.ValidationError(
                f"Cannot transition from {current_status} to {value}"
            )
        
        return value

    def update(self, instance, validated_data):
        """Update order status with timestamp"""
        from django.utils import timezone
        
        new_status = validated_data['status']
        instance.status = new_status
        
        # Set appropriate timestamp
        if new_status == 'ASSIGNED':
            instance.assigned_at = timezone.now()
        elif new_status == 'PICKED_UP':
            instance.picked_up_at = timezone.now()
        elif new_status == 'IN_TRANSIT':
            instance.in_transit_at = timezone.now()
        elif new_status == 'DELIVERED':
            instance.delivered_at = timezone.now()
        
        instance.save()
        return instance


class CourierAssignmentSerializer(serializers.Serializer):
    """Serializer for assigning courier to order"""
    courier_id = serializers.IntegerField()

    def validate_courier_id(self, value):
        """Validate courier exists and is available"""
        try:
            courier = User.objects.get(id=value, role='COURIER')
        except User.DoesNotExist:
            raise serializers.ValidationError("Courier not found")
        
        # Check if courier is available
        courier_status, created = CourierStatus.objects.get_or_create(
            courier=courier,
            defaults={'is_available': True, 'current_orders_count': 0}
        )
        
        if not courier_status.is_available:
            raise serializers.ValidationError("Courier is not available")
        
        return value


class RealTimeUpdatesResponseSerializer(serializers.Serializer):
    """Serializer for real-time updates response format"""
    orders = OrderSerializer(many=True, read_only=True)
    notifications = serializers.ListField(child=serializers.DictField(), read_only=True)
    timestamp = serializers.DateTimeField(read_only=True)
    has_updates = serializers.BooleanField(read_only=True)
    
    class Meta:
        fields = ['orders', 'notifications', 'timestamp', 'has_updates']