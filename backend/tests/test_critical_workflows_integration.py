"""
Integration tests for critical workflows in the delivery platform.

Tests focus on:
1. Complete order fulfillment workflow
2. User authentication and authorization flows
3. Real-time update and notification systems

**Feature: delivery-app, Critical Workflow Integration**
**Validates: All requirements validation**
"""

import pytest
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from accounts.models import User
from orders.models import Order, PricingConfig
from notifications.models import Notification
from decimal import Decimal
from django.contrib.auth import authenticate
from django.utils import timezone


class CriticalWorkflowIntegrationTests(TestCase):
    """Integration tests for critical system workflows"""
    
    def setUp(self):
        """Set up test environment"""
        self.client = APIClient()
        
        # Create test users first
        self.customer = User.objects.create_user(
            username='workflow_customer',
            email='customer@workflow.com',
            password='testpass123',
            role='CUSTOMER',
            phone_number='+1234567890'
        )
        
        self.courier = User.objects.create_user(
            username='workflow_courier',
            email='courier@workflow.com',
            password='testpass123',
            role='COURIER',
            phone_number='+1234567891'
        )
        
        self.admin = User.objects.create_user(
            username='workflow_admin',
            email='admin@workflow.com',
            password='testpass123',
            role='ADMIN',
            phone_number='+1234567892'
        )
        
        # Create pricing configuration with admin user
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
    
    def test_complete_order_fulfillment_workflow(self):
        """
        Test the complete order fulfillment workflow from creation to delivery:
        1. Customer creates order with proper pricing
        2. Order enters system with correct initial state
        3. Admin or system assigns courier
        4. Courier progresses through all delivery stages
        5. System maintains data integrity throughout
        6. All parties receive appropriate notifications
        """
        # Step 1: Customer order creation
        self.authenticate_user(self.customer)
        
        order_data = {
            'pickup_address': '123 Pickup Street, Downtown, City',
            'delivery_address': '456 Delivery Avenue, Uptown, City',
            'distance_km': '7.5'
        }
        
        # Create order
        response = self.client.post('/api/orders/orders/', order_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        order_id = response.data['id']
        order = Order.objects.get(id=order_id)
        
        # Verify order creation correctness
        self.assertEqual(order.status, 'CREATED')
        self.assertEqual(order.customer, self.customer)
        self.assertEqual(order.pickup_address, order_data['pickup_address'])
        self.assertEqual(order.delivery_address, order_data['delivery_address'])
        self.assertEqual(order.distance_km, Decimal('7.5'))
        
        # Verify pricing calculation: 50 + (7.5 * 20) = 200
        expected_price = Decimal('200.00')
        self.assertEqual(order.price, expected_price)
        self.assertEqual(response.data['price'], str(expected_price))
        
        # Verify initial timestamps
        self.assertIsNotNone(order.created_at)
        self.assertIsNone(order.assigned_at)
        self.assertIsNone(order.picked_up_at)
        self.assertIsNone(order.in_transit_at)
        self.assertIsNone(order.delivered_at)
        
        # Step 2: Admin assigns courier
        self.authenticate_user(self.admin)
        
        # Verify admin can see all orders
        response = self.client.get('/api/orders/orders/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Handle paginated response
        if 'results' in response.data:
            orders_list = response.data['results']
        else:
            orders_list = response.data
        order_found = any(o['id'] == order_id for o in orders_list)
        self.assertTrue(order_found)
        
        # Assign courier
        assign_data = {'courier_id': self.courier.id}
        response = self.client.post(f'/api/orders/orders/{order_id}/assign_courier/', assign_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        order.refresh_from_db()
        self.assertEqual(order.status, 'ASSIGNED')
        self.assertEqual(order.assigned_courier, self.courier)
        self.assertIsNotNone(order.assigned_at)
        
        # Step 3: Courier workflow progression
        self.authenticate_user(self.courier)
        
        # Courier can see assigned orders
        response = self.client.get('/api/orders/orders/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Handle paginated response
        if 'results' in response.data:
            orders_list = response.data['results']
        else:
            orders_list = response.data
        assigned_orders = [o for o in orders_list if o.get('assigned_courier') == self.courier.id]
        self.assertEqual(len(assigned_orders), 1)
        self.assertEqual(assigned_orders[0]['id'], order_id)
        
        # Progress through delivery stages
        delivery_stages = [
            ('PICKED_UP', 'picked_up_at'),
            ('IN_TRANSIT', 'in_transit_at'),
            ('DELIVERED', 'delivered_at')
        ]
        
        for status_name, timestamp_field in delivery_stages:
            # Update status
            response = self.client.patch(f'/api/orders/orders/{order_id}/update_status/', {'status': status_name})
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            
            # Verify status and timestamp update
            order.refresh_from_db()
            self.assertEqual(order.status, status_name)
            self.assertIsNotNone(getattr(order, timestamp_field))
            
            # Verify response data
            self.assertEqual(response.data['status'], status_name)
        
        # Step 4: Verify final state
        order.refresh_from_db()
        self.assertEqual(order.status, 'DELIVERED')
        
        # All timestamps should be set
        self.assertIsNotNone(order.created_at)
        self.assertIsNotNone(order.assigned_at)
        self.assertIsNotNone(order.picked_up_at)
        self.assertIsNotNone(order.in_transit_at)
        self.assertIsNotNone(order.delivered_at)
        
        # Verify timestamp ordering
        self.assertLess(order.created_at, order.assigned_at)
        self.assertLess(order.assigned_at, order.picked_up_at)
        self.assertLess(order.picked_up_at, order.in_transit_at)
        self.assertLess(order.in_transit_at, order.delivered_at)
        
        # Step 5: Verify notifications were created
        notifications = Notification.objects.filter(
            user__in=[self.customer, self.courier]
        )
        self.assertGreaterEqual(notifications.count(), 3)  # Assignment, pickup, delivery minimum
        
        # Customer should receive notifications
        customer_notifications = notifications.filter(user=self.customer)
        self.assertGreaterEqual(customer_notifications.count(), 2)
        
        # Courier should receive assignment notification
        courier_notifications = notifications.filter(user=self.courier)
        self.assertGreaterEqual(courier_notifications.count(), 1)
    
    def test_user_authentication_and_authorization_flows(self):
        """
        Test comprehensive authentication and authorization workflows:
        1. User registration and login
        2. JWT token generation and validation
        3. Role-based access control
        4. Session management
        5. Permission enforcement
        """
        # Step 1: Test user registration
        registration_data = {
            'username': 'new_test_user',
            'email': 'newuser@test.com',
            'password': 'securepass123',
            'password_confirm': 'securepass123',
            'first_name': 'Test',
            'last_name': 'User',
            'role': 'CUSTOMER',
            'phone_number': '+1987654321'
        }
        
        response = self.client.post('/api/auth/register/', registration_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify user was created
        new_user = User.objects.get(username='new_test_user')
        self.assertEqual(new_user.email, 'newuser@test.com')
        self.assertEqual(new_user.role, 'CUSTOMER')
        self.assertTrue(new_user.is_active)
        
        # Step 2: Test user login
        login_data = {
            'username': 'new_test_user',
            'password': 'securepass123'
        }
        
        response = self.client.post('/api/auth/login/', login_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify JWT tokens are returned
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        
        access_token = response.data['access']
        
        # Step 3: Test authenticated access
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        
        # Should be able to access profile
        response = self.client.get('/api/auth/profile/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'new_test_user')
        
        # Step 4: Test role-based access control
        # Customer should access customer endpoints
        response = self.client.get('/api/orders/orders/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Customer should NOT access admin endpoints
        response = self.client.get('/api/auth/admin/users/')
        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_401_UNAUTHORIZED])
        
        # Step 5: Test admin access
        self.authenticate_user(self.admin)
        
        # Admin should access admin endpoints
        response = self.client.get('/api/auth/admin/users/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Admin should access all order management
        response = self.client.get('/api/orders/orders/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Step 6: Test courier access
        self.authenticate_user(self.courier)
        
        # Courier should access orders
        response = self.client.get('/api/orders/orders/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Courier should NOT access admin endpoints
        response = self.client.get('/api/auth/admin/users/')
        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_401_UNAUTHORIZED])
        
        # Step 7: Test unauthenticated access
        self.client.credentials()  # Clear authentication
        
        # Should be denied access to protected endpoints
        protected_endpoints = [
            '/api/orders/orders/',
            '/api/auth/profile/',
            '/api/auth/admin/users/',
            '/analytics/dashboard/'
        ]
        
        for endpoint in protected_endpoints:
            response = self.client.get(endpoint)
            # Accept various authentication failure responses
            self.assertIn(response.status_code, [
                status.HTTP_401_UNAUTHORIZED, 
                status.HTTP_403_FORBIDDEN,
                status.HTTP_302_FOUND  # Django redirects for some endpoints
            ])
    
    def test_real_time_update_and_notification_systems(self):
        """
        Test real-time update and notification systems:
        1. Order status changes trigger notifications
        2. Notifications contain correct information
        3. Multiple users receive appropriate notifications
        4. Notification delivery is reliable
        5. System handles notification failures gracefully
        """
        # Step 1: Create order and track initial state
        self.authenticate_user(self.customer)
        
        order_data = {
            'pickup_address': '789 Notification Test St, City, State',
            'delivery_address': '321 Update Test Ave, City, State',
            'distance_km': '4.2'
        }
        
        initial_notification_count = Notification.objects.count()
        
        response = self.client.post('/api/orders/orders/', order_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        order_id = response.data['id']
        
        # Step 2: Test assignment notifications
        self.authenticate_user(self.admin)
        
        assign_data = {'courier_id': self.courier.id}
        response = self.client.post(f'/api/orders/orders/{order_id}/assign_courier/', assign_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify assignment notifications were created
        if initial_notification_count > 0:
            last_notification = Notification.objects.filter(
                id__lte=initial_notification_count
            ).last()
            assignment_notifications = Notification.objects.filter(
                created_at__gt=last_notification.created_at
            )
        else:
            assignment_notifications = Notification.objects.filter(
                created_at__gt=timezone.datetime(2024, 1, 1, tzinfo=timezone.utc)
            )
        
        self.assertGreater(assignment_notifications.count(), 0)
        
        # Verify customer received assignment notification
        customer_assignment_notifications = assignment_notifications.filter(
            user=self.customer
        )
        self.assertGreater(customer_assignment_notifications.count(), 0)
        
        # Verify courier received assignment notification
        courier_assignment_notifications = assignment_notifications.filter(
            user=self.courier
        )
        self.assertGreater(courier_assignment_notifications.count(), 0)
        
        # Step 3: Test status update notifications
        self.authenticate_user(self.courier)
        
        status_updates = ['PICKED_UP', 'IN_TRANSIT', 'DELIVERED']
        
        for status_update in status_updates:
            pre_update_count = Notification.objects.count()
            
            # Update status
            response = self.client.patch(f'/api/orders/orders/{order_id}/update_status/', {'status': status_update})
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            
            # Verify notifications were created for status update
            post_update_count = Notification.objects.count()
            self.assertGreater(post_update_count, pre_update_count)
            
            # Verify customer received status update notification
            if pre_update_count > 0:
                last_notification = Notification.objects.filter(
                    id__lte=pre_update_count
                ).last()
                recent_notifications = Notification.objects.filter(
                    user=self.customer,
                    created_at__gt=last_notification.created_at
                )
            else:
                recent_notifications = Notification.objects.filter(
                    user=self.customer,
                    created_at__gt=timezone.datetime(2024, 1, 1, tzinfo=timezone.utc)
                )
            
            self.assertGreater(recent_notifications.count(), 0)
            
            # Verify notification contains order information
            status_notification = recent_notifications.first()
            self.assertIsNotNone(status_notification.related_order)
            self.assertEqual(status_notification.related_order.id, order_id)
        
        # Step 4: Test notification content accuracy
        final_notifications = Notification.objects.filter(
            user=self.customer,
            related_order_id=order_id
        ).order_by('created_at')
        
        self.assertGreaterEqual(final_notifications.count(), 3)  # Assignment + status updates
        
        # Verify notifications have proper content
        for notification in final_notifications:
            self.assertIsNotNone(notification.title)
            self.assertIsNotNone(notification.message)
            self.assertEqual(notification.related_order.id, order_id)
            self.assertFalse(notification.is_read)  # Should start as unread
        
        # Step 5: Test notification retrieval
        self.authenticate_user(self.customer)
        
        response = self.client.get('/notifications/api/notifications/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Customer should see their notifications
        # Handle paginated response
        if 'results' in response.data:
            notifications_list = response.data['results']
        else:
            notifications_list = response.data
        customer_notifications = [n for n in notifications_list if n.get('related_order') == order_id]
        self.assertGreaterEqual(len(customer_notifications), 1)  # At least assignment notification
        
        # Step 6: Test notification marking as read
        if customer_notifications:
            notification_id = customer_notifications[0]['id']
            
            response = self.client.patch(f'/notifications/api/notifications/{notification_id}/', {'is_read': True})
            self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify notification was marked as read
        notification = Notification.objects.get(id=notification_id)
        self.assertTrue(notification.is_read)
    
    def test_pricing_and_configuration_workflow(self):
        """
        Test pricing calculation and configuration management workflow:
        1. Orders use current active pricing
        2. Pricing updates don't affect existing orders
        3. New orders use updated pricing
        4. Configuration changes are properly isolated
        """
        # Step 1: Create order with initial pricing
        self.authenticate_user(self.customer)
        
        order_data = {
            'pickup_address': '100 Pricing Test St, City, State',
            'delivery_address': '200 Config Test Ave, City, State',
            'distance_km': '5.0'
        }
        
        response = self.client.post('/api/orders/orders/', order_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        first_order_id = response.data['id']
        first_order = Order.objects.get(id=first_order_id)
        
        # Verify initial pricing: 50 + (5.0 * 20) = 150
        expected_initial_price = Decimal('150.00')
        self.assertEqual(first_order.price, expected_initial_price)
        
        # Step 2: Admin updates pricing configuration
        self.authenticate_user(self.admin)
        
        new_pricing_data = {
            'base_fee': '75.00',
            'per_km_rate': '30.00'
        }
        
        response = self.client.post('/api/orders/pricing-config/', new_pricing_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify new configuration is active
        new_config = PricingConfig.objects.filter(is_active=True).first()
        self.assertEqual(new_config.base_fee, Decimal('75.00'))
        self.assertEqual(new_config.per_km_rate, Decimal('30.00'))
        
        # Verify old configuration is deactivated
        old_config = PricingConfig.objects.filter(
            base_fee=Decimal('50.00'),
            per_km_rate=Decimal('20.00')
        ).first()
        self.assertFalse(old_config.is_active)
        
        # Step 3: Verify existing order price unchanged
        first_order.refresh_from_db()
        self.assertEqual(first_order.price, expected_initial_price)  # Should not change
        
        # Step 4: Create new order with updated pricing
        self.authenticate_user(self.customer)
        
        response = self.client.post('/api/orders/orders/', order_data)  # Same order data
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        second_order_id = response.data['id']
        second_order = Order.objects.get(id=second_order_id)
        
        # Verify new pricing: 75 + (5.0 * 30) = 225
        expected_new_price = Decimal('225.00')
        self.assertEqual(second_order.price, expected_new_price)
        
        # Step 5: Verify pricing isolation
        self.assertNotEqual(first_order.price, second_order.price)
        self.assertEqual(first_order.price, expected_initial_price)
        self.assertEqual(second_order.price, expected_new_price)
    
    def test_system_error_handling_and_recovery(self):
        """
        Test system error handling and recovery mechanisms:
        1. Invalid data validation
        2. Unauthorized access handling
        3. Invalid state transitions
        4. Data integrity maintenance
        5. Graceful error responses
        """
        # Step 1: Test invalid order data validation
        self.authenticate_user(self.customer)
        
        invalid_orders = [
            {
                'pickup_address': '',  # Empty address
                'delivery_address': '456 Oak Ave, City, State',
                'distance_km': '5.0'
            },
            {
                'pickup_address': '123 Main St, City, State',
                'delivery_address': '',  # Empty address
                'distance_km': '5.0'
            },
            {
                'pickup_address': '123 Main St, City, State',
                'delivery_address': '456 Oak Ave, City, State',
                'distance_km': '-1.0'  # Negative distance
            },
            {
                'pickup_address': '123 Main St, City, State',
                'delivery_address': '456 Oak Ave, City, State',
                'distance_km': '0'  # Zero distance
            }
        ]
        
        for invalid_data in invalid_orders:
            response = self.client.post('/api/orders/orders/', invalid_data)
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
            # Check for validation errors in various formats
            self.assertTrue(
                'error' in (response.data or {}) or 
                any(field in (response.data or {}) for field in ['pickup_address', 'delivery_address', 'distance_km'])
            )
        
        # Step 2: Test unauthorized access handling
        self.client.credentials()  # Clear authentication
        
        unauthorized_endpoints = [
            ('GET', '/api/orders/orders/'),
            ('POST', '/api/orders/orders/'),
            ('GET', '/api/auth/profile/'),
            ('GET', '/api/auth/admin/users/'),
            ('POST', '/api/orders/pricing-config/')
        ]
        
        for method, endpoint in unauthorized_endpoints:
            if method == 'GET':
                response = self.client.get(endpoint)
            elif method == 'POST':
                response = self.client.post(endpoint, {})
            
            self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # Step 3: Test invalid status transitions
        self.authenticate_user(self.customer)
        
        # Create valid order
        order_data = {
            'pickup_address': '123 Error Test St, City, State',
            'delivery_address': '456 Recovery Ave, City, State',
            'distance_km': '3.0'
        }
        
        response = self.client.post('/api/orders/orders/', order_data)
        order_id = response.data['id']
        
        # Try invalid status transitions
        self.authenticate_user(self.courier)
        
        invalid_transitions = [
            'DELIVERED',  # Skip intermediate steps
            'INVALID_STATUS',  # Non-existent status
            'IN_TRANSIT'  # Skip PICKED_UP
        ]
        
        for invalid_status in invalid_transitions:
            response = self.client.patch(f'/api/orders/orders/{order_id}/update_status/', {'status': invalid_status})
            # Accept various error responses for invalid transitions
            self.assertIn(response.status_code, [
                status.HTTP_400_BAD_REQUEST, 
                status.HTTP_403_FORBIDDEN,
                status.HTTP_404_NOT_FOUND
            ])
        
        # Verify order state wasn't corrupted
        order = Order.objects.get(id=order_id)
        self.assertEqual(order.status, 'CREATED')  # Should remain unchanged
        
        # Step 4: Test role-based access violations
        # Customer trying to assign courier (this might be allowed in some implementations)
        self.authenticate_user(self.customer)
        
        response = self.client.patch(f'/api/orders/orders/{order_id}/', {'courier_id': self.courier.id})
        # The response might be 200 if the field is ignored, or error if not allowed
        self.assertIn(response.status_code, [
            status.HTTP_200_OK,  # Field might be ignored
            status.HTTP_403_FORBIDDEN,
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_405_METHOD_NOT_ALLOWED
        ])
        
        # Verify that even if the request succeeded, the courier wasn't actually assigned
        order = Order.objects.get(id=order_id)
        self.assertEqual(order.status, 'CREATED')  # Should remain unchanged
        self.assertIsNone(order.assigned_courier)  # Should not be assigned
        
        # Courier trying to access admin functions
        self.authenticate_user(self.courier)
        
        response = self.client.get('/api/auth/admin/users/')
        self.assertIn(response.status_code, [
            status.HTTP_403_FORBIDDEN,
            status.HTTP_401_UNAUTHORIZED
        ])
        
        # Step 5: Verify system maintains data integrity
        # Check that failed operations didn't corrupt data
        order = Order.objects.get(id=order_id)
        self.assertEqual(order.status, 'CREATED')
        self.assertIsNone(order.assigned_courier)
        self.assertIsNone(order.assigned_at)
        
        # Verify user data integrity (may include users created in other tests)
        users_count = User.objects.count()
        self.assertGreaterEqual(users_count, 3)  # At least the original test users
        
        # Verify pricing config integrity (may have multiple from other tests)
        active_configs = PricingConfig.objects.filter(is_active=True)
        self.assertGreaterEqual(active_configs.count(), 1)  # At least one active config