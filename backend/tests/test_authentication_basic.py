"""
Basic unit tests for authentication functionality.
"""

from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from accounts.models import User


class TestBasicAuthentication(TestCase):
    """Basic authentication tests"""
    
    def setUp(self):
        self.client = APIClient()
    
    def test_user_registration_success(self):
        """Test successful user registration"""
        data = {
            'username': 'testuser123',
            'email': 'test@example.com',
            'password': 'TestPassword123',
            'password_confirm': 'TestPassword123',
            'first_name': 'Test',
            'last_name': 'User',
            'phone_number': '+1234567890',
            'role': 'CUSTOMER'
        }
        
        response = self.client.post('/api/auth/register/', data)
        
        # Print response for debugging
        if response.status_code != 201:
            print(f"Registration failed with status {response.status_code}")
            print(f"Response content: {response.content.decode()}")
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify user was created
        user = User.objects.get(username='testuser123')
        self.assertEqual(user.email, 'test@example.com')
        self.assertEqual(user.role, 'CUSTOMER')
    
    def test_user_login_success(self):
        """Test successful user login"""
        # Create a user first
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='TestPassword123',
            role='CUSTOMER'
        )
        
        # Try to login
        login_data = {
            'username': 'testuser',
            'password': 'TestPassword123'
        }
        
        response = self.client.post('/api/auth/login/', login_data)
        
        # Print response for debugging
        if response.status_code != 200:
            print(f"Login failed with status {response.status_code}")
            print(f"Response content: {response.content.decode()}")
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify response contains tokens
        response_data = response.json()
        self.assertIn('access', response_data)
        self.assertIn('refresh', response_data)
        self.assertIn('user', response_data)
        self.assertEqual(response_data['user']['username'], 'testuser')