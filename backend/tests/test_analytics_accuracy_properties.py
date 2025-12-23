"""
Property-based tests for analytics accuracy and revenue calculations.

**Feature: delivery-app, Property 10: Analytics and Revenue Accuracy**
**Validates: Requirements 10.1, 10.4, 12.2**
"""

import pytest
from decimal import Decimal
from datetime import date, timedelta
from hypothesis import given, strategies as st, assume
from hypothesis.extra.django import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone

from orders.models import Order, PricingConfig
from analytics.models import AnalyticsMetric
from analytics.services import AnalyticsService

User = get_user_model()


class TestAnalyticsAccuracyProperties(TestCase):
    """Property-based tests for analytics accuracy"""
    
    def setUp(self):
        """Set up test data"""
        import uuid
        unique_id = str(uuid.uuid4())[:8]
        
        self.customer = User.objects.create_user(
            username=f'customer_{unique_id}',
            email=f'customer_{unique_id}@test.com',
            password='testpass123',
            role='CUSTOMER'
        )
        self.courier = User.objects.create_user(
            username=f'courier_{unique_id}',
            email=f'courier_{unique_id}@test.com',
            password='testpass123',
            role='COURIER'
        )
        self.admin = User.objects.create_user(
            username=f'admin_{unique_id}',
            email=f'admin_{unique_id}@test.com',
            password='testpass123',
            role='ADMIN'
        )
        
        # Create active pricing config
        self.pricing_config = PricingConfig.objects.create(
            base_fee=Decimal('50.00'),
            per_km_rate=Decimal('20.00'),
            is_active=True,
            created_by=self.admin
        )
    
    @given(
        num_orders=st.integers(min_value=1, max_value=20),
        distances=st.lists(
            st.decimals(min_value=Decimal('0.1'), max_value=Decimal('100.0'), places=2),
            min_size=1,
            max_size=20
        )
    )
    def test_revenue_calculation_accuracy_property(self, num_orders, distances):
        """
        **Feature: delivery-app, Property 10: Analytics and Revenue Accuracy**
        
        For any set of completed orders, the total revenue calculated by analytics
        must equal the sum of all individual order prices.
        
        **Validates: Requirements 10.1, 10.4**
        """
        # Ensure we have the right number of distances
        distances = distances[:num_orders] if len(distances) >= num_orders else distances * ((num_orders // len(distances)) + 1)
        distances = distances[:num_orders]
        
        # Create orders with calculated prices
        orders = []
        expected_total_revenue = Decimal('0.00')
        
        for i, distance in enumerate(distances):
            # Calculate price using the same formula as the system
            price = (self.pricing_config.base_fee + (distance * self.pricing_config.per_km_rate)).quantize(Decimal('0.01'))
            
            order = Order.objects.create(
                customer=self.customer,
                assigned_courier=self.courier,
                pickup_address=f"Pickup Address {i}",
                delivery_address=f"Delivery Address {i}",
                distance_km=distance,
                price=price,
                status='DELIVERED',
                created_at=timezone.now(),
                delivered_at=timezone.now()
            )
            orders.append(order)
            expected_total_revenue += price
        
        # Calculate analytics revenue
        analytics_service = AnalyticsService()
        calculated_revenue = analytics_service.calculate_total_revenue(
            start_date=date.today(),
            end_date=date.today()
        )
        
        # Property: Analytics revenue must equal sum of order prices
        assert calculated_revenue == expected_total_revenue, (
            f"Analytics revenue {calculated_revenue} does not match "
            f"expected total {expected_total_revenue}"
        )
    
    @given(
        days_back=st.integers(min_value=1, max_value=30),
        orders_per_day=st.integers(min_value=0, max_value=10)
    )
    def test_daily_metrics_accuracy_property(self, days_back, orders_per_day):
        """
        **Feature: delivery-app, Property 10: Analytics and Revenue Accuracy**
        
        For any date range, the daily metrics must accurately reflect
        the actual order counts and revenue for each day.
        
        **Validates: Requirements 10.1, 10.4**
        """
        target_date = date.today() - timedelta(days=days_back)
        
        # Create orders for the target date
        daily_revenue = Decimal('0.00')
        for i in range(orders_per_day):
            price = (self.pricing_config.base_fee + (Decimal('5.0') * self.pricing_config.per_km_rate)).quantize(Decimal('0.01'))
            
            order = Order.objects.create(
                customer=self.customer,
                assigned_courier=self.courier,
                pickup_address=f"Pickup {i}",
                delivery_address=f"Delivery {i}",
                distance_km=Decimal('5.0'),
                price=price,
                status='DELIVERED',
                created_at=timezone.make_aware(
                    timezone.datetime.combine(target_date, timezone.datetime.min.time())
                ),
                delivered_at=timezone.make_aware(
                    timezone.datetime.combine(target_date, timezone.datetime.min.time())
                )
            )
            daily_revenue += price
        
        # Calculate analytics for the day
        analytics_service = AnalyticsService()
        daily_stats = analytics_service.get_daily_stats(target_date)
        
        # Property: Daily stats must match actual order data
        assert daily_stats['order_count'] == orders_per_day, (
            f"Daily order count {daily_stats['order_count']} does not match "
            f"expected {orders_per_day}"
        )
        
        assert daily_stats['revenue'] == daily_revenue, (
            f"Daily revenue {daily_stats['revenue']} does not match "
            f"expected {daily_revenue}"
        )
    
    @given(
        base_fee=st.decimals(min_value=Decimal('10.0'), max_value=Decimal('100.0'), places=2),
        per_km_rate=st.decimals(min_value=Decimal('5.0'), max_value=Decimal('50.0'), places=2),
        distance=st.decimals(min_value=Decimal('0.1'), max_value=Decimal('50.0'), places=2)
    )
    def test_pricing_config_isolation_property(self, base_fee, per_km_rate, distance):
        """
        **Feature: delivery-app, Property 10: Analytics and Revenue Accuracy**
        
        For any pricing configuration change, existing orders must maintain
        their original pricing while new orders use updated rates.
        
        **Validates: Requirements 12.2**
        """
        # Create order with current pricing
        original_price = (self.pricing_config.base_fee + (distance * self.pricing_config.per_km_rate)).quantize(Decimal('0.01'))
        
        original_order = Order.objects.create(
            customer=self.customer,
            assigned_courier=self.courier,
            pickup_address="Original Pickup",
            delivery_address="Original Delivery",
            distance_km=distance,
            price=original_price,
            status='DELIVERED',
            created_at=timezone.now(),
            delivered_at=timezone.now()
        )
        
        # Update pricing configuration
        new_pricing = PricingConfig.objects.create(
            base_fee=base_fee,
            per_km_rate=per_km_rate,
            is_active=True,
            created_by=self.admin
        )
        
        # Deactivate old pricing
        self.pricing_config.is_active = False
        self.pricing_config.save()
        
        # Create new order with updated pricing
        new_price = (base_fee + (distance * per_km_rate)).quantize(Decimal('0.01'))
        
        new_order = Order.objects.create(
            customer=self.customer,
            assigned_courier=self.courier,
            pickup_address="New Pickup",
            delivery_address="New Delivery",
            distance_km=distance,
            price=new_price,
            status='DELIVERED',
            created_at=timezone.now(),
            delivered_at=timezone.now()
        )
        
        # Refresh from database
        original_order.refresh_from_db()
        new_order.refresh_from_db()
        
        # Property: Original order price must remain unchanged
        assert original_order.price == original_price, (
            f"Original order price changed from {original_price} to {original_order.price}"
        )
        
        # Property: New order must use new pricing
        assert new_order.price == new_price, (
            f"New order price {new_order.price} does not match expected {new_price}"
        )
        
        # Property: Analytics must account for both pricing schemes correctly
        analytics_service = AnalyticsService()
        total_revenue = analytics_service.calculate_total_revenue(
            start_date=date.today(),
            end_date=date.today()
        )
        
        expected_total = original_price + new_price
        assert total_revenue == expected_total, (
            f"Total revenue {total_revenue} does not match expected {expected_total}"
        )