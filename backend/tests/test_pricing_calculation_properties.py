"""
Property-based tests for pricing calculation consistency

**Feature: delivery-app, Property 3: Pricing Calculation Consistency**
For any order with pickup address, delivery address, and distance, the calculated price 
must equal base_fee + (distance_km × per_km_rate) and remain immutable once confirmed
**Validates: Requirements 9.1, 9.4**
"""

import pytest
from hypothesis import given, strategies as st, settings
from hypothesis.extra.django import TestCase
from decimal import Decimal
from django.contrib.auth import get_user_model
from orders.models import Order, PricingConfig
from orders.serializers import OrderCreateSerializer
from rest_framework.test import APIRequestFactory

User = get_user_model()


class TestPricingCalculationProperties(TestCase):
    """Property-based tests for pricing calculation consistency"""

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
        base_fee=st.decimals(min_value=Decimal('0.01'), max_value=Decimal('1000.00'), places=2),
        per_km_rate=st.decimals(min_value=Decimal('0.01'), max_value=Decimal('100.00'), places=2),
        distance_km=st.decimals(min_value=Decimal('0.1'), max_value=Decimal('1000.0'), places=2),
        pickup_address=st.text(min_size=1, max_size=100, alphabet=st.characters(blacklist_categories=['Cc', 'Cs'])).filter(lambda x: x.strip()),
        delivery_address=st.text(min_size=1, max_size=100, alphabet=st.characters(blacklist_categories=['Cc', 'Cs'])).filter(lambda x: x.strip())
    )
    @settings(max_examples=100, deadline=None)
    def test_pricing_calculation_consistency_property(self, base_fee, per_km_rate, distance_km, pickup_address, delivery_address):
        """
        Property 3: Pricing Calculation Consistency
        For any order with valid data, price must equal base_fee + (distance_km × per_km_rate)
        """
        # Ensure addresses are different
        if pickup_address.strip().lower() == delivery_address.strip().lower():
            delivery_address = delivery_address + " (different)"
        
        # Deactivate all existing configs and create new one
        PricingConfig.objects.update(is_active=False)
        pricing_config = PricingConfig.objects.create(
            base_fee=base_fee,
            per_km_rate=per_km_rate,
            is_active=True,
            created_by=self.admin
        )
        
        # Calculate expected price and round to 2 decimal places (matching model field)
        expected_price = (base_fee + (distance_km * per_km_rate)).quantize(Decimal('0.01'))
        
        # Create request factory for serializer context
        factory = APIRequestFactory()
        request = factory.post('/orders/')
        request.user = self.customer
        
        # Test order creation through serializer
        order_data = {
            'pickup_address': pickup_address,
            'delivery_address': delivery_address,
            'distance_km': distance_km
        }
        
        serializer = OrderCreateSerializer(data=order_data, context={'request': request})
        
        # Validate serializer
        assert serializer.is_valid(), f"Serializer errors: {serializer.errors}"
        
        # Create order
        order = serializer.save()
        
        # Verify pricing calculation consistency
        assert order.price == expected_price, f"Price calculation inconsistent: expected {expected_price}, got {order.price}"
        
        # Verify price is stored correctly in database
        retrieved_order = Order.objects.get(id=order.id)
        assert retrieved_order.price == expected_price, f"Stored price inconsistent: expected {expected_price}, got {retrieved_order.price}"
        
        # Verify price components are correct (with proper rounding)
        calculated_distance_cost = distance_km * per_km_rate
        calculated_total = (base_fee + calculated_distance_cost).quantize(Decimal('0.01'))
        assert order.price == calculated_total, f"Price components don't add up: base_fee({base_fee}) + distance_cost({calculated_distance_cost}) != total({order.price})"

    @given(
        initial_base_fee=st.decimals(min_value=Decimal('10.00'), max_value=Decimal('100.00'), places=2),
        initial_per_km_rate=st.decimals(min_value=Decimal('1.00'), max_value=Decimal('50.00'), places=2),
        new_base_fee=st.decimals(min_value=Decimal('10.00'), max_value=Decimal('100.00'), places=2),
        new_per_km_rate=st.decimals(min_value=Decimal('1.00'), max_value=Decimal('50.00'), places=2),
        distance_km=st.decimals(min_value=Decimal('0.1'), max_value=Decimal('100.0'), places=2)
    )
    @settings(max_examples=50, deadline=None)
    def test_price_immutability_after_confirmation_property(self, initial_base_fee, initial_per_km_rate, new_base_fee, new_per_km_rate, distance_km):
        """
        Property 3: Pricing Calculation Consistency
        Once an order is created, its price must remain immutable even if pricing config changes
        """
        # Deactivate all existing configs and create initial configuration
        PricingConfig.objects.update(is_active=False)
        initial_config = PricingConfig.objects.create(
            base_fee=initial_base_fee,
            per_km_rate=initial_per_km_rate,
            is_active=True,
            created_by=self.admin
        )
        
        # Calculate expected price with initial config and round to 2 decimal places
        expected_price = (initial_base_fee + (distance_km * initial_per_km_rate)).quantize(Decimal('0.01'))
        
        # Create order with initial pricing
        order = Order.objects.create(
            customer=self.customer,
            pickup_address='123 Test Pickup St',
            delivery_address='456 Test Delivery Ave',
            distance_km=distance_km,
            price=expected_price,
            status='CREATED'
        )
        
        # Store original price
        original_price = order.price
        
        # Change pricing configuration
        initial_config.is_active = False
        initial_config.save()
        
        new_config = PricingConfig.objects.create(
            base_fee=new_base_fee,
            per_km_rate=new_per_km_rate,
            is_active=True,
            created_by=self.admin
        )
        
        # Retrieve order from database
        retrieved_order = Order.objects.get(id=order.id)
        
        # Verify price remains unchanged
        assert retrieved_order.price == original_price, f"Order price changed after pricing config update: original {original_price}, current {retrieved_order.price}"
        assert retrieved_order.price == expected_price, f"Order price doesn't match expected: expected {expected_price}, got {retrieved_order.price}"
        
        # Verify new orders use new pricing (rounded to 2 decimal places)
        new_expected_price = (new_base_fee + (distance_km * new_per_km_rate)).quantize(Decimal('0.01'))
        
        factory = APIRequestFactory()
        request = factory.post('/orders/')
        request.user = self.customer
        
        new_order_data = {
            'pickup_address': '789 New Pickup St',
            'delivery_address': '101 New Delivery Ave',
            'distance_km': distance_km
        }
        
        serializer = OrderCreateSerializer(data=new_order_data, context={'request': request})
        assert serializer.is_valid(), f"New order serializer errors: {serializer.errors}"
        
        new_order = serializer.save()
        assert new_order.price == new_expected_price, f"New order should use new pricing: expected {new_expected_price}, got {new_order.price}"

    @given(
        base_fee=st.decimals(min_value=Decimal('0.01'), max_value=Decimal('1000.00'), places=2),
        per_km_rate=st.decimals(min_value=Decimal('0.01'), max_value=Decimal('100.00'), places=2),
        distance_km=st.decimals(min_value=Decimal('0.1'), max_value=Decimal('1000.0'), places=2)
    )
    @settings(max_examples=50, deadline=None)
    def test_pricing_formula_accuracy_property(self, base_fee, per_km_rate, distance_km):
        """
        Property 3: Pricing Calculation Consistency
        Test that the pricing formula is mathematically accurate
        """
        # Deactivate all existing configs and create new one
        PricingConfig.objects.update(is_active=False)
        pricing_config = PricingConfig.objects.create(
            base_fee=base_fee,
            per_km_rate=per_km_rate,
            is_active=True,
            created_by=self.admin
        )
        
        # Manual calculation rounded to 2 decimal places
        manual_calculation = (base_fee + (distance_km * per_km_rate)).quantize(Decimal('0.01'))
        
        # Create request factory for serializer context
        factory = APIRequestFactory()
        request = factory.post('/orders/')
        request.user = self.customer
        
        # Test order creation
        order_data = {
            'pickup_address': 'Test Pickup Address',
            'delivery_address': 'Test Delivery Address',
            'distance_km': distance_km
        }
        
        serializer = OrderCreateSerializer(data=order_data, context={'request': request})
        assert serializer.is_valid(), f"Serializer errors: {serializer.errors}"
        
        order = serializer.save()
        
        # Verify formula accuracy
        assert order.price == manual_calculation, f"Formula calculation error: manual {manual_calculation}, system {order.price}"
        
        # Verify precision is maintained
        assert order.price.as_tuple().exponent >= -2, "Price should maintain at least 2 decimal places"
        
        # Verify no rounding errors for reasonable values
        if base_fee <= Decimal('100.00') and per_km_rate <= Decimal('10.00') and distance_km <= Decimal('100.00'):
            # For reasonable values, the calculation should be exact (after rounding)
            distance_cost = distance_km * per_km_rate
            total_cost = (base_fee + distance_cost).quantize(Decimal('0.01'))
            assert order.price == total_cost, f"Precision error in calculation: expected {total_cost}, got {order.price}"

    @given(
        distance_km=st.decimals(min_value=Decimal('0.1'), max_value=Decimal('1000.0'), places=2)
    )
    @settings(max_examples=30, deadline=None)
    def test_zero_base_fee_calculation_property(self, distance_km):
        """
        Property 3: Pricing Calculation Consistency
        Test pricing calculation with zero base fee
        """
        per_km_rate = Decimal('20.00')
        
        # Deactivate all existing configs and create pricing configuration with zero base fee
        PricingConfig.objects.update(is_active=False)
        pricing_config = PricingConfig.objects.create(
            base_fee=Decimal('0.00'),
            per_km_rate=per_km_rate,
            is_active=True,
            created_by=self.admin
        )
        
        expected_price = (distance_km * per_km_rate).quantize(Decimal('0.01'))
        
        factory = APIRequestFactory()
        request = factory.post('/orders/')
        request.user = self.customer
        
        order_data = {
            'pickup_address': 'Test Pickup Address',
            'delivery_address': 'Test Delivery Address',
            'distance_km': distance_km
        }
        
        serializer = OrderCreateSerializer(data=order_data, context={'request': request})
        assert serializer.is_valid(), f"Serializer errors: {serializer.errors}"
        
        order = serializer.save()
        
        # With zero base fee, price should equal distance cost only
        assert order.price == expected_price, f"Zero base fee calculation error: expected {expected_price}, got {order.price}"

    @given(
        base_fee=st.decimals(min_value=Decimal('0.01'), max_value=Decimal('1000.00'), places=2)
    )
    @settings(max_examples=30, deadline=None)
    def test_zero_distance_calculation_property(self, base_fee):
        """
        Property 3: Pricing Calculation Consistency
        Test pricing calculation with minimum distance
        """
        per_km_rate = Decimal('20.00')
        distance_km = Decimal('0.1')  # Minimum allowed distance
        
        # Deactivate all existing configs and create new one
        PricingConfig.objects.update(is_active=False)
        pricing_config = PricingConfig.objects.create(
            base_fee=base_fee,
            per_km_rate=per_km_rate,
            is_active=True,
            created_by=self.admin
        )
        
        expected_price = (base_fee + (distance_km * per_km_rate)).quantize(Decimal('0.01'))
        
        factory = APIRequestFactory()
        request = factory.post('/orders/')
        request.user = self.customer
        
        order_data = {
            'pickup_address': 'Test Pickup Address',
            'delivery_address': 'Test Delivery Address',
            'distance_km': distance_km
        }
        
        serializer = OrderCreateSerializer(data=order_data, context={'request': request})
        assert serializer.is_valid(), f"Serializer errors: {serializer.errors}"
        
        order = serializer.save()
        
        # Price should be base fee plus minimal distance cost
        assert order.price == expected_price, f"Minimum distance calculation error: expected {expected_price}, got {order.price}"