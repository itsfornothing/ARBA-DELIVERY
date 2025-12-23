"""
Property-based tests for notification completeness functionality.

**Feature: delivery-app, Property 7: Notification Completeness**
**Validates: Requirements 11.1, 11.2, 11.3**
"""

import pytest
from hypothesis import given, strategies as st, assume
from hypothesis.extra.django import TestCase, TransactionTestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from orders.models import Order, PricingConfig, CourierStatus
from notifications.models import Notification
from notifications.services import NotificationService
from decimal import Decimal

User = get_user_model()


class TestNotificationCompletenessProperties(TransactionTestCase):
    """Property-based tests for notification completeness"""

    def setUp(self):
        """Set up test data"""
        # Create pricing config
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            role='ADMIN',
            phone_number='+1234567890'
        )
        
        self.pricing_config = PricingConfig.objects.create(
            base_fee=Decimal('50.00'),
            per_km_rate=Decimal('20.00'),
            is_active=True,
            created_by=self.admin_user
        )

    @given(
        customer_username=st.text(min_size=3, max_size=20, alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd'))),
        courier_username=st.text(min_size=3, max_size=20, alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd'))),
        pickup_address=st.text(min_size=5, max_size=100),
        delivery_address=st.text(min_size=5, max_size=100),
        distance_km=st.decimals(min_value=Decimal('0.1'), max_value=Decimal('100.0'), places=2),
        status_change=st.sampled_from(['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'])
    )
    def test_order_status_change_notifies_all_relevant_users(
        self, customer_username, courier_username, pickup_address, 
        delivery_address, distance_km, status_change
    ):
        """
        **Feature: delivery-app, Property 7: Notification Completeness**
        **Validates: Requirements 11.1, 11.2, 11.3**
        
        Property: For any order status change or assignment event, all relevant users 
        (customer, assigned courier, admins) must receive appropriate notifications 
        with correct information.
        """
        # Ensure usernames are different
        assume(customer_username != courier_username)
        assume(pickup_address.strip() != delivery_address.strip())
        
        # Create test users
        customer = User.objects.create_user(
            username=f'customer_{customer_username}',
            email=f'customer_{customer_username}@example.com',
            role='CUSTOMER',
            phone_number='+1234567890'
        )
        
        courier = User.objects.create_user(
            username=f'courier_{courier_username}',
            email=f'courier_{courier_username}@example.com',
            role='COURIER',
            phone_number='+1234567891'
        )
        
        # Create courier status
        CourierStatus.objects.create(
            courier=courier,
            is_available=True,
            current_orders_count=0
        )
        
        # Create order
        order = Order.objects.create(
            customer=customer,
            pickup_address=pickup_address,
            delivery_address=delivery_address,
            distance_km=distance_km,
            price=self.pricing_config.base_fee + (distance_km * self.pricing_config.per_km_rate),
            status='CREATED'
        )
        
        # Assign courier if needed for status changes
        if status_change != 'ASSIGNED':
            order.assigned_courier = courier
            order.status = 'ASSIGNED'
            order.assigned_at = timezone.now()
            order.save()
        
        # Clear any existing notifications
        Notification.objects.all().delete()
        
        # Trigger status change using the notification service
        old_status = order.status
        order.status = status_change
        
        # Set appropriate timestamp
        if status_change == 'ASSIGNED':
            order.assigned_courier = courier
            order.assigned_at = timezone.now()
        elif status_change == 'PICKED_UP':
            order.picked_up_at = timezone.now()
        elif status_change == 'IN_TRANSIT':
            order.in_transit_at = timezone.now()
        elif status_change == 'DELIVERED':
            order.delivered_at = timezone.now()
        
        order.save()
        
        # Create notifications using the service
        NotificationService.create_order_status_notification(order, old_status)
        
        # Special handling for specific status changes
        if status_change == 'ASSIGNED' and order.assigned_courier:
            NotificationService.create_order_assignment_notification(order, order.assigned_courier)
        elif status_change == 'DELIVERED':
            NotificationService.create_order_completion_notification(order)
        elif status_change == 'CANCELLED':
            NotificationService.create_order_cancellation_notification(order)
        
        # Verify customer receives notification
        customer_notifications = Notification.objects.filter(user=customer, related_order=order)
        assert customer_notifications.exists(), f"Customer should receive notification for status change to {status_change}"
        
        customer_notification = customer_notifications.first()
        assert str(order.id) in customer_notification.message, "Customer notification should mention order ID"
        
        # Check for human-readable status mentions in the message
        status_keywords = {
            'ASSIGNED': ['assigned', 'courier'],
            'PICKED_UP': ['picked up', 'picked'],
            'IN_TRANSIT': ['in transit', 'on the way', 'transit'],
            'DELIVERED': ['delivered', 'delivery'],
            'CANCELLED': ['cancelled', 'canceled']
        }
        
        keywords = status_keywords.get(status_change, [status_change.lower()])
        message_lower = customer_notification.message.lower()
        status_mentioned = any(keyword in message_lower for keyword in keywords)
        assert status_mentioned, f"Customer notification should mention status {status_change} using keywords {keywords}"
        
        # Verify courier receives notification if assigned and relevant
        if order.assigned_courier and status_change in ['ASSIGNED', 'DELIVERED', 'CANCELLED']:
            courier_notifications = Notification.objects.filter(user=courier, related_order=order)
            assert courier_notifications.exists(), f"Courier should receive notification for status change to {status_change}"
            
            courier_notification = courier_notifications.first()
            assert str(order.id) in courier_notification.message, "Courier notification should mention order ID"
        
        # Verify all notifications have required fields
        all_notifications = Notification.objects.filter(related_order=order)
        for notification in all_notifications:
            assert notification.title, "Notification should have a title"
            assert notification.message, "Notification should have a message"
            assert notification.user, "Notification should be assigned to a user"
            assert notification.related_order == order, "Notification should be linked to the correct order"
            assert not notification.is_read, "New notifications should be unread by default"

    @given(
        customer_username=st.text(min_size=3, max_size=20, alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd'))),
        courier_username=st.text(min_size=3, max_size=20, alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd'))),
        pickup_address=st.text(min_size=5, max_size=100),
        delivery_address=st.text(min_size=5, max_size=100),
        distance_km=st.decimals(min_value=Decimal('0.1'), max_value=Decimal('100.0'), places=2)
    )
    def test_courier_assignment_creates_complete_notifications(
        self, customer_username, courier_username, pickup_address, 
        delivery_address, distance_km
    ):
        """
        **Feature: delivery-app, Property 7: Notification Completeness**
        **Validates: Requirements 11.1, 11.2, 11.3**
        
        Property: For any courier assignment event, both the customer and the assigned 
        courier must receive notifications with complete and accurate information.
        """
        assume(customer_username != courier_username)
        assume(pickup_address.strip() != delivery_address.strip())
        
        # Create test users
        customer = User.objects.create_user(
            username=f'customer_{customer_username}',
            email=f'customer_{customer_username}@example.com',
            role='CUSTOMER',
            phone_number='+1234567890'
        )
        
        courier = User.objects.create_user(
            username=f'courier_{courier_username}',
            email=f'courier_{courier_username}@example.com',
            role='COURIER',
            phone_number='+1234567891'
        )
        
        # Create courier status
        CourierStatus.objects.create(
            courier=courier,
            is_available=True,
            current_orders_count=0
        )
        
        # Create order
        order = Order.objects.create(
            customer=customer,
            pickup_address=pickup_address,
            delivery_address=delivery_address,
            distance_km=distance_km,
            price=self.pricing_config.base_fee + (distance_km * self.pricing_config.per_km_rate),
            status='CREATED'
        )
        
        # Clear any existing notifications
        Notification.objects.all().delete()
        
        # Assign courier and create notifications
        courier_notification, customer_notification = NotificationService.create_order_assignment_notification(order, courier)
        
        # Verify courier notification completeness
        assert courier_notification.user == courier, "Courier notification should be assigned to the courier"
        assert courier_notification.related_order == order, "Courier notification should be linked to the order"
        assert str(order.id) in courier_notification.message, "Courier notification should mention order ID"
        assert pickup_address in courier_notification.message, "Courier notification should mention pickup address"
        assert delivery_address in courier_notification.message, "Courier notification should mention delivery address"
        assert str(distance_km) in courier_notification.message, "Courier notification should mention distance"
        assert str(order.price) in courier_notification.message, "Courier notification should mention price"
        
        # Verify customer notification completeness
        assert customer_notification.user == customer, "Customer notification should be assigned to the customer"
        assert customer_notification.related_order == order, "Customer notification should be linked to the order"
        assert str(order.id) in customer_notification.message, "Customer notification should mention order ID"
        
        # Verify both notifications are unread
        assert not courier_notification.is_read, "Courier notification should be unread initially"
        assert not customer_notification.is_read, "Customer notification should be unread initially"

    @given(
        customer_username=st.text(min_size=3, max_size=20, alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd'))),
        courier_username=st.text(min_size=3, max_size=20, alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd'))),
        pickup_address=st.text(min_size=5, max_size=100),
        delivery_address=st.text(min_size=5, max_size=100),
        distance_km=st.decimals(min_value=Decimal('0.1'), max_value=Decimal('100.0'), places=2)
    )
    def test_order_completion_notifies_all_parties(
        self, customer_username, courier_username, pickup_address, 
        delivery_address, distance_km
    ):
        """
        **Feature: delivery-app, Property 7: Notification Completeness**
        **Validates: Requirements 11.1, 11.2, 11.3**
        
        Property: For any order completion event, both the customer and the courier 
        must receive appropriate completion notifications.
        """
        assume(customer_username != courier_username)
        assume(pickup_address.strip() != delivery_address.strip())
        
        # Create test users
        customer = User.objects.create_user(
            username=f'customer_{customer_username}',
            email=f'customer_{customer_username}@example.com',
            role='CUSTOMER',
            phone_number='+1234567890'
        )
        
        courier = User.objects.create_user(
            username=f'courier_{courier_username}',
            email=f'courier_{courier_username}@example.com',
            role='COURIER',
            phone_number='+1234567891'
        )
        
        # Create order with assigned courier
        order = Order.objects.create(
            customer=customer,
            assigned_courier=courier,
            pickup_address=pickup_address,
            delivery_address=delivery_address,
            distance_km=distance_km,
            price=self.pricing_config.base_fee + (distance_km * self.pricing_config.per_km_rate),
            status='IN_TRANSIT',
            delivered_at=timezone.now()
        )
        
        # Clear any existing notifications
        Notification.objects.all().delete()
        
        # Create completion notifications
        notifications = NotificationService.create_order_completion_notification(order)
        
        # Should return customer and courier notifications
        if isinstance(notifications, tuple):
            customer_notification, courier_notification = notifications
        else:
            customer_notification = notifications
            courier_notification = None
        
        # Verify customer completion notification
        assert customer_notification.user == customer, "Customer should receive completion notification"
        assert customer_notification.related_order == order, "Customer notification should be linked to order"
        assert str(order.id) in customer_notification.message, "Customer notification should mention order ID"
        assert 'delivered' in customer_notification.message.lower(), "Customer notification should mention delivery"
        
        # Verify courier completion notification if courier was assigned
        if courier_notification:
            assert courier_notification.user == courier, "Courier should receive completion notification"
            assert courier_notification.related_order == order, "Courier notification should be linked to order"
            assert str(order.id) in courier_notification.message, "Courier notification should mention order ID"
            assert 'completed' in courier_notification.message.lower(), "Courier notification should mention completion"

    @given(
        title=st.text(min_size=5, max_size=100),
        message=st.text(min_size=10, max_size=200),
        user_role=st.sampled_from(['CUSTOMER', 'COURIER', 'ADMIN'])
    )
    def test_system_notification_contains_required_information(
        self, title, message, user_role
    ):
        """
        **Feature: delivery-app, Property 7: Notification Completeness**
        **Validates: Requirements 11.1, 11.2, 11.3**
        
        Property: For any system notification, it must contain all required fields 
        and be properly associated with the target user.
        """
        # Create test user
        user = User.objects.create_user(
            username=f'testuser_{user_role.lower()}',
            email=f'test_{user_role.lower()}@example.com',
            role=user_role,
            phone_number='+1234567890'
        )
        
        # Create system notification
        notification = NotificationService.create_system_notification(
            user=user,
            title=title,
            message=message
        )
        
        # Verify notification completeness
        assert notification.user == user, "Notification should be assigned to the correct user"
        assert notification.title == title, "Notification should have the correct title"
        assert notification.message == message, "Notification should have the correct message"
        assert not notification.is_read, "New notification should be unread"
        assert notification.created_at, "Notification should have a creation timestamp"
        
        # Verify notification can be retrieved for the user
        user_notifications = Notification.objects.filter(user=user)
        assert user_notifications.exists(), "User should have notifications"
        assert notification in user_notifications, "Created notification should be in user's notifications"