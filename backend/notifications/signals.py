"""
Django signals for automatic notification creation.
"""

from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from orders.models import Order
from .services import NotificationService


@receiver(pre_save, sender=Order)
def capture_old_order_status(sender, instance, **kwargs):
    """Capture the old status before saving to compare changes"""
    if instance.pk:
        try:
            old_instance = Order.objects.get(pk=instance.pk)
            instance._old_status = old_instance.status
            instance._old_assigned_courier = old_instance.assigned_courier
        except Order.DoesNotExist:
            instance._old_status = None
            instance._old_assigned_courier = None
    else:
        instance._old_status = None
        instance._old_assigned_courier = None


@receiver(post_save, sender=Order)
def create_order_notifications(sender, instance, created, **kwargs):
    """Create notifications when order is created or status changes"""
    
    if created:
        # New order created - notify admins
        NotificationService.notify_all_admins(
            title=f"New Order #{instance.id} Created",
            message=f"A new order has been created by {instance.customer.get_full_name()} from {instance.pickup_address} to {instance.delivery_address}. Distance: {instance.distance_km}km, Price: ${instance.price}",
            order=instance
        )
        
        # Notify customer about order creation
        NotificationService.create_system_notification(
            user=instance.customer,
            title=f"Order #{instance.id} Created Successfully",
            message=f"Your order from {instance.pickup_address} to {instance.delivery_address} has been created. We'll notify you when a courier is assigned.",
            order=instance
        )
    
    else:
        # Order updated - check for status changes
        old_status = getattr(instance, '_old_status', None)
        old_assigned_courier = getattr(instance, '_old_assigned_courier', None)
        
        # Status changed
        if old_status and old_status != instance.status:
            NotificationService.create_order_status_notification(instance, old_status)
            
            # Special handling for completion and cancellation
            if instance.status == 'DELIVERED':
                NotificationService.create_order_completion_notification(instance)
            elif instance.status == 'CANCELLED':
                NotificationService.create_order_cancellation_notification(instance)
        
        # Courier assignment changed
        if old_assigned_courier != instance.assigned_courier and instance.assigned_courier:
            NotificationService.create_order_assignment_notification(instance, instance.assigned_courier)
            
            # Notify admins about assignment
            NotificationService.notify_all_admins(
                title=f"Order #{instance.id} Assigned",
                message=f"Order #{instance.id} has been assigned to courier {instance.assigned_courier.get_full_name()}",
                order=instance
            )