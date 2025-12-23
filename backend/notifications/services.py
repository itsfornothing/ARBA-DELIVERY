"""
Notification service for handling event-driven notification creation and delivery.
"""

from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from .models import Notification
from orders.models import Order

User = get_user_model()


class NotificationService:
    """Service class for managing notifications"""

    @staticmethod
    def create_order_status_notification(order, old_status=None):
        """
        Create notification when order status changes.
        
        Args:
            order: Order instance
            old_status: Previous status (optional)
        """
        if not order.customer:
            return None
        
        # Create notification for customer
        title = f"Order #{order.id} Status Update"
        message = NotificationService._get_status_message(order, old_status)
        
        notification = Notification.objects.create(
            user=order.customer,
            title=title,
            message=message,
            related_order=order
        )
        
        # Also notify courier if assigned and status change affects them
        if order.assigned_courier and order.status in ['ASSIGNED', 'CANCELLED']:
            courier_title = f"Order #{order.id} Assignment Update"
            courier_message = NotificationService._get_courier_message(order, old_status)
            
            Notification.objects.create(
                user=order.assigned_courier,
                title=courier_title,
                message=courier_message,
                related_order=order
            )
        
        return notification

    @staticmethod
    def create_order_assignment_notification(order, courier):
        """
        Create notification when courier is assigned to order.
        
        Args:
            order: Order instance
            courier: User instance (courier)
        """
        # Notify courier about new assignment
        courier_notification = Notification.objects.create(
            user=courier,
            title=f"New Order Assignment #{order.id}",
            message=f"You have been assigned to deliver order #{order.id} from {order.pickup_address} to {order.delivery_address}. Distance: {order.distance_km}km, Price: ${order.price}",
            related_order=order
        )
        
        # Notify customer about courier assignment
        customer_notification = Notification.objects.create(
            user=order.customer,
            title=f"Courier Assigned to Order #{order.id}",
            message=f"A courier has been assigned to your order #{order.id}. Your delivery is now in progress.",
            related_order=order
        )
        
        return courier_notification, customer_notification

    @staticmethod
    def create_order_completion_notification(order):
        """
        Create notification when order is completed.
        
        Args:
            order: Order instance
        """
        # Notify customer about completion
        customer_notification = Notification.objects.create(
            user=order.customer,
            title=f"Order #{order.id} Delivered",
            message=f"Your order #{order.id} has been successfully delivered! Thank you for using our service.",
            related_order=order
        )
        
        # Notify courier about completion
        if order.assigned_courier:
            courier_notification = Notification.objects.create(
                user=order.assigned_courier,
                title=f"Order #{order.id} Completed",
                message=f"You have successfully completed the delivery of order #{order.id}. Great job!",
                related_order=order
            )
            return customer_notification, courier_notification
        
        return customer_notification

    @staticmethod
    def create_order_cancellation_notification(order, cancelled_by=None):
        """
        Create notification when order is cancelled.
        
        Args:
            order: Order instance
            cancelled_by: User who cancelled the order (optional)
        """
        # Notify customer
        customer_notification = Notification.objects.create(
            user=order.customer,
            title=f"Order #{order.id} Cancelled",
            message=f"Your order #{order.id} has been cancelled. If you have any questions, please contact support.",
            related_order=order
        )
        
        # Notify courier if assigned
        if order.assigned_courier:
            courier_notification = Notification.objects.create(
                user=order.assigned_courier,
                title=f"Order #{order.id} Cancelled",
                message=f"Order #{order.id} that was assigned to you has been cancelled.",
                related_order=order
            )
            return customer_notification, courier_notification
        
        return customer_notification

    @staticmethod
    def create_system_notification(user, title, message, order=None):
        """
        Create a general system notification.
        
        Args:
            user: User to notify
            title: Notification title
            message: Notification message
            order: Related order (optional)
        """
        return Notification.objects.create(
            user=user,
            title=title,
            message=message,
            related_order=order
        )

    @staticmethod
    def notify_all_admins(title, message, order=None):
        """
        Send notification to all admin users.
        
        Args:
            title: Notification title
            message: Notification message
            order: Related order (optional)
        """
        admin_users = User.objects.filter(role='ADMIN')
        notifications = []
        
        for admin in admin_users:
            notification = Notification.objects.create(
                user=admin,
                title=title,
                message=message,
                related_order=order
            )
            notifications.append(notification)
        
        return notifications

    @staticmethod
    def _get_status_message(order, old_status=None):
        """Generate appropriate message based on order status"""
        status_messages = {
            'CREATED': f"Your order #{order.id} has been created and is waiting for courier assignment.",
            'ASSIGNED': f"A courier has been assigned to your order #{order.id}. Pickup from {order.pickup_address} will begin soon.",
            'PICKED_UP': f"Your order #{order.id} has been picked up from {order.pickup_address} and is on the way to {order.delivery_address}.",
            'IN_TRANSIT': f"Your order #{order.id} is in transit to {order.delivery_address}. Estimated delivery soon!",
            'DELIVERED': f"Your order #{order.id} has been successfully delivered to {order.delivery_address}. Thank you!",
            'CANCELLED': f"Your order #{order.id} has been cancelled. If you have any questions, please contact support."
        }
        
        return status_messages.get(order.status, f"Your order #{order.id} status has been updated to {order.status}.")

    @staticmethod
    def _get_courier_message(order, old_status=None):
        """Generate appropriate message for courier based on order status"""
        if order.status == 'ASSIGNED':
            return f"You have been assigned to order #{order.id}. Please proceed to pickup location: {order.pickup_address}"
        elif order.status == 'CANCELLED':
            return f"Order #{order.id} that was assigned to you has been cancelled."
        else:
            return f"Order #{order.id} status has been updated to {order.status}."

    @staticmethod
    def get_user_notification_summary(user):
        """
        Get notification summary for a user.
        
        Args:
            user: User instance
            
        Returns:
            dict: Summary of user's notifications
        """
        notifications = Notification.objects.filter(user=user)
        
        return {
            'total_notifications': notifications.count(),
            'unread_count': notifications.filter(is_read=False).count(),
            'order_related_count': notifications.filter(related_order__isnull=False).count(),
            'recent_count': notifications.filter(
                created_at__gte=timezone.now() - timedelta(days=7)
            ).count()
        }

    @staticmethod
    def mark_order_notifications_read(user, order):
        """
        Mark all notifications related to a specific order as read for a user.
        
        Args:
            user: User instance
            order: Order instance
        """
        return Notification.objects.filter(
            user=user,
            related_order=order,
            is_read=False
        ).update(is_read=True)