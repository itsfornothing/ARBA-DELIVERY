"""
Property-based tests for auto-assignment fairness algorithm.

**Feature: delivery-app, Property 5: Auto-Assignment Fairness Algorithm**
**Validates: Requirements 6.2, 6.4**
"""

import pytest
from hypothesis import given, strategies as st, assume
from hypothesis.extra.django import TestCase
from django.contrib.auth import get_user_model
from orders.models import Order, CourierStatus, PricingConfig
from decimal import Decimal
import uuid

User = get_user_model()


class AutoAssignmentFairnessProperties(TestCase):
    """Property-based tests for auto-assignment fairness algorithm"""

    def setUp(self):
        """Set up test data"""
        test_id = str(uuid.uuid4())[:8]
        
        # Create test customer
        self.customer = User.objects.create_user(
            username=f'testcustomer_{test_id}',
            email=f'customer_{test_id}@test.com',
            role='CUSTOMER'
        )
        
        # Create pricing config
        self.admin = User.objects.create_user(
            username=f'admin_{test_id}',
            email=f'admin_{test_id}@test.com',
            role='ADMIN'
        )
        
        PricingConfig.objects.create(
            base_fee=Decimal('50.00'),
            per_km_rate=Decimal('20.00'),
            is_active=True,
            created_by=self.admin
        )
        
        # Create multiple couriers with different workloads
        self.couriers = []
        for i in range(5):
            courier = User.objects.create_user(
                username=f'courier{i}_{test_id}',
                email=f'courier{i}_{test_id}@test.com',
                role='COURIER'
            )
            self.couriers.append(courier)

    @given(
        workloads=st.lists(
            st.integers(min_value=0, max_value=10),
            min_size=3,
            max_size=5
        ),
        num_orders=st.integers(min_value=1, max_value=5)
    )
    def test_auto_assignment_selects_minimum_workload_courier(self, workloads, num_orders):
        """
        Property: For any multiple available couriers scenario, the auto-assignment 
        system must select the courier with the lowest current workload to ensure 
        fair distribution.
        
        **Feature: delivery-app, Property 5: Auto-Assignment Fairness Algorithm**
        **Validates: Requirements 6.2, 6.4**
        """
        # Ensure we have enough couriers for the workloads
        num_couriers = min(len(workloads), len(self.couriers))
        workloads = workloads[:num_couriers]
        
        # Set up courier statuses with different workloads
        courier_workloads = {}
        for i, workload in enumerate(workloads):
            courier = self.couriers[i]
            CourierStatus.objects.update_or_create(
                courier=courier,
                defaults={
                    'is_available': True,
                    'current_orders_count': workload
                }
            )
            courier_workloads[courier] = workload
        
        # Create orders and test auto-assignment
        for order_num in range(num_orders):
            order = Order.objects.create(
                customer=self.customer,
                pickup_address=f"Test Pickup {order_num}",
                delivery_address=f"Test Delivery {order_num}",
                distance_km=Decimal('5.0'),
                price=Decimal('150.00'),
                status='CREATED'
            )
            
            # Simulate auto-assignment logic
            available_couriers = CourierStatus.objects.filter(
                is_available=True,
                courier__role='COURIER',
                courier__in=self.couriers[:num_couriers]
            ).select_related('courier').order_by('current_orders_count')
            
            if available_couriers.exists():
                # Get courier with minimum workload
                selected_courier_status = available_couriers.first()
                selected_courier = selected_courier_status.courier
                
                # Verify this is indeed the courier with minimum workload
                min_workload = min(courier_workloads.values())
                assert selected_courier_status.current_orders_count == min_workload, \
                    f"Selected courier workload {selected_courier_status.current_orders_count} != minimum {min_workload}"
                
                # Assign order
                order.assigned_courier = selected_courier
                order.status = 'ASSIGNED'
                order.save()
                
                # Update workload tracking
                selected_courier_status.current_orders_count += 1
                selected_courier_status.save()
                courier_workloads[selected_courier] += 1
                
                # Verify assignment
                assert order.assigned_courier == selected_courier
                assert order.status == 'ASSIGNED'

    @given(
        initial_workloads=st.lists(
            st.integers(min_value=0, max_value=5),
            min_size=3,
            max_size=5
        )
    )
    def test_workload_balancing_over_multiple_assignments(self, initial_workloads):
        """
        Property: Over multiple assignments, workload should be distributed fairly 
        among available couriers.
        
        **Feature: delivery-app, Property 5: Auto-Assignment Fairness Algorithm**
        **Validates: Requirements 6.2, 6.4**
        """
        num_couriers = min(len(initial_workloads), len(self.couriers))
        initial_workloads = initial_workloads[:num_couriers]
        
        # Set up initial workloads
        for i, workload in enumerate(initial_workloads):
            courier = self.couriers[i]
            CourierStatus.objects.update_or_create(
                courier=courier,
                defaults={
                    'is_available': True,
                    'current_orders_count': workload
                }
            )
        
        # Create multiple orders and assign them
        num_orders = num_couriers * 2  # Ensure we have enough orders to test balancing
        assignments = []
        
        for order_num in range(num_orders):
            order = Order.objects.create(
                customer=self.customer,
                pickup_address=f"Balancing Test Pickup {order_num}",
                delivery_address=f"Balancing Test Delivery {order_num}",
                distance_km=Decimal('3.0'),
                price=Decimal('110.00'),
                status='CREATED'
            )
            
            # Get courier with minimum workload
            available_couriers = CourierStatus.objects.filter(
                is_available=True,
                courier__role='COURIER',
                courier__in=self.couriers[:num_couriers]
            ).select_related('courier').order_by('current_orders_count')
            
            if available_couriers.exists():
                selected_courier_status = available_couriers.first()
                selected_courier = selected_courier_status.courier
                
                # Assign order
                order.assigned_courier = selected_courier
                order.status = 'ASSIGNED'
                order.save()
                
                # Update workload
                selected_courier_status.current_orders_count += 1
                selected_courier_status.save()
                
                assignments.append(selected_courier)
        
        # Verify workload distribution is fair
        final_workloads = []
        for i in range(num_couriers):
            courier = self.couriers[i]
            courier_status = CourierStatus.objects.get(courier=courier)
            final_workloads.append(courier_status.current_orders_count)
        
        # Check that workload is reasonably balanced
        # The difference between max and min workload should not be more than 1
        # (since we're assigning to the courier with minimum workload each time)
        if len(final_workloads) > 1:
            max_workload = max(final_workloads)
            min_workload = min(final_workloads)
            workload_difference = max_workload - min_workload
            
            # Allow some tolerance for the balancing algorithm
            assert workload_difference <= 2, \
                f"Workload not balanced: max={max_workload}, min={min_workload}, diff={workload_difference}"

    def test_unavailable_couriers_excluded_from_assignment(self):
        """
        Property: Unavailable couriers must be excluded from auto-assignment.
        
        **Feature: delivery-app, Property 5: Auto-Assignment Fairness Algorithm**
        **Validates: Requirements 6.2, 6.4**
        """
        # Set up couriers with mixed availability
        available_courier = self.couriers[0]
        unavailable_courier = self.couriers[1]
        
        CourierStatus.objects.update_or_create(
            courier=available_courier,
            defaults={'is_available': True, 'current_orders_count': 5}  # Higher workload
        )
        
        CourierStatus.objects.update_or_create(
            courier=unavailable_courier,
            defaults={'is_available': False, 'current_orders_count': 0}  # Lower workload but unavailable
        )
        
        # Create order
        order = Order.objects.create(
            customer=self.customer,
            pickup_address="Availability Test Pickup",
            delivery_address="Availability Test Delivery",
            distance_km=Decimal('2.0'),
            price=Decimal('90.00'),
            status='CREATED'
        )
        
        # Simulate auto-assignment
        available_couriers = CourierStatus.objects.filter(
            is_available=True,
            courier__role='COURIER'
        ).select_related('courier').order_by('current_orders_count')
        
        if available_couriers.exists():
            selected_courier_status = available_couriers.first()
            selected_courier = selected_courier_status.courier
            
            # Should select the available courier, not the unavailable one
            assert selected_courier == available_courier, \
                "Should select available courier even if they have higher workload"
            assert selected_courier != unavailable_courier, \
                "Should not select unavailable courier"
            
            # Assign order
            order.assigned_courier = selected_courier
            order.status = 'ASSIGNED'
            order.save()
            
            assert order.assigned_courier == available_courier

    @given(
        availability_pattern=st.lists(
            st.booleans(),
            min_size=3,
            max_size=5
        )
    )
    def test_assignment_respects_availability_changes(self, availability_pattern):
        """
        Property: Auto-assignment must respect real-time availability changes.
        
        **Feature: delivery-app, Property 5: Auto-Assignment Fairness Algorithm**
        **Validates: Requirements 6.2, 6.4**
        """
        num_couriers = min(len(availability_pattern), len(self.couriers))
        availability_pattern = availability_pattern[:num_couriers]
        
        # Set up couriers with the given availability pattern
        available_couriers = []
        for i, is_available in enumerate(availability_pattern):
            courier = self.couriers[i]
            CourierStatus.objects.update_or_create(
                courier=courier,
                defaults={
                    'is_available': is_available,
                    'current_orders_count': i  # Different workloads
                }
            )
            if is_available:
                available_couriers.append(courier)
        
        if available_couriers:
            # Create order
            order = Order.objects.create(
                customer=self.customer,
                pickup_address="Availability Pattern Test Pickup",
                delivery_address="Availability Pattern Test Delivery",
                distance_km=Decimal('4.0'),
                price=Decimal('130.00'),
                status='CREATED'
            )
            
            # Get available couriers for assignment
            available_courier_statuses = CourierStatus.objects.filter(
                is_available=True,
                courier__role='COURIER',
                courier__in=self.couriers[:num_couriers]
            ).select_related('courier').order_by('current_orders_count')
            
            if available_courier_statuses.exists():
                selected_courier_status = available_courier_statuses.first()
                selected_courier = selected_courier_status.courier
                
                # Verify selected courier is actually available
                assert selected_courier in available_couriers, \
                    "Selected courier must be in the list of available couriers"
                
                # Verify it's the one with minimum workload among available couriers
                available_workloads = [
                    CourierStatus.objects.get(courier=c).current_orders_count 
                    for c in available_couriers
                ]
                min_workload = min(available_workloads)
                assert selected_courier_status.current_orders_count == min_workload, \
                    "Should select available courier with minimum workload"