from rest_framework import serializers
from .models import Notification
from orders.serializers import OrderSerializer


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for notification management"""
    order_details = OrderSerializer(source='related_order', read_only=True)
    
    class Meta:
        model = Notification
        fields = [
            'id', 'title', 'message', 'is_read', 'created_at', 
            'related_order', 'order_details'
        ]
        read_only_fields = ['id', 'created_at', 'order_details']

    def validate_title(self, value):
        """Validate title is not empty"""
        if not value or not value.strip():
            raise serializers.ValidationError("Title is required")
        return value.strip()

    def validate_message(self, value):
        """Validate message is not empty"""
        if not value or not value.strip():
            raise serializers.ValidationError("Message is required")
        return value.strip()


class NotificationCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating notifications"""
    
    class Meta:
        model = Notification
        fields = ['title', 'message', 'related_order']

    def validate_title(self, value):
        """Validate title is not empty"""
        if not value or not value.strip():
            raise serializers.ValidationError("Title is required")
        return value.strip()

    def validate_message(self, value):
        """Validate message is not empty"""
        if not value or not value.strip():
            raise serializers.ValidationError("Message is required")
        return value.strip()

    def create(self, validated_data):
        """Create notification with user from context"""
        user = self.context['request'].user
        return Notification.objects.create(
            user=user,
            **validated_data
        )


class NotificationMarkReadSerializer(serializers.Serializer):
    """Serializer for marking notifications as read"""
    notification_ids = serializers.ListField(
        child=serializers.IntegerField(),
        allow_empty=False
    )

    def validate_notification_ids(self, value):
        """Validate notification IDs exist and belong to user"""
        user = self.context['request'].user
        
        # Check if all notifications exist and belong to the user
        existing_notifications = Notification.objects.filter(
            id__in=value,
            user=user
        ).values_list('id', flat=True)
        
        missing_ids = set(value) - set(existing_notifications)
        if missing_ids:
            raise serializers.ValidationError(
                f"Notifications with IDs {list(missing_ids)} not found or don't belong to you"
            )
        
        return value


class UnreadCountResponseSerializer(serializers.Serializer):
    """Serializer for unread count response format"""
    unread_count = serializers.IntegerField(min_value=0)
    
    class Meta:
        fields = ['unread_count']