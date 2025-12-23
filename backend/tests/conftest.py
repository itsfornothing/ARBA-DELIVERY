import pytest
import django
from django.conf import settings
from django.test import TestCase
from hypothesis import settings as hypothesis_settings

# Configure Django
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'delivery_platform.settings')
django.setup()

from django.contrib.auth import get_user_model

# Configure Hypothesis for property-based testing
hypothesis_settings.register_profile("ci", max_examples=100, deadline=None)
hypothesis_settings.register_profile("dev", max_examples=10, deadline=None)
hypothesis_settings.load_profile("dev")

User = get_user_model()

@pytest.fixture
def user_factory():
    """Factory for creating test users"""
    def _create_user(role='CUSTOMER', **kwargs):
        defaults = {
            'username': f'testuser_{role.lower()}',
            'email': f'test_{role.lower()}@example.com',
            'role': role,
            'phone_number': '+1234567890'
        }
        defaults.update(kwargs)
        return User.objects.create_user(**defaults)
    return _create_user

@pytest.fixture
def customer_user(user_factory):
    """Create a customer user for testing"""
    return user_factory(role='CUSTOMER')

@pytest.fixture
def courier_user(user_factory):
    """Create a courier user for testing"""
    return user_factory(role='COURIER')

@pytest.fixture
def admin_user(user_factory):
    """Create an admin user for testing"""
    return user_factory(role='ADMIN')