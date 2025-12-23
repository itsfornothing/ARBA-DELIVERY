"""
Integration tests for order management API endpoints
"""

import pytest
from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from orders.models import Order, PricingConfig, CourierStatus

User = get_user_model()


class TestOrderAPIIntegration(TestCase):
    """Integration tests for order management API"""

    def setUp(self):
        """Set up test data"""
        # Create test users
        self.customer = User.objects.create_user(
            username='testcustomer',
            email='customer@test.com',
            password='testpass123',
            role='CUSTOMER',
            first_name='Test',
            last_name='Customer'
        )
        
        self.courier = User.objects.create_user(
            username='testcourier',
            email='courier@test.com',
            password='testpass123',
            role='COURIER',
            first_name='Test',
            last_name='Courier'
        )
        
        self.admin = User.objects.create_user(
            username='testadmin',
            email='admin@test.com',
            password='testpass123',
            role='ADMIN',
            first_name='Test',
            last_name='Admin'
        )
        
        # Create pricing configuration
        self.pricing_config = PricingConfig.objects.create(
            base_fee=Decimal('50.00'),
            per_km_rate=Decimal('20.00'),
            is_active=True,
            created_by=self.admin
        )
        
        # Create courier status
        self.courier_status = CourierStatus.objects.create(
            courier=self.courier,
            is_available=True,
            current_orders_count=0
        )
        
        self.client = APIClient()

    def test_customer_can_create_order(self):
        """Test that customers can create orders"""
        self.client.force_authenticate(user=self.customer)
        
        order_data = {
            'pickup_address': '123 Test Pickup St',
            'delivery_address': '456 Test Delivery Ave',
            'distance_km': '5.0'
        }
        
        response = self.client.post('/api/orders/orders/', order_data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['customer'], self.customer.id)
        self.assertEqual(response.data['pickup_address'], '123 Test Pickup St')
        self.assertEqual(response.data['delivery_address'], '456 Test Delivery Ave')
        self.assertEqual(Decimal(response.data['distance_km']), Decimal('5.0'))
        self.assertEqual(Decimal(response.data['price']), Decimal('150.00'))  # 50 + (5 * 20)
        self.assertEqual(response.data['status'], 'ASSIGNED')  # Auto-assigned to available courier

    def test_courier_can_view_available_orders(self):
        """Test that couriers can view available orders"""
        # Create an unassigned order
        order = Order.objects.create(
            customer=self.customer,
            pickup_address='123 Test Pickup St',
            delivery_address='456 Test Delivery Ave',
            distance_km=Decimal('5.0'),
            price=Decimal('150.00'),
            status='CREATED'
        )
        
        self.client.force_authenticate(user=self.courier)
        
        response = self.client.get('/api/orders/orders/available_orders/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], order.id)

    def test_courier_can_accept_order(self):
        """Test that couriers can accept available orders"""
        # Create an unassigned order
        order = Order.objects.create(
            customer=self.customer,
            pickup_address='123 Test Pickup St',
            delivery_address='456 Test Delivery Ave',
            distance_km=Decimal('5.0'),
            price=Decimal('150.00'),
            status='CREATED'
        )
        
        self.client.force_authenticate(user=self.courier)
        
        response = self.client.post(f'/api/orders/orders/{order.id}/accept_order/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'ASSIGNED')
        self.assertEqual(response.data['assigned_courier'], self.courier.id)

    def test_courier_can_update_order_status(self):
        """Test that couriers can update order status"""
        # Create an assigned order
        order = Order.objects.create(
            customer=self.customer,
            assigned_courier=self.courier,
            pickup_address='123 Test Pickup St',
            delivery_address='456 Test Delivery Ave',
            distance_km=Decimal('5.0'),
            price=Decimal('150.00'),
            status='ASSIGNED'
        )
        
        self.client.force_authenticate(user=self.courier)
        
        # Update to PICKED_UP
        response = self.client.patch(f'/api/orders/orders/{order.id}/update_status/', {'status': 'PICKED_UP'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'PICKED_UP')

    def test_admin_can_manually_assign_courier(self):
        """Test that admins can manually assign couriers to orders"""
        # Create an unassigned order
        order = Order.objects.create(
            customer=self.customer,
            pickup_address='123 Test Pickup St',
            delivery_address='456 Test Delivery Ave',
            distance_km=Decimal('5.0'),
            price=Decimal('150.00'),
            status='CREATED'
        )
        
        self.client.force_authenticate(user=self.admin)
        
        response = self.client.post(f'/api/orders/orders/{order.id}/assign_courier/', {'courier_id': self.courier.id})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'ASSIGNED')
        self.assertEqual(response.data['assigned_courier'], self.courier.id)

    def test_admin_can_manage_pricing_config(self):
        """Test that admins can manage pricing configuration"""
        self.client.force_authenticate(user=self.admin)
        
        # Create new pricing config
        pricing_data = {
            'base_fee': '60.00',
            'per_km_rate': '25.00'
        }
        
        response = self.client.post('/api/orders/pricing-config/', pricing_data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Decimal(response.data['base_fee']), Decimal('60.00'))
        self.assertEqual(Decimal(response.data['per_km_rate']), Decimal('25.00'))
        self.assertTrue(response.data['is_active'])

    def test_customer_cannot_access_admin_endpoints(self):
        """Test that customers cannot access admin-only endpoints"""
        self.client.force_authenticate(user=self.customer)
        
        # Try to create pricing config
        response = self.client.post('/api/orders/pricing-config/', {'base_fee': '60.00', 'per_km_rate': '25.00'})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Try to manually assign courier
        order = Order.objects.create(
            customer=self.customer,
            pickup_address='123 Test Pickup St',
            delivery_address='456 Test Delivery Ave',
            distance_km=Decimal('5.0'),
            price=Decimal('150.00'),
            status='CREATED'
        )
        
        response = self.client.post(f'/api/orders/orders/{order.id}/assign_courier/', {'courier_id': self.courier.id})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_order_lifecycle_complete_flow(self):
        """Test complete order lifecycle from creation to delivery"""
        # Customer creates order
        self.client.force_authenticate(user=self.customer)
        
        order_data = {
            'pickup_address': '123 Test Pickup St',
            'delivery_address': '456 Test Delivery Ave',
            'distance_km': '5.0'
        }
        
        response = self.client.post('/api/orders/orders/', order_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        order_id = response.data['id']
        
        # Courier updates status through lifecycle
        self.client.force_authenticate(user=self.courier)
        
        # ASSIGNED -> PICKED_UP
        response = self.client.patch(f'/api/orders/orders/{order_id}/update_status/', {'status': 'PICKED_UP'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'PICKED_UP')
        
        # PICKED_UP -> IN_TRANSIT
        response = self.client.patch(f'/api/orders/orders/{order_id}/update_status/', {'status': 'IN_TRANSIT'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'IN_TRANSIT')
        
        # IN_TRANSIT -> DELIVERED
        response = self.client.patch(f'/api/orders/orders/{order_id}/update_status/', {'status': 'DELIVERED'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'DELIVERED')
        
        # Verify timestamps are set
        self.assertIsNotNone(response.data['assigned_at'])
        self.assertIsNotNone(response.data['picked_up_at'])
        self.assertIsNotNone(response.data['in_transit_at'])
        self.assertIsNotNone(response.data['delivered_at'])

    def test_invalid_status_transitions_rejected(self):
        """Test that invalid status transitions are rejected"""
        # Create an assigned order
        order = Order.objects.create(
            customer=self.customer,
            assigned_courier=self.courier,
            pickup_address='123 Test Pickup St',
            delivery_address='456 Test Delivery Ave',
            distance_km=Decimal('5.0'),
            price=Decimal('150.00'),
            status='ASSIGNED'
        )
        
        self.client.force_authenticate(user=self.courier)
        
        # Try to skip from ASSIGNED to DELIVERED (invalid)
        response = self.client.patch(f'/api/orders/orders/{order.id}/update_status/', {'status': 'DELIVERED'})
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('status', response.data)