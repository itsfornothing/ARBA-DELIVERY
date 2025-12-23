"""
Unit tests for configuration management functionality.
"""

import pytest
from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError

from orders.models import PricingConfig
from orders.services import ConfigurationService

User = get_user_model()


class TestConfigurationManagement(TestCase):
    """Unit tests for configuration management"""
    
    def setUp(self):
        """Set up test data"""
        self.admin = User.objects.create_user(
            username='admin_test',
            email='admin@test.com',
            password='testpass123',
            role='ADMIN'
        )
        
        self.customer = User.objects.create_user(
            username='customer_test',
            email='customer@test.com',
            password='testpass123',
            role='CUSTOMER'
        )
        
        # Create initial pricing config
        self.initial_config = PricingConfig.objects.create(
            base_fee=Decimal('50.00'),
            per_km_rate=Decimal('20.00'),
            is_active=True,
            created_by=self.admin
        )
        
        self.config_service = ConfigurationService()
    
    def test_get_active_pricing_config(self):
        """Test getting active pricing configuration"""
        active_config = self.config_service.get_active_pricing_config()
        
        self.assertIsNotNone(active_config)
        self.assertEqual(active_config.base_fee, Decimal('50.00'))
        self.assertEqual(active_config.per_km_rate, Decimal('20.00'))
        self.assertTrue(active_config.is_active)
    
    def test_update_pricing_config_success(self):
        """Test successful pricing configuration update"""
        new_config = self.config_service.update_pricing_config(
            base_fee=Decimal('60.00'),
            per_km_rate=Decimal('25.00'),
            admin_user=self.admin
        )
        
        # Check new config is created and active
        self.assertEqual(new_config.base_fee, Decimal('60.00'))
        self.assertEqual(new_config.per_km_rate, Decimal('25.00'))
        self.assertTrue(new_config.is_active)
        self.assertEqual(new_config.created_by, self.admin)
        
        # Check old config is deactivated
        self.initial_config.refresh_from_db()
        self.assertFalse(self.initial_config.is_active)
        
        # Check only one active config exists
        active_configs = PricingConfig.objects.filter(is_active=True)
        self.assertEqual(active_configs.count(), 1)
        self.assertEqual(active_configs.first(), new_config)
    
    def test_update_pricing_config_validation_errors(self):
        """Test pricing configuration update validation"""
        # Test negative base fee
        with self.assertRaises(ValueError) as context:
            self.config_service.update_pricing_config(
                base_fee=Decimal('-10.00'),
                per_km_rate=Decimal('20.00'),
                admin_user=self.admin
            )
        self.assertIn('Base fee must be at least 0.01', str(context.exception))
        
        # Test negative per km rate
        with self.assertRaises(ValueError) as context:
            self.config_service.update_pricing_config(
                base_fee=Decimal('50.00'),
                per_km_rate=Decimal('-5.00'),
                admin_user=self.admin
            )
        self.assertIn('Per-kilometer rate must be at least 0.01', str(context.exception))
        
        # Test excessive base fee
        with self.assertRaises(ValueError) as context:
            self.config_service.update_pricing_config(
                base_fee=Decimal('1500.00'),
                per_km_rate=Decimal('20.00'),
                admin_user=self.admin
            )
        self.assertIn('Base fee cannot exceed 1000.00', str(context.exception))
        
        # Test non-admin user
        with self.assertRaises(ValueError) as context:
            self.config_service.update_pricing_config(
                base_fee=Decimal('60.00'),
                per_km_rate=Decimal('25.00'),
                admin_user=self.customer
            )
        self.assertIn('Only admin users can update pricing configuration', str(context.exception))
    
    def test_calculate_price(self):
        """Test price calculation"""
        distance = Decimal('10.0')
        expected_price = Decimal('50.00') + (distance * Decimal('20.00'))  # 50 + 200 = 250
        
        calculated_price = self.config_service.calculate_price(distance)
        
        self.assertEqual(calculated_price, expected_price)
    
    def test_calculate_price_with_specific_config(self):
        """Test price calculation with specific configuration"""
        # Create another config
        other_config = PricingConfig.objects.create(
            base_fee=Decimal('30.00'),
            per_km_rate=Decimal('15.00'),
            is_active=False,
            created_by=self.admin
        )
        
        distance = Decimal('5.0')
        expected_price = Decimal('30.00') + (distance * Decimal('15.00'))  # 30 + 75 = 105
        
        calculated_price = self.config_service.calculate_price(distance, other_config)
        
        self.assertEqual(calculated_price, expected_price)
    
    def test_validate_configuration_change(self):
        """Test configuration change validation"""
        # Valid configuration
        result = self.config_service.validate_configuration_change(
            Decimal('60.00'), Decimal('25.00')
        )
        
        self.assertTrue(result['is_valid'])
        self.assertEqual(len(result['errors']), 0)
        self.assertGreaterEqual(len(result['sample_impacts']), 4)  # Should have sample impacts
        
        # Invalid configuration
        result = self.config_service.validate_configuration_change(
            Decimal('-10.00'), Decimal('25.00')
        )
        
        self.assertFalse(result['is_valid'])
        self.assertGreater(len(result['errors']), 0)
        self.assertIn('Base fee must be at least 0.01', result['errors'])
    
    def test_get_pricing_history(self):
        """Test getting pricing history"""
        # Create additional configs
        PricingConfig.objects.create(
            base_fee=Decimal('40.00'),
            per_km_rate=Decimal('18.00'),
            is_active=False,
            created_by=self.admin
        )
        
        PricingConfig.objects.create(
            base_fee=Decimal('70.00'),
            per_km_rate=Decimal('30.00'),
            is_active=False,
            created_by=self.admin
        )
        
        history = self.config_service.get_pricing_history(limit=10)
        
        self.assertGreaterEqual(len(history), 3)  # At least 3 configs
        
        # Check history format
        for config_data in history:
            self.assertIn('id', config_data)
            self.assertIn('base_fee', config_data)
            self.assertIn('per_km_rate', config_data)
            self.assertIn('is_active', config_data)
            self.assertIn('created_at', config_data)
            self.assertIn('created_by', config_data)
    
    def test_pricing_config_isolation(self):
        """Test that pricing changes don't affect existing orders"""
        from orders.models import Order
        
        # Create order with current pricing
        distance = Decimal('5.0')
        original_price = self.config_service.calculate_price(distance)
        
        order = Order.objects.create(
            customer=self.customer,
            pickup_address="Test Pickup",
            delivery_address="Test Delivery",
            distance_km=distance,
            price=original_price,
            status='DELIVERED'
        )
        
        # Update pricing configuration
        self.config_service.update_pricing_config(
            base_fee=Decimal('100.00'),
            per_km_rate=Decimal('50.00'),
            admin_user=self.admin
        )
        
        # Refresh order from database
        order.refresh_from_db()
        
        # Order price should remain unchanged
        self.assertEqual(order.price, original_price)
        
        # New price calculation should use new config
        new_price = self.config_service.calculate_price(distance)
        expected_new_price = (Decimal('100.00') + (distance * Decimal('50.00'))).quantize(Decimal('0.01'))
        self.assertEqual(new_price, expected_new_price)
        self.assertNotEqual(new_price, original_price)