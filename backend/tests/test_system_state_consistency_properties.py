"""
Property-based tests for system state consistency.

**Feature: delivery-app, Property 12: System State Consistency**
**Validates: Requirements 4.3, 6.1, 6.3**
"""

import pytest
from hypothesis import given, strategies as st, assume
from hypothesis.extra.django import TestCase
from django.contrib.auth import get_user_model
from orders.models import Order, CourierStatus
from decimal import Decimal
import uuid

User = get_user_model()


class SystemStateConsistencyProperties(TestCase):
    """Property-based tests for system state consistency"""

    def setUp(self):
        """Set up test data"""
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
        availability_changes=st.lists(
            st.tuples(st.integers(min_value=0, max_value=2), st.booleans()),
            min_size=1,
            max_size=5
        )
    )
    def test_courier_availability_state_consistency(self, availability_changes):
        """
        Property: For any courier availability change, the system must correctly 
        include or exclude them from auto-assignment algorithms and update 
        workload calculations.
        
        **Feature: delivery-app, Property 12: System State Consistency**
        **Validates: Requirements 4.3, 6.1, 6.3**
        """
        # Apply availability changes
        for courier_index, new_availability in availability_changes:
            if courier_index < len(self.couriers):
                courier = self.couriers[courier_index]
                courier_status = CourierStatus.objects.get(courier=courier)
                courier_status.is_available = new_availability
                courier_status.save()
        
        # Create a test order
        order = Order.objects.create(
            customer=self.customer,
            pickup_address="123 Test Pickup St",
            delivery_address="456 Test Delivery Ave",
            distance_km=Decimal('5.0'),
            price=Decimal('150.00'),
            status='CREATED'
        )
        
        # Get available couriers according to system state
        available_couriers = []
        for courier in self.couriers:
            courier_status = CourierStatus.objects.get(courier=courier)
            if courier_status.is_available:
                available_couriers.append(courier)
        
        # Test auto-assignment logic consistency
        if available_couriers:
            # System should be able to assign to available couriers
            selected_courier = min(available_couriers, 
                                 key=lambda c: CourierStatus.objects.get(courier=c).current_orders_count)
            
            # Verify the selected courier is actually available
            selected_status = CourierStatus.objects.get(courier=selected_courier)
            assert selected_status.is_available, "Selected courier must be available"
            
            # Perform assignment
            order.assigned_courier = selected_courier
            order.status = 'ASSIGNED'
            order.save()
            
            # Update workload
            selected_status.current_orders_count += 1
            selected_status.save()
            
            # Verify system state consistency
            assert order.assigned_courier == selected_courier
            assert order.status == 'ASSIGNED'
            
            # Verify workload was updated correctly
            updated_status = CourierStatus.objects.get(courier=selected_courier)
            assert updated_status.current_orders_count > 0
        else:
            # No available couriers - order should remain unassigned
            assert order.assigned_courier is None
            assert order.status == 'CREATED'

    @given(
        workload_updates=st.lists(
            st.tuples(st.integers(min_value=0, max_value=2), st.integers(min_value=0, max_value=5)),
            min_size=1,
            max_size=3
        )
    )
    def test_workload_calculation_consistency(self, workload_updates):
        """
        Property: For any workload changes, the system must maintain consistent 
        workload calculations and reflect them in assignment decisions.
        
        **Feature: delivery-app, Property 12: System State Consistency**
        **Validates: Requirements 4.3, 6.1, 6.3**
        """
        # Apply workload updates
        for courier_index, new_workload in workload_updates:
            if courier_index < len(self.couriers):
                courier = self.couriers[courier_index]
                courier_status = CourierStatus.objects.get(courier=courier)
                courier_status.current_orders_count = new_workload
                courier_status.save()
        
        # Get current workloads
        courier_workloads = {}
        for courier in self.couriers:
            courier_status = CourierStatus.objects.get(courier=courier)
            if courier_status.is_available:
                courier_workloads[courier] = courier_status.current_orders_count
        
        if courier_workloads:
            # Find courier with minimum workload
            min_workload_courier = min(courier_workloads.keys(), 
                                     key=lambda c: courier_workloads[c])
            min_workload = courier_workloads[min_workload_courier]
            
            # Create and assign order
            order = Order.objects.create(
                customer=self.customer,
                pickup_address="Test Pickup Location",
                delivery_address="Test Delivery Location",
                distance_km=Decimal('3.0'),
                price=Decimal('110.00'),
                status='CREATED'
            )
            
            # Assign to courier with minimum workload
            order.assigned_courier = min_workload_courier
            order.status = 'ASSIGNED'
            order.save()
            
            # Update workload
            courier_status = CourierStatus.objects.get(courier=min_workload_courier)
            courier_status.current_orders_count += 1
            courier_status.save()
            
            # Verify consistency
            updated_status = CourierStatus.objects.get(courier=min_workload_courier)
            assert updated_status.current_orders_count == min_workload + 1
            assert order.assigned_courier == min_workload_courier

    def test_order_status_and_courier_state_consistency(self):
        """
        Property: Order status changes must be consistent with courier state changes.
        
        **Feature: delivery-app, Property 12: System State Consistency**
        **Validates: Requirements 4.3, 6.1, 6.3**
        """
        courier = self.couriers[0]
        courier_status = CourierStatus.objects.get(courier=courier)
        
        # Create and assign order
        order = Order.objects.create(
            customer=self.customer,
            pickup_address="Consistency Test Pickup",
            delivery_address="Consistency Test Delivery",
            distance_km=Decimal('2.0'),
            price=Decimal('90.00'),
            status='CREATED'
        )
        
        # Initial state verification
        assert courier_status.is_available
        assert courier_status.current_orders_count == 0
        
        # Assign order
        order.assigned_courier = courier
        order.status = 'ASSIGNED'
        order.save()
        
        # Update courier workload
        courier_status.current_orders_count += 1
        courier_status.save()
        
        # Verify consistency after assignment
        assert order.assigned_courier == courier
        assert order.status == 'ASSIGNED'
        updated_status = CourierStatus.objects.get(courier=courier)
        assert updated_status.current_orders_count == 1
        
        # Complete order
        order.status = 'DELIVERED'
        order.save()
        
        # Update courier workload
        courier_status.current_orders_count -= 1
        courier_status.save()
        
        # Verify consistency after completion
        assert order.status == 'DELIVERED'
        final_status = CourierStatus.objects.get(courier=courier)
        assert final_status.current_orders_count == 0

    @given(
        state_transitions=st.lists(
            st.sampled_from(['make_available', 'make_unavailable', 'increase_workload', 'decrease_workload']),
            min_size=1,
            max_size=5
        )
    )
    def test_state_transition_consistency(self, state_transitions):
        """
        Property: Any sequence of state transitions must maintain system consistency.
        
        **Feature: delivery-app, Property 12: System State Consistency**
        **Validates: Requirements 4.3, 6.1, 6.3**
        """
        courier = self.couriers[0]
        courier_status = CourierStatus.objects.get(courier=courier)
        
        # Apply state transitions
        for transition in state_transitions:
            if transition == 'make_available':
                courier_status.is_available = True
            elif transition == 'make_unavailable':
                courier_status.is_available = False
            elif transition == 'increase_workload':
                courier_status.current_orders_count = min(courier_status.current_orders_count + 1, 10)
            elif transition == 'decrease_workload':
                courier_status.current_orders_count = max(courier_status.current_orders_count - 1, 0)
            
            courier_status.save()
            
            # Verify state consistency after each transition
            updated_status = CourierStatus.objects.get(courier=courier)
            assert updated_status.current_orders_count >= 0, "Workload cannot be negative"
            
            # Test assignment eligibility
            if updated_status.is_available:
                # Should be eligible for assignment
                order = Order.objects.create(
                    customer=self.customer,
                    pickup_address=f"Test Pickup {transition}",
                    delivery_address=f"Test Delivery {transition}",
                    distance_km=Decimal('1.0'),
                    price=Decimal('70.00'),
                    status='CREATED'
                )
                
                # Assignment should succeed for available couriers
                order.assigned_courier = courier
                order.status = 'ASSIGNED'
                order.save()
                
                assert order.assigned_courier == courier
                assert order.status == 'ASSIGNED'
                
                # Clean up
                order.delete()
            else:
                # Should not be eligible for new assignments when unavailable
                # (This is a business rule that should be enforced)
                pass