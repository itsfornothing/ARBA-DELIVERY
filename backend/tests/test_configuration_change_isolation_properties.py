"""
Property-based tests for configuration change isolation

**Feature: delivery-app, Property 11: Configuration Change Isolation**
For any pricing parameter update, new rates must apply only to future orders 
while existing orders maintain their original pricing
**Validates: Requirements 9.5, 12.2**
"""

import pytest
from hypothesis import given, strategies as st, settings
from hypothesis.extra.django import TestCase
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.utils import timezone
from orders.models import Order, PricingConfig
from orders.serializers import OrderCreateSerializer
from rest_framework.test import APIRequestFactory

User = get_user_model()


class TestConfigurationChangeIsolationProperties(TestCase):
    """Property-based tests for configuration change isolation"""

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
        
        self.admin = User.objects.create_user(
            username=f'testadmin_{unique_id}',
            email=f'admin_{unique_id}@test.com',
            password='testpass123',
            role='ADMIN',
            first_name='Test',
            last_name='Admin'
        )

    @given(
        original_base_fee=st.decimals(min_value=Decimal('10.00'), max_value=Decimal('100.00'), places=2),
        original_per_km_rate=st.decimals(min_value=Decimal('1.00'), max_value=Decimal('50.00'), places=2),
        new_base_fee=st.decimals(min_value=Decimal('10.00'), max_value=Decimal('100.00'), places=2),
        new_per_km_rate=st.decimals(min_value=Decimal('1.00'), max_value=Decimal('50.00'), places=2),
        distance_km=st.decimals(min_value=Decimal('0.1'), max_value=Decimal('100.0'), places=2),
        num_existing_orders=st.integers(min_value=1, max_value=5)
    )
    @settings(max_examples=50, deadline=None)
    def test_configuration_change_isolation_property(self, original_base_fee, original_per_km_rate, new_base_fee, new_per_km_rate, distance_km, num_existing_orders):
        """
        Property 11: Configuration Change Isolation
        When pricing configuration changes, existing orders must maintain original pricing
        """
        # Deactivate all existing configs and create original pricing configuration
        PricingConfig.objects.update(is_active=False)
        original_config = PricingConfig.objects.create(
            base_fee=original_base_fee,
            per_km_rate=original_per_km_rate,
            is_active=True,
            created_by=self.admin
        )
        
        # Calculate expected price with original config (rounded to 2 decimal places)
        original_expected_price = (original_base_fee + (distance_km * original_per_km_rate)).quantize(Decimal('0.01'))
        
        # Create multiple existing orders with original pricing
        existing_orders = []
        factory = APIRequestFactory()
        
        for i in range(num_existing_orders):
            request = factory.post('/orders/')
            request.user = self.customer
            
            order_data = {
                'pickup_address': f'Pickup Address {i}',
                'delivery_address': f'Delivery Address {i}',
                'distance_km': distance_km
            }
            
            serializer = OrderCreateSerializer(data=order_data, context={'request': request})
            assert serializer.is_valid(), f"Order {i} serializer errors: {serializer.errors}"
            
            order = serializer.save()
            existing_orders.append(order)
            
            # Verify original pricing
            assert order.price == original_expected_price, f"Order {i} original price incorrect: expected {original_expected_price}, got {order.price}"
        
        # Store original prices for comparison
        original_prices = [order.price for order in existing_orders]
        
        # Change pricing configuration
        original_config.is_active = False
        original_config.save()
        
        new_config = PricingConfig.objects.create(
            base_fee=new_base_fee,
            per_km_rate=new_per_km_rate,
            is_active=True,
            created_by=self.admin
        )
        
        # Verify existing orders maintain original pricing
        for i, order in enumerate(existing_orders):
            retrieved_order = Order.objects.get(id=order.id)
            assert retrieved_order.price == original_prices[i], f"Existing order {i} price changed after config update: original {original_prices[i]}, current {retrieved_order.price}"
            assert retrieved_order.price == original_expected_price, f"Existing order {i} price doesn't match original expected: expected {original_expected_price}, got {retrieved_order.price}"
        
        # Create new order with new pricing (rounded to 2 decimal places)
        new_expected_price = (new_base_fee + (distance_km * new_per_km_rate)).quantize(Decimal('0.01'))
        
        request = factory.post('/orders/')
        request.user = self.customer
        
        new_order_data = {
            'pickup_address': 'New Pickup Address',
            'delivery_address': 'New Delivery Address',
            'distance_km': distance_km
        }
        
        serializer = OrderCreateSerializer(data=new_order_data, context={'request': request})
        assert serializer.is_valid(), f"New order serializer errors: {serializer.errors}"
        
        new_order = serializer.save()
        
        # Verify new order uses new pricing
        assert new_order.price == new_expected_price, f"New order should use new pricing: expected {new_expected_price}, got {new_order.price}"
        
        # Verify isolation: new order price should be different from existing orders (unless configs are identical)
        if original_expected_price != new_expected_price:
            for i, existing_order in enumerate(existing_orders):
                assert existing_order.price != new_order.price, f"Existing order {i} and new order should have different prices when configs differ"

    @given(
        base_fee_changes=st.lists(
            st.decimals(min_value=Decimal('10.00'), max_value=Decimal('100.00'), places=2),
            min_size=2,
            max_size=4
        ),
        per_km_rate_changes=st.lists(
            st.decimals(min_value=Decimal('1.00'), max_value=Decimal('50.00'), places=2),
            min_size=2,
            max_size=4
        ),
        distance_km=st.decimals(min_value=Decimal('0.1'), max_value=Decimal('100.0'), places=2)
    )
    @settings(max_examples=30, deadline=None)
    def test_multiple_configuration_changes_isolation_property(self, base_fee_changes, per_km_rate_changes, distance_km):
        """
        Property 11: Configuration Change Isolation
        Multiple configuration changes should not affect existing orders
        """
        # Ensure we have the same number of base fee and per km rate changes
        min_changes = min(len(base_fee_changes), len(per_km_rate_changes))
        base_fee_changes = base_fee_changes[:min_changes]
        per_km_rate_changes = per_km_rate_changes[:min_changes]
        
        orders_by_config = []
        factory = APIRequestFactory()
        
        # Create orders with each configuration
        for i, (base_fee, per_km_rate) in enumerate(zip(base_fee_changes, per_km_rate_changes)):
            # Deactivate previous configs
            PricingConfig.objects.update(is_active=False)
            
            # Create new config
            config = PricingConfig.objects.create(
                base_fee=base_fee,
                per_km_rate=per_km_rate,
                is_active=True,
                created_by=self.admin
            )
            
            expected_price = (base_fee + (distance_km * per_km_rate)).quantize(Decimal('0.01'))
            
            # Create order with this config
            request = factory.post('/orders/')
            request.user = self.customer
            
            order_data = {
                'pickup_address': f'Pickup Address Config {i}',
                'delivery_address': f'Delivery Address Config {i}',
                'distance_km': distance_km
            }
            
            serializer = OrderCreateSerializer(data=order_data, context={'request': request})
            assert serializer.is_valid(), f"Config {i} order serializer errors: {serializer.errors}"
            
            order = serializer.save()
            orders_by_config.append((order, expected_price, base_fee, per_km_rate))
            
            # Verify order uses current config pricing
            assert order.price == expected_price, f"Config {i} order price incorrect: expected {expected_price}, got {order.price}"
        
        # Verify all orders maintain their original pricing
        for i, (order, expected_price, base_fee, per_km_rate) in enumerate(orders_by_config):
            retrieved_order = Order.objects.get(id=order.id)
            assert retrieved_order.price == expected_price, f"Order from config {i} price changed: expected {expected_price}, got {retrieved_order.price}"
            
            # Verify the price matches the config it was created with (rounded to 2 decimal places)
            calculated_price = (base_fee + (distance_km * per_km_rate)).quantize(Decimal('0.01'))
            assert retrieved_order.price == calculated_price, f"Order from config {i} doesn't match its config calculation: expected {calculated_price}, got {retrieved_order.price}"

    @given(
        original_base_fee=st.decimals(min_value=Decimal('10.00'), max_value=Decimal('100.00'), places=2),
        original_per_km_rate=st.decimals(min_value=Decimal('1.00'), max_value=Decimal('50.00'), places=2),
        new_base_fee=st.decimals(min_value=Decimal('10.00'), max_value=Decimal('100.00'), places=2),
        new_per_km_rate=st.decimals(min_value=Decimal('1.00'), max_value=Decimal('50.00'), places=2),
        distances=st.lists(
            st.decimals(min_value=Decimal('0.1'), max_value=Decimal('100.0'), places=2),
            min_size=2,
            max_size=5
        )
    )
    @settings(max_examples=30, deadline=None)
    def test_configuration_isolation_across_different_distances_property(self, original_base_fee, original_per_km_rate, new_base_fee, new_per_km_rate, distances):
        """
        Property 11: Configuration Change Isolation
        Configuration changes should not affect orders with different distances
        """
        # Deactivate all existing configs and create original pricing configuration
        PricingConfig.objects.update(is_active=False)
        original_config = PricingConfig.objects.create(
            base_fee=original_base_fee,
            per_km_rate=original_per_km_rate,
            is_active=True,
            created_by=self.admin
        )
        
        # Create orders with different distances using original config
        original_orders = []
        factory = APIRequestFactory()
        
        for i, distance in enumerate(distances):
            expected_price = (original_base_fee + (distance * original_per_km_rate)).quantize(Decimal('0.01'))
            
            request = factory.post('/orders/')
            request.user = self.customer
            
            order_data = {
                'pickup_address': f'Pickup Address Distance {i}',
                'delivery_address': f'Delivery Address Distance {i}',
                'distance_km': distance
            }
            
            serializer = OrderCreateSerializer(data=order_data, context={'request': request})
            assert serializer.is_valid(), f"Distance {i} order serializer errors: {serializer.errors}"
            
            order = serializer.save()
            original_orders.append((order, expected_price, distance))
            
            assert order.price == expected_price, f"Distance {i} order price incorrect: expected {expected_price}, got {order.price}"
        
        # Change pricing configuration
        original_config.is_active = False
        original_config.save()
        
        new_config = PricingConfig.objects.create(
            base_fee=new_base_fee,
            per_km_rate=new_per_km_rate,
            is_active=True,
            created_by=self.admin
        )
        
        # Verify all original orders maintain their pricing regardless of distance
        for i, (order, expected_price, distance) in enumerate(original_orders):
            retrieved_order = Order.objects.get(id=order.id)
            assert retrieved_order.price == expected_price, f"Distance {i} order price changed after config update: expected {expected_price}, got {retrieved_order.price}"
        
        # Create new orders with same distances using new config
        for i, distance in enumerate(distances):
            new_expected_price = (new_base_fee + (distance * new_per_km_rate)).quantize(Decimal('0.01'))
            
            request = factory.post('/orders/')
            request.user = self.customer
            
            new_order_data = {
                'pickup_address': f'New Pickup Address Distance {i}',
                'delivery_address': f'New Delivery Address Distance {i}',
                'distance_km': distance
            }
            
            serializer = OrderCreateSerializer(data=new_order_data, context={'request': request})
            assert serializer.is_valid(), f"New distance {i} order serializer errors: {serializer.errors}"
            
            new_order = serializer.save()
            
            # Verify new order uses new pricing
            assert new_order.price == new_expected_price, f"New distance {i} order should use new pricing: expected {new_expected_price}, got {new_order.price}"

    @given(
        base_fee=st.decimals(min_value=Decimal('10.00'), max_value=Decimal('100.00'), places=2),
        per_km_rate=st.decimals(min_value=Decimal('1.00'), max_value=Decimal('50.00'), places=2),
        distance_km=st.decimals(min_value=Decimal('0.1'), max_value=Decimal('100.0'), places=2)
    )
    @settings(max_examples=30, deadline=None)
    def test_config_activation_deactivation_isolation_property(self, base_fee, per_km_rate, distance_km):
        """
        Property 11: Configuration Change Isolation
        Activating and deactivating configs should not affect existing order prices
        """
        # Deactivate all existing configs and create initial config
        PricingConfig.objects.update(is_active=False)
        config1 = PricingConfig.objects.create(
            base_fee=base_fee,
            per_km_rate=per_km_rate,
            is_active=True,
            created_by=self.admin
        )
        
        expected_price = (base_fee + (distance_km * per_km_rate)).quantize(Decimal('0.01'))
        
        # Create order with initial config
        factory = APIRequestFactory()
        request = factory.post('/orders/')
        request.user = self.customer
        
        order_data = {
            'pickup_address': 'Test Pickup Address',
            'delivery_address': 'Test Delivery Address',
            'distance_km': distance_km
        }
        
        serializer = OrderCreateSerializer(data=order_data, context={'request': request})
        assert serializer.is_valid(), f"Order serializer errors: {serializer.errors}"
        
        order = serializer.save()
        original_price = order.price
        
        assert order.price == expected_price, f"Order price incorrect: expected {expected_price}, got {order.price}"
        
        # Deactivate config
        config1.is_active = False
        config1.save()
        
        # Verify order price unchanged after deactivation
        retrieved_order = Order.objects.get(id=order.id)
        assert retrieved_order.price == original_price, f"Order price changed after config deactivation: original {original_price}, current {retrieved_order.price}"
        
        # Reactivate config
        config1.is_active = True
        config1.save()
        
        # Verify order price still unchanged after reactivation
        retrieved_order = Order.objects.get(id=order.id)
        assert retrieved_order.price == original_price, f"Order price changed after config reactivation: original {original_price}, current {retrieved_order.price}"
        
        # Create another config and activate it
        config2 = PricingConfig.objects.create(
            base_fee=base_fee + Decimal('10.00'),  # Different pricing
            per_km_rate=per_km_rate + Decimal('5.00'),
            is_active=True,
            created_by=self.admin
        )
        
        # Deactivate original config
        config1.is_active = False
        config1.save()
        
        # Verify original order price still unchanged
        retrieved_order = Order.objects.get(id=order.id)
        assert retrieved_order.price == original_price, f"Order price changed after switching configs: original {original_price}, current {retrieved_order.price}"