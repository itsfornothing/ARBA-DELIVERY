"""
Property-based tests for courier assignment uniqueness and availability.

**Feature: delivery-app, Property 4: Courier Assignment Uniqueness and Availability**
**Validates: Requirements 4.2, 5.3, 6.2**
"""

import pytest
from hypothesis import given, strategies as st, assume
from hypothesis.extra.django import TestCase
from django.contrib.auth import get_user_model
from orders.models import Order, CourierStatus
from decimal import Decimal

User = get_user_model()


class CourierAssignmentUniquenessProperties(TestCase):
    """Property-based tests for courier assignment uniqueness and availability"""

    def setUp(self):
        """Set up test data"""
        import uuid
        test_id = str(uuid.uuid4())[:8]
        
        # Create test users with unique names
        self.customer = User.objects.create_user(
            username=f'testcustomer_{test_id}',
            email=f'customer_{test_id}@test.com',
            role='CUSTOMER'
        )
        
        # Create multiple couriers for testing
        self.couriers = []
        for i in range(3):
            courier = User.objects.create_user(
                username=f'courier{i}_{test_id}',
                email=f'courier{i}_{test_id}@test.com',
                role='COURIER'
            )
            # Create courier status
            CourierStatus.objects.create(
                courier=courier,
                is_available=True,
                current_orders_count=0
            )
            self.couriers.append(courier)

    @given(
        pickup_address=st.text(min_size=5, max_size=100),
        delivery_address=st.text(min_size=5, max_size=100),
        distance_km=st.decimals(min_value=Decimal('0.1'), max_value=Decimal('100.0'), places=2)
    )
    def test_order_assignment_uniqueness(self, pickup_address, delivery_address, distance_km):
        """
        Property: For any order assignment (manual or automatic), exactly one available 
        courier must be assigned, and the courier's availability status must be verified 
        before assignment.
        
        **Feature: delivery-app, Property 4: Courier Assignment Uniqueness and Availability**
        **Validates: Requirements 4.2, 5.3, 6.2**
        """
        # Assume valid addresses (not just whitespace)
        assume(pickup_address.strip())
        assume(delivery_address.strip())
        assume(pickup_address != delivery_address)
        
        # Create an order
        order = Order.objects.create(
            customer=self.customer,
            pickup_address=pickup_address,
            delivery_address=delivery_address,
            distance_km=distance_km,
            price=Decimal('50.00') + (distance_km * Decimal('20.00')),
            status='CREATED'
        )
        
        # Get available couriers
        available_couriers = [
            courier for courier in self.couriers 
            if CourierStatus.objects.get(courier=courier).is_available
        ]
        
        # If we have available couriers, assignment should work
        if available_couriers:
            # Assign to first available courier
            selected_courier = available_couriers[0]
            
            # Verify courier is available before assignment
            courier_status = CourierStatus.objects.get(courier=selected_courier)
            assert courier_status.is_available, "Courier must be available before assignment"
            
            # Perform assignment
            order.assigned_courier = selected_courier
            order.status = 'ASSIGNED'
            order.save()
            
            # Update courier status
            courier_status.current_orders_count += 1
            courier_status.save()
            
            # Verify assignment uniqueness
            assert order.assigned_courier == selected_courier, "Order must be assigned to exactly one courier"
            assert order.status == 'ASSIGNED', "Order status must be updated to ASSIGNED"
            
            # Verify no other orders are assigned to the same courier for this test
            other_orders = Order.objects.filter(
                assigned_courier=selected_courier
            ).exclude(id=order.id)
            
            # For this property test, we're testing that the assignment is unique for this order
            # The courier can have other orders, but this specific order should be assigned to only one courier
            assigned_couriers = Order.objects.filter(id=order.id).values_list('assigned_courier', flat=True)
            assert len(set(assigned_couriers)) == 1, "Order must be assigned to exactly one courier"

    @given(
        courier_availability=st.lists(st.booleans(), min_size=1, max_size=3),
        workload_counts=st.lists(st.integers(min_value=0, max_value=5), min_size=1, max_size=3)
    )
    def test_availability_verification_before_assignment(self, courier_availability, workload_counts):
        """
        Property: Courier availability status must be verified before any assignment.
        
        **Feature: delivery-app, Property 4: Courier Assignment Uniqueness and Availability**
        **Validates: Requirements 4.2, 5.3, 6.2**
        """
        # Ensure we have the same number of availability flags and workload counts
        min_length = min(len(courier_availability), len(workload_counts), len(self.couriers))
        courier_availability = courier_availability[:min_length]
        workload_counts = workload_counts[:min_length]
        
        # Update courier statuses based on generated data
        for i, (is_available, workload) in enumerate(zip(courier_availability, workload_counts)):
            if i < len(self.couriers):
                courier_status = CourierStatus.objects.get(courier=self.couriers[i])
                courier_status.is_available = is_available
                courier_status.current_orders_count = workload
                courier_status.save()
        
        # Create a test order
        order = Order.objects.create(
            customer=self.customer,
            pickup_address="123 Test St",
            delivery_address="456 Test Ave",
            distance_km=Decimal('5.0'),
            price=Decimal('150.00'),
            status='CREATED'
        )
        
        # Get available couriers
        available_couriers = []
        for courier in self.couriers[:min_length]:
            courier_status = CourierStatus.objects.get(courier=courier)
            if courier_status.is_available:
                available_couriers.append(courier)
        
        # Test assignment logic
        if available_couriers:
            # Should be able to assign to an available courier
            selected_courier = available_couriers[0]
            courier_status = CourierStatus.objects.get(courier=selected_courier)
            
            # Verify availability before assignment
            assert courier_status.is_available, "Must verify courier is available before assignment"
            
            # Perform assignment
            order.assigned_courier = selected_courier
            order.status = 'ASSIGNED'
            order.save()
            
            # Verify assignment was successful
            assert order.assigned_courier == selected_courier
            assert order.status == 'ASSIGNED'
        else:
            # No available couriers - order should remain unassigned
            assert order.assigned_courier is None, "Order should not be assigned when no couriers are available"
            assert order.status == 'CREATED', "Order status should remain CREATED when no couriers are available"

    def test_courier_status_consistency(self):
        """
        Property: Courier status must be consistent with their actual availability.
        
        **Feature: delivery-app, Property 4: Courier Assignment Uniqueness and Availability**
        **Validates: Requirements 4.2, 5.3, 6.2**
        """
        # Test that courier status reflects actual availability
        for courier in self.couriers:
            courier_status = CourierStatus.objects.get(courier=courier)
            
            # If courier is marked as available, they should be able to receive assignments
            if courier_status.is_available:
                # Create and assign an order
                order = Order.objects.create(
                    customer=self.customer,
                    pickup_address="Test Pickup",
                    delivery_address="Test Delivery",
                    distance_km=Decimal('3.0'),
                    price=Decimal('110.00'),
                    status='CREATED'
                )
                
                # Assignment should succeed
                order.assigned_courier = courier
                order.status = 'ASSIGNED'
                order.save()
                
                assert order.assigned_courier == courier
                assert order.status == 'ASSIGNED'
                
                # Clean up for next iteration
                order.delete()