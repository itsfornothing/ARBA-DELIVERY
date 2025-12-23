"""
Property-based tests for order data integrity

**Feature: delivery-app, Property 9: Order Data Integrity**
For any order creation, all required fields (pickup_address, delivery_address, distance_km) 
must be present, valid, and properly stored with the order
**Validates: Requirements 3.1, 3.2, 3.3, 3.4**
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


class TestOrderDataIntegrityProperties(TestCase):
    """Property-based tests for order data integrity"""

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
        
        # Create pricing configuration
        self.pricing_config = PricingConfig.objects.create(
            base_fee=Decimal('50.00'),
            per_km_rate=Decimal('20.00'),
            is_active=True,
            created_by=self.admin
        )

    @given(
        pickup_address=st.text(min_size=1, max_size=500, alphabet=st.characters(blacklist_categories=['Cc', 'Cs'])).filter(lambda x: x.strip()),
        delivery_address=st.text(min_size=1, max_size=500, alphabet=st.characters(blacklist_categories=['Cc', 'Cs'])).filter(lambda x: x.strip()),
        distance_km=st.decimals(min_value=Decimal('0.1'), max_value=Decimal('1000.0'), places=2)
    )
    @settings(max_examples=100, deadline=None)
    def test_order_data_integrity_property(self, pickup_address, delivery_address, distance_km):
        """
        Property 9: Order Data Integrity
        For any valid order data, all required fields must be present, valid, and properly stored
        """
        # Ensure addresses are different
        if pickup_address.strip().lower() == delivery_address.strip().lower():
            delivery_address = delivery_address + " (different)"
        
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
        
        # Verify order data integrity
        assert order.id is not None, "Order must have an ID after creation"
        assert order.customer == self.customer, "Order must be assigned to correct customer"
        assert order.pickup_address == pickup_address.strip(), "Pickup address must be stored correctly"
        assert order.delivery_address == delivery_address.strip(), "Delivery address must be stored correctly"
        assert order.distance_km == distance_km, "Distance must be stored correctly"
        assert order.status == 'CREATED', "Order status must be CREATED initially"
        assert order.created_at is not None, "Order must have creation timestamp"
        
        # Verify price calculation
        expected_price = self.pricing_config.base_fee + (distance_km * self.pricing_config.per_km_rate)
        assert order.price == expected_price, f"Price must be calculated correctly: expected {expected_price}, got {order.price}"
        
        # Verify order can be retrieved from database
        retrieved_order = Order.objects.get(id=order.id)
        assert retrieved_order.pickup_address == pickup_address.strip(), "Retrieved order must have correct pickup address"
        assert retrieved_order.delivery_address == delivery_address.strip(), "Retrieved order must have correct delivery address"
        assert retrieved_order.distance_km == distance_km, "Retrieved order must have correct distance"
        assert retrieved_order.price == expected_price, "Retrieved order must have correct price"

    @given(
        pickup_address=st.one_of(
            st.just(""),  # Empty string
            st.just("   "),  # Whitespace only
            st.none()  # None value
        ),
        delivery_address=st.text(min_size=1, max_size=500, alphabet=st.characters(blacklist_categories=['Cc', 'Cs'])).filter(lambda x: x.strip()),
        distance_km=st.decimals(min_value=Decimal('0.1'), max_value=Decimal('1000.0'), places=2)
    )
    @settings(max_examples=50, deadline=None)
    def test_invalid_pickup_address_rejected(self, pickup_address, delivery_address, distance_km):
        """
        Property 9: Order Data Integrity - Invalid pickup addresses must be rejected
        """
        factory = APIRequestFactory()
        request = factory.post('/orders/')
        request.user = self.customer
        
        order_data = {
            'pickup_address': pickup_address,
            'delivery_address': delivery_address,
            'distance_km': distance_km
        }
        
        serializer = OrderCreateSerializer(data=order_data, context={'request': request})
        
        # Invalid pickup address should cause validation failure
        assert not serializer.is_valid(), "Serializer should reject invalid pickup address"
        assert 'pickup_address' in serializer.errors, "Pickup address error should be present"

    @given(
        pickup_address=st.text(min_size=1, max_size=500, alphabet=st.characters(blacklist_categories=['Cc', 'Cs'])).filter(lambda x: x.strip()),
        delivery_address=st.one_of(
            st.just(""),  # Empty string
            st.just("   "),  # Whitespace only
            st.none()  # None value
        ),
        distance_km=st.decimals(min_value=Decimal('0.1'), max_value=Decimal('1000.0'), places=2)
    )
    @settings(max_examples=50, deadline=None)
    def test_invalid_delivery_address_rejected(self, pickup_address, delivery_address, distance_km):
        """
        Property 9: Order Data Integrity - Invalid delivery addresses must be rejected
        """
        factory = APIRequestFactory()
        request = factory.post('/orders/')
        request.user = self.customer
        
        order_data = {
            'pickup_address': pickup_address,
            'delivery_address': delivery_address,
            'distance_km': distance_km
        }
        
        serializer = OrderCreateSerializer(data=order_data, context={'request': request})
        
        # Invalid delivery address should cause validation failure
        assert not serializer.is_valid(), "Serializer should reject invalid delivery address"
        assert 'delivery_address' in serializer.errors, "Delivery address error should be present"

    @given(
        pickup_address=st.text(min_size=1, max_size=500, alphabet=st.characters(blacklist_categories=['Cc', 'Cs'])).filter(lambda x: x.strip()),
        delivery_address=st.text(min_size=1, max_size=500, alphabet=st.characters(blacklist_categories=['Cc', 'Cs'])).filter(lambda x: x.strip()),
        distance_km=st.one_of(
            st.decimals(max_value=Decimal('0.0'), places=2),  # Zero or negative
            st.just(Decimal('-1.0')),  # Negative
            st.none()  # None value
        )
    )
    @settings(max_examples=50, deadline=None)
    def test_invalid_distance_rejected(self, pickup_address, delivery_address, distance_km):
        """
        Property 9: Order Data Integrity - Invalid distances must be rejected
        """
        # Ensure addresses are different
        if pickup_address.strip().lower() == delivery_address.strip().lower():
            delivery_address = delivery_address + " (different)"
        
        factory = APIRequestFactory()
        request = factory.post('/orders/')
        request.user = self.customer
        
        order_data = {
            'pickup_address': pickup_address,
            'delivery_address': delivery_address,
            'distance_km': distance_km
        }
        
        serializer = OrderCreateSerializer(data=order_data, context={'request': request})
        
        # Invalid distance should cause validation failure
        assert not serializer.is_valid(), "Serializer should reject invalid distance"
        assert 'distance_km' in serializer.errors, "Distance error should be present"

    @given(
        address=st.text(min_size=1, max_size=500, alphabet=st.characters(blacklist_categories=['Cc', 'Cs'])).filter(lambda x: x.strip()),
        distance_km=st.decimals(min_value=Decimal('0.1'), max_value=Decimal('1000.0'), places=2)
    )
    @settings(max_examples=50, deadline=None)
    def test_same_pickup_delivery_address_rejected(self, address, distance_km):
        """
        Property 9: Order Data Integrity - Same pickup and delivery addresses must be rejected
        """
        factory = APIRequestFactory()
        request = factory.post('/orders/')
        request.user = self.customer
        
        order_data = {
            'pickup_address': address,
            'delivery_address': address,  # Same as pickup
            'distance_km': distance_km
        }
        
        serializer = OrderCreateSerializer(data=order_data, context={'request': request})
        
        # Same addresses should cause validation failure
        assert not serializer.is_valid(), "Serializer should reject same pickup and delivery addresses"
        assert 'non_field_errors' in serializer.errors, "Cross-field validation error should be present"