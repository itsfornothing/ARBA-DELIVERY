"""
Property-based tests for order status progression validity

**Feature: delivery-app, Property 2: Order Status Progression Validity**
For any order status update, the transition must follow the valid sequence: 
CREATED → ASSIGNED → PICKED_UP → IN_TRANSIT → DELIVERED, with no invalid transitions allowed
**Validates: Requirements 8.4, 3.4**
"""

import pytest
from hypothesis import given, strategies as st, settings
from hypothesis.extra.django import TestCase
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.utils import timezone
from orders.models import Order, PricingConfig, CourierStatus
from orders.serializers import OrderStatusUpdateSerializer

User = get_user_model()


class TestOrderStatusProgressionProperties(TestCase):
    """Property-based tests for order status progression validity"""

    def setUp(self):
        """Set up test data"""
        import uuid
        unique_id = str(uuid.uuid4())[:8]
        
        # Create test users with unique names
        self.customer = User.objects.create_user(
            username=f'testcustomer_{unique_id}',
            email=f'customer_{unique_id}@test.com',
            password='testpass123',
            role='CUSTOMER',
            first_name='Test',
            last_name='Customer'
        )
        
        self.courier = User.objects.create_user(
            username=f'testcourier_{unique_id}',
            email=f'courier_{unique_id}@test.com',
            password='testpass123',
            role='COURIER',
            first_name='Test',
            last_name='Courier'
        )
        
        self.admin = User.objects.create_user(
            username=f'testadmin_{unique_id}',
            email=f'admin_{unique_id}@test.com',
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

    def create_test_order(self, status='CREATED', assigned_courier=None):
        """Helper method to create test order"""
        order = Order.objects.create(
            customer=self.customer,
            assigned_courier=assigned_courier,
            pickup_address='123 Test Pickup St',
            delivery_address='456 Test Delivery Ave',
            distance_km=Decimal('5.0'),
            price=Decimal('150.00'),
            status=status
        )
        
        # Set appropriate timestamps based on status
        if status == 'ASSIGNED':
            order.assigned_at = timezone.now()
        elif status == 'PICKED_UP':
            order.assigned_at = timezone.now()
            order.picked_up_at = timezone.now()
        elif status == 'IN_TRANSIT':
            order.assigned_at = timezone.now()
            order.picked_up_at = timezone.now()
            order.in_transit_at = timezone.now()
        elif status == 'DELIVERED':
            order.assigned_at = timezone.now()
            order.picked_up_at = timezone.now()
            order.in_transit_at = timezone.now()
            order.delivered_at = timezone.now()
        
        order.save()
        return order

    @given(
        initial_status=st.sampled_from(['CREATED', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT']),
        target_status=st.sampled_from(['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'])
    )
    @settings(max_examples=100, deadline=None)
    def test_valid_status_transitions_property(self, initial_status, target_status):
        """
        Property 2: Order Status Progression Validity
        Test that valid status transitions are allowed and invalid ones are rejected
        """
        # Define valid transitions
        valid_transitions = {
            'CREATED': ['ASSIGNED', 'CANCELLED'],
            'ASSIGNED': ['PICKED_UP', 'CANCELLED'],
            'PICKED_UP': ['IN_TRANSIT', 'CANCELLED'],
            'IN_TRANSIT': ['DELIVERED', 'CANCELLED'],
            'DELIVERED': [],  # Final state
            'CANCELLED': []   # Final state
        }
        
        # Create order with initial status
        assigned_courier = self.courier if initial_status != 'CREATED' else None
        order = self.create_test_order(status=initial_status, assigned_courier=assigned_courier)
        
        # Test status transition
        serializer = OrderStatusUpdateSerializer(
            order, 
            data={'status': target_status}, 
            partial=True
        )
        
        is_valid_transition = target_status in valid_transitions.get(initial_status, [])
        
        if is_valid_transition:
            # Valid transition should succeed
            assert serializer.is_valid(), f"Valid transition from {initial_status} to {target_status} should be allowed. Errors: {serializer.errors}"
            
            # Save and verify the transition
            updated_order = serializer.save()
            assert updated_order.status == target_status, f"Order status should be updated to {target_status}"
            
            # Verify appropriate timestamp is set
            if target_status == 'ASSIGNED':
                assert updated_order.assigned_at is not None, "assigned_at should be set when status is ASSIGNED"
            elif target_status == 'PICKED_UP':
                assert updated_order.picked_up_at is not None, "picked_up_at should be set when status is PICKED_UP"
            elif target_status == 'IN_TRANSIT':
                assert updated_order.in_transit_at is not None, "in_transit_at should be set when status is IN_TRANSIT"
            elif target_status == 'DELIVERED':
                assert updated_order.delivered_at is not None, "delivered_at should be set when status is DELIVERED"
        else:
            # Invalid transition should fail
            assert not serializer.is_valid(), f"Invalid transition from {initial_status} to {target_status} should be rejected"
            assert 'status' in serializer.errors, "Status field should have validation error"

    @given(
        status_sequence=st.lists(
            st.sampled_from(['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED']),
            min_size=2,
            max_size=4,
            unique=True
        )
    )
    @settings(max_examples=50, deadline=None)
    def test_sequential_status_progression_property(self, status_sequence):
        """
        Property 2: Order Status Progression Validity
        Test that sequential status updates follow the correct order
        """
        # Define the correct order
        correct_order = ['CREATED', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED']
        
        # Create order in CREATED status
        order = self.create_test_order(status='CREATED')
        
        # Sort the sequence to follow correct progression
        sorted_sequence = sorted(status_sequence, key=lambda x: correct_order.index(x))
        
        current_status = 'CREATED'
        
        for next_status in sorted_sequence:
            # Skip if trying to go backwards or stay the same
            if correct_order.index(next_status) <= correct_order.index(current_status):
                continue
            
            # Assign courier if transitioning from CREATED to ASSIGNED
            if current_status == 'CREATED' and next_status == 'ASSIGNED':
                order.assigned_courier = self.courier
                order.save()
            
            # Test the transition
            serializer = OrderStatusUpdateSerializer(
                order, 
                data={'status': next_status}, 
                partial=True
            )
            
            # Check if this is a valid single-step transition
            valid_transitions = {
                'CREATED': ['ASSIGNED', 'CANCELLED'],
                'ASSIGNED': ['PICKED_UP', 'CANCELLED'],
                'PICKED_UP': ['IN_TRANSIT', 'CANCELLED'],
                'IN_TRANSIT': ['DELIVERED', 'CANCELLED'],
            }
            
            is_valid = next_status in valid_transitions.get(current_status, [])
            
            if is_valid:
                assert serializer.is_valid(), f"Transition from {current_status} to {next_status} should be valid"
                order = serializer.save()
                current_status = next_status
            else:
                # Should reject invalid transitions (skipping steps)
                assert not serializer.is_valid(), f"Transition from {current_status} to {next_status} should be invalid (skipping steps)"

    @given(
        final_status=st.sampled_from(['DELIVERED', 'CANCELLED']),
        attempted_status=st.sampled_from(['CREATED', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'])
    )
    @settings(max_examples=50, deadline=None)
    def test_final_status_immutability_property(self, final_status, attempted_status):
        """
        Property 2: Order Status Progression Validity
        Test that final statuses (DELIVERED, CANCELLED) cannot be changed
        """
        # Create order in final status
        order = self.create_test_order(status=final_status, assigned_courier=self.courier)
        
        # Try to change status from final state
        serializer = OrderStatusUpdateSerializer(
            order, 
            data={'status': attempted_status}, 
            partial=True
        )
        
        # Final statuses should not allow any transitions
        assert not serializer.is_valid(), f"Orders in {final_status} status should not allow transition to {attempted_status}"
        assert 'status' in serializer.errors, "Status field should have validation error"

    @given(
        pickup_address=st.text(min_size=1, max_size=100, alphabet=st.characters(blacklist_categories=['Cc', 'Cs'])).filter(lambda x: x.strip()),
        delivery_address=st.text(min_size=1, max_size=100, alphabet=st.characters(blacklist_categories=['Cc', 'Cs'])).filter(lambda x: x.strip()),
        distance_km=st.decimals(min_value=Decimal('0.1'), max_value=Decimal('100.0'), places=2)
    )
    @settings(max_examples=50, deadline=None)
    def test_complete_order_lifecycle_property(self, pickup_address, delivery_address, distance_km):
        """
        Property 2: Order Status Progression Validity
        Test complete order lifecycle from creation to delivery
        """
        # Ensure addresses are different
        if pickup_address.strip().lower() == delivery_address.strip().lower():
            delivery_address = delivery_address + " (different)"
        
        # Create order
        order = Order.objects.create(
            customer=self.customer,
            pickup_address=pickup_address.strip(),
            delivery_address=delivery_address.strip(),
            distance_km=distance_km,
            price=self.pricing_config.base_fee + (distance_km * self.pricing_config.per_km_rate),
            status='CREATED'
        )
        
        # Test complete lifecycle: CREATED → ASSIGNED → PICKED_UP → IN_TRANSIT → DELIVERED
        lifecycle_steps = [
            ('ASSIGNED', self.courier),
            ('PICKED_UP', None),
            ('IN_TRANSIT', None),
            ('DELIVERED', None)
        ]
        
        for target_status, courier_to_assign in lifecycle_steps:
            # Assign courier if needed
            if courier_to_assign and not order.assigned_courier:
                order.assigned_courier = courier_to_assign
                order.save()
            
            # Update status
            serializer = OrderStatusUpdateSerializer(
                order, 
                data={'status': target_status}, 
                partial=True
            )
            
            assert serializer.is_valid(), f"Lifecycle step to {target_status} should be valid. Errors: {serializer.errors}"
            order = serializer.save()
            
            # Verify status was updated
            assert order.status == target_status, f"Order status should be {target_status}"
        
        # Verify final state
        assert order.status == 'DELIVERED', "Order should end in DELIVERED status"
        assert order.assigned_at is not None, "Order should have assigned timestamp"
        assert order.picked_up_at is not None, "Order should have picked up timestamp"
        assert order.in_transit_at is not None, "Order should have in transit timestamp"
        assert order.delivered_at is not None, "Order should have delivered timestamp"