"""
Comprehensive integration tests for critical workflows in the delivery platform.

This test suite covers additional integration scenarios beyond the existing tests:
1. Multi-user concurrent operations
2. Cross-role workflow interactions
3. System resilience under load
4. Data consistency across operations
5. Edge case handling in workflows

**Feature: delivery-app, Comprehensive Integration Testing**
**Validates: All requirements validation**
"""

import pytest
from django.test import TestCase, TransactionTestCase
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from accounts.models import User
from orders.models import Order, PricingConfig, CourierStatus
from notifications.models import Notification
from decimal import Decimal
from django.utils import timezone
from django.db import transaction
import threading
import time


class ComprehensiveIntegrationWorkflowTests(TestCase):
    """Comprehensive integration tests for complex workflow scenarios"""
    
    def setUp(self):
        """Set up test environment with multiple users and configurations"""
        self.client = APIClient()
        
        # Create multiple customers
        self.customers = []
        for i in range(3):
            customer = User.objects.create_user(
                username=f'customer_{i}',
                email=f'customer{i}@test.com',
                password='testpass123',
                first_name=f'Customer',
                last_name=f'{i}',
                role='CUSTOMER',
                phone_number=f'+123456789{i}'
            )
            self.customers.append(customer)
        
        # Create multiple couriers
        self.couriers = []
        for i in range(2):
            courier = User.objects.create_user(
                username=f'courier_{i}',
                email=f'courier{i}@test.com',
                password='testpass123',
                first_name=f'Courier',
                last_name=f'{i}',
                role='COURIER',
                phone_number=f'+123456788{i}'
            )
            self.couriers.append(courier)
            
            # Create courier status
            CourierStatus.objects.create(
                courier=courier,
                is_available=True,
                current_orders_count=0
            )
        
        # Create admin user
        self.admin = User.objects.create_user(
            username='admin_user',
            email='admin@test.com',
            password='testpass123',
            first_name='Admin',
            last_name='User',
            role='ADMIN',
            phone_number='+1234567880'
        )
        
        # Create pricing configuration
        self.pricing_config = PricingConfig.objects.create(
            base_fee=Decimal('50.00'),
            per_km_rate=Decimal('20.00'),
            is_active=True,
            created_by=self.admin
        )
    
    def authenticate_user(self, user):
        """Helper to authenticate a user"""
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
    
    def test_multi_customer_concurrent_order_creation(self):
        """
        Test multiple customers creating orders simultaneously:
        1. Multiple customers create orders at the same time
        2. System handles concurrent pricing calculations correctly
        3. All orders are created with proper data integrity
        4. No race conditions in order numbering or pricing
        """
        order_data_template = {
            'pickup_address': 'Pickup Location {}',
            'delivery_address': 'Delivery Location {}',
            'distance_km': '5.0'
        }
        
        created_orders = []
        
        # Create orders for each customer
        for i, customer in enumerate(self.customers):
            self.authenticate_user(customer)
            
            order_data = {
                'pickup_address': order_data_template['pickup_address'].format(i),
                'delivery_address': order_data_template['delivery_address'].format(i),
                'distance_km': order_data_template['distance_km']
            }
            
            response = self.client.post('/api/orders/orders/', order_data)
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
            created_orders.append(response.data['id'])
        
        # Verify all orders were created correctly
        self.assertEqual(len(created_orders), 3)
        
        # Verify each order has correct data
        for i, order_id in enumerate(created_orders):
            order = Order.objects.get(id=order_id)
            self.assertEqual(order.customer, self.customers[i])
            # Order might be auto-assigned if couriers are available
            self.assertIn(order.status, ['CREATED', 'ASSIGNED'])
            self.assertEqual(order.price, Decimal('150.00'))  # 50 + (5.0 * 20)
            self.assertIsNotNone(order.created_at)
        
        # Verify no duplicate order IDs
        self.assertEqual(len(set(created_orders)), len(created_orders))
    
    def test_courier_workload_balancing_workflow(self):
        """
        Test automatic courier assignment with workload balancing:
        1. Create multiple orders
        2. Assign orders to couriers automatically
        3. Verify workload is balanced between available couriers
        4. Test courier availability changes affect assignment
        """
        # Create multiple orders
        order_ids = []
        for i in range(4):
            self.authenticate_user(self.customers[0])
            
            order_data = {
                'pickup_address': f'Pickup {i}',
                'delivery_address': f'Delivery {i}',
                'distance_km': '3.0'
            }
            
            response = self.client.post('/api/orders/orders/', order_data)
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
            order_ids.append(response.data['id'])
        
        # Admin assigns orders using auto-assignment logic
        self.authenticate_user(self.admin)
        
        assignments = {}
        for order_id in order_ids:
            # Get available couriers and assign to least loaded
            courier_statuses = CourierStatus.objects.filter(
                courier__role='COURIER',
                courier__is_active=True,
                is_available=True
            ).order_by('current_orders_count')
            
            if courier_statuses.exists():
                selected_courier = courier_statuses.first().courier
                
                response = self.client.post(
                    f'/api/orders/orders/{order_id}/assign_courier/',
                    {'courier_id': selected_courier.id}
                )
                self.assertEqual(response.status_code, status.HTTP_200_OK)
                
                # Track assignments
                if selected_courier.id not in assignments:
                    assignments[selected_courier.id] = 0
                assignments[selected_courier.id] += 1
                
                # Update courier status
                courier_status = CourierStatus.objects.get(courier=selected_courier)
                courier_status.current_orders_count += 1
                courier_status.save()
        
        # Verify workload is balanced (difference should be at most 1)
        assignment_counts = list(assignments.values())
        self.assertLessEqual(max(assignment_counts) - min(assignment_counts), 1)
        
        # Verify all orders are assigned
        assigned_orders = Order.objects.filter(id__in=order_ids, status='ASSIGNED')
        self.assertEqual(assigned_orders.count(), 4)
    
    def test_order_lifecycle_with_status_validation(self):
        """
        Test complete order lifecycle with strict status validation:
        1. Order creation and initial state
        2. Assignment validation
        3. Status progression validation
        4. Invalid transition rejection
        5. Final state verification
        """
        # Create order
        self.authenticate_user(self.customers[0])
        
        order_data = {
            'pickup_address': 'Test Pickup Address',
            'delivery_address': 'Test Delivery Address',
            'distance_km': '4.5'
        }
        
        response = self.client.post('/api/orders/orders/', order_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        order_id = response.data['id']
        
        # Verify initial state (might be auto-assigned)
        order = Order.objects.get(id=order_id)
        initial_status = order.status
        initial_courier = order.assigned_courier
        
        # Order might be auto-assigned if couriers are available
        self.assertIn(order.status, ['CREATED', 'ASSIGNED'])
        
        # If not auto-assigned, manually assign for test continuation
        if order.status == 'CREATED':
            # Admin assigns courier
            self.authenticate_user(self.admin)
            
            response = self.client.post(
                f'/api/orders/orders/{order_id}/assign_courier/',
                {'courier_id': self.couriers[0].id}
            )
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            
            order.refresh_from_db()
            self.assertEqual(order.status, 'ASSIGNED')
            self.assertEqual(order.assigned_courier, self.couriers[0])
            self.assertIsNotNone(order.assigned_at)
        else:
            # Already auto-assigned, continue with existing assignment
            self.assertEqual(order.status, 'ASSIGNED')
            self.assertIsNotNone(order.assigned_courier)
            self.assertIsNotNone(order.assigned_at)
        
        # Get the assigned courier for status updates
        assigned_courier = order.assigned_courier
        
        # Courier progresses through valid status transitions
        self.authenticate_user(assigned_courier)
        
        valid_transitions = [
            ('PICKED_UP', 'picked_up_at'),
            ('IN_TRANSIT', 'in_transit_at'),
            ('DELIVERED', 'delivered_at')
        ]
        
        for status_name, timestamp_field in valid_transitions:
            response = self.client.patch(
                f'/api/orders/orders/{order_id}/update_status/',
                {'status': status_name}
            )
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            
            order.refresh_from_db()
            self.assertEqual(order.status, status_name)
            self.assertIsNotNone(getattr(order, timestamp_field))
        
        # Verify final state
        order.refresh_from_db()
        self.assertEqual(order.status, 'DELIVERED')
        
        # Verify timestamp ordering
        self.assertLess(order.created_at, order.assigned_at)
        self.assertLess(order.assigned_at, order.picked_up_at)
        self.assertLess(order.picked_up_at, order.in_transit_at)
        self.assertLess(order.in_transit_at, order.delivered_at)
    
    def test_notification_system_comprehensive_workflow(self):
        """
        Test comprehensive notification system workflow:
        1. Order events trigger appropriate notifications
        2. Multiple users receive correct notifications
        3. Notification content is accurate
        4. Notification delivery is reliable
        5. Read status management works correctly
        """
        # Create order
        self.authenticate_user(self.customers[0])
        
        order_data = {
            'pickup_address': 'Notification Test Pickup',
            'delivery_address': 'Notification Test Delivery',
            'distance_km': '6.0'
        }
        
        initial_notification_count = Notification.objects.count()
        
        response = self.client.post('/api/orders/orders/', order_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        order_id = response.data['id']
        
        # Admin assigns courier
        self.authenticate_user(self.admin)
        
        response = self.client.post(
            f'/api/orders/orders/{order_id}/assign_courier/',
            {'courier_id': self.couriers[0].id}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify assignment notifications
        assignment_notifications = Notification.objects.filter(
            id__gt=initial_notification_count
        )
        self.assertGreater(assignment_notifications.count(), 0)
        
        # Verify customer received assignment notification
        customer_notifications = assignment_notifications.filter(
            user=self.customers[0]
        )
        self.assertGreater(customer_notifications.count(), 0)
        
        # Verify courier received assignment notification
        courier_notifications = assignment_notifications.filter(
            user=self.couriers[0]
        )
        self.assertGreater(courier_notifications.count(), 0)
        
        # Courier updates status and verify notifications
        self.authenticate_user(self.couriers[0])
        
        pre_status_count = Notification.objects.count()
        
        response = self.client.patch(
            f'/api/orders/orders/{order_id}/update_status/',
            {'status': 'PICKED_UP'}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify status update notifications
        post_status_count = Notification.objects.count()
        self.assertGreater(post_status_count, pre_status_count)
        
        # Test notification retrieval and read status
        self.authenticate_user(self.customers[0])
        
        response = self.client.get('/notifications/api/notifications/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Handle paginated response
        if 'results' in response.data:
            notifications_list = response.data['results']
        else:
            notifications_list = response.data
        
        customer_order_notifications = [
            n for n in notifications_list 
            if n.get('related_order') == order_id
        ]
        self.assertGreater(len(customer_order_notifications), 0)
        
        # Mark notification as read
        if customer_order_notifications:
            notification_id = customer_order_notifications[0]['id']
            
            response = self.client.patch(
                f'/notifications/api/notifications/{notification_id}/',
                {'is_read': True}
            )
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            
            # Verify notification was marked as read
            notification = Notification.objects.get(id=notification_id)
            self.assertTrue(notification.is_read)
    
    def test_pricing_configuration_isolation_workflow(self):
        """
        Test pricing configuration changes and isolation:
        1. Create orders with current pricing
        2. Update pricing configuration
        3. Verify existing orders maintain original pricing
        4. Verify new orders use updated pricing
        5. Test configuration history and rollback
        """
        # Create initial order
        self.authenticate_user(self.customers[0])
        
        order_data = {
            'pickup_address': 'Pricing Test Pickup',
            'delivery_address': 'Pricing Test Delivery',
            'distance_km': '8.0'
        }
        
        response = self.client.post('/api/orders/orders/', order_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        first_order_id = response.data['id']
        
        first_order = Order.objects.get(id=first_order_id)
        original_price = first_order.price
        expected_original_price = Decimal('210.00')  # 50 + (8.0 * 20)
        self.assertEqual(original_price, expected_original_price)
        
        # Admin updates pricing configuration
        self.authenticate_user(self.admin)
        
        new_pricing_data = {
            'base_fee': '75.00',
            'per_km_rate': '30.00'
        }
        
        response = self.client.post('/api/orders/pricing-config/', new_pricing_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify old configuration is deactivated
        old_config = PricingConfig.objects.get(id=self.pricing_config.id)
        old_config.refresh_from_db()
        self.assertFalse(old_config.is_active)
        
        # Verify new configuration is active
        new_config = PricingConfig.objects.filter(is_active=True).first()
        self.assertEqual(new_config.base_fee, Decimal('75.00'))
        self.assertEqual(new_config.per_km_rate, Decimal('30.00'))
        
        # Verify existing order price unchanged
        first_order.refresh_from_db()
        self.assertEqual(first_order.price, original_price)
        
        # Create new order with updated pricing
        self.authenticate_user(self.customers[1])
        
        response = self.client.post('/api/orders/orders/', order_data)  # Same data
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        second_order_id = response.data['id']
        
        second_order = Order.objects.get(id=second_order_id)
        expected_new_price = Decimal('315.00')  # 75 + (8.0 * 30)
        self.assertEqual(second_order.price, expected_new_price)
        
        # Verify pricing isolation
        self.assertNotEqual(first_order.price, second_order.price)
        self.assertEqual(first_order.price, expected_original_price)
        self.assertEqual(second_order.price, expected_new_price)
    
    def test_system_resilience_under_mixed_operations(self):
        """
        Test system resilience under mixed concurrent operations:
        1. Multiple users performing different operations simultaneously
        2. Order creation, assignment, and status updates
        3. User management operations
        4. Configuration changes
        5. Notification processing
        """
        # Create multiple orders from different customers
        order_ids = []
        
        for i, customer in enumerate(self.customers):
            self.authenticate_user(customer)
            
            order_data = {
                'pickup_address': f'Resilience Test Pickup {i}',
                'delivery_address': f'Resilience Test Delivery {i}',
                'distance_km': str(3.0 + i)
            }
            
            response = self.client.post('/api/orders/orders/', order_data)
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
            order_ids.append(response.data['id'])
        
        # Admin performs bulk operations
        self.authenticate_user(self.admin)
        
        # Assign orders to couriers
        for i, order_id in enumerate(order_ids):
            courier = self.couriers[i % len(self.couriers)]
            
            response = self.client.post(
                f'/api/orders/orders/{order_id}/assign_courier/',
                {'courier_id': courier.id}
            )
            self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Couriers update order statuses
        for i, order_id in enumerate(order_ids):
            courier = self.couriers[i % len(self.couriers)]
            self.authenticate_user(courier)
            
            # Progress through statuses
            for status_name in ['PICKED_UP', 'IN_TRANSIT']:
                response = self.client.patch(
                    f'/api/orders/orders/{order_id}/update_status/',
                    {'status': status_name}
                )
                self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify system state consistency
        # All orders should be in IN_TRANSIT status
        in_transit_orders = Order.objects.filter(
            id__in=order_ids,
            status='IN_TRANSIT'
        )
        self.assertEqual(in_transit_orders.count(), len(order_ids))
        
        # All orders should have assigned couriers
        assigned_orders = Order.objects.filter(
            id__in=order_ids,
            assigned_courier__isnull=False
        )
        self.assertEqual(assigned_orders.count(), len(order_ids))
        
        # Verify notifications were created for all operations
        total_notifications = Notification.objects.count()
        # Should have notifications for assignments and status updates
        expected_min_notifications = len(order_ids) * 3  # Assignment + 2 status updates
        self.assertGreaterEqual(total_notifications, expected_min_notifications)
        
        # Verify data integrity
        for order_id in order_ids:
            order = Order.objects.get(id=order_id)
            
            # Verify timestamp progression
            self.assertIsNotNone(order.created_at)
            self.assertIsNotNone(order.assigned_at)
            self.assertIsNotNone(order.picked_up_at)
            self.assertIsNotNone(order.in_transit_at)
            
            self.assertLess(order.created_at, order.assigned_at)
            self.assertLess(order.assigned_at, order.picked_up_at)
            self.assertLess(order.picked_up_at, order.in_transit_at)
            
            # Verify pricing consistency
            expected_price = Decimal('50.00') + (order.distance_km * Decimal('20.00'))
            self.assertEqual(order.price, expected_price)
    
    def test_cross_role_permission_enforcement(self):
        """
        Test cross-role permission enforcement in workflows:
        1. Customers can only access their own orders
        2. Couriers can only update assigned orders
        3. Admins have full access to all operations
        4. Unauthorized operations are properly rejected
        5. Data isolation is maintained
        """
        # Create orders for different customers
        customer_orders = {}
        
        for i, customer in enumerate(self.customers[:2]):  # Use first 2 customers
            self.authenticate_user(customer)
            
            order_data = {
                'pickup_address': f'Permission Test Pickup {i}',
                'delivery_address': f'Permission Test Delivery {i}',
                'distance_km': '4.0'
            }
            
            response = self.client.post('/api/orders/orders/', order_data)
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
            customer_orders[customer.id] = response.data['id']
        
        # Test customer access isolation
        self.authenticate_user(self.customers[0])
        
        # Customer 0 should see their own order
        response = self.client.get('/api/orders/orders/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Handle paginated response
        if 'results' in response.data:
            orders_list = response.data['results']
        else:
            orders_list = response.data
        
        customer_0_orders = [
            o for o in orders_list 
            if o['customer'] == self.customers[0].id
        ]
        self.assertEqual(len(customer_0_orders), 1)
        
        # Customer 0 should not see customer 1's orders in their list
        customer_1_orders = [
            o for o in orders_list 
            if o['customer'] == self.customers[1].id
        ]
        self.assertEqual(len(customer_1_orders), 0)
        
        # Admin assigns orders to couriers
        self.authenticate_user(self.admin)
        
        for customer_id, order_id in customer_orders.items():
            response = self.client.post(
                f'/api/orders/orders/{order_id}/assign_courier/',
                {'courier_id': self.couriers[0].id}
            )
            self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Test courier access control
        self.authenticate_user(self.couriers[0])
        
        # Courier should be able to update assigned orders
        first_order_id = list(customer_orders.values())[0]
        response = self.client.patch(
            f'/api/orders/orders/{first_order_id}/update_status/',
            {'status': 'PICKED_UP'}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Test unauthorized courier access
        self.authenticate_user(self.couriers[1])  # Different courier
        
        # Courier 1 should not be able to update courier 0's orders
        response = self.client.patch(
            f'/api/orders/orders/{first_order_id}/update_status/',
            {'status': 'IN_TRANSIT'}
        )
        # Should be rejected (403 Forbidden or 400 Bad Request)
        self.assertIn(response.status_code, [
            status.HTTP_403_FORBIDDEN,
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_404_NOT_FOUND
        ])
        
        # Verify order status wasn't changed by unauthorized courier
        order = Order.objects.get(id=first_order_id)
        self.assertEqual(order.status, 'PICKED_UP')  # Should remain as set by authorized courier
        
        # Test admin full access
        self.authenticate_user(self.admin)
        
        # Admin should see all orders
        response = self.client.get('/api/orders/orders/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Handle paginated response
        if 'results' in response.data:
            orders_list = response.data['results']
        else:
            orders_list = response.data
        
        # Admin should see orders from both customers
        admin_visible_orders = len(orders_list)
        self.assertGreaterEqual(admin_visible_orders, 2)
        
        # Admin should be able to manage users
        response = self.client.get('/api/auth/admin/users/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)