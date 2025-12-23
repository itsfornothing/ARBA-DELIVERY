"""
Property-based tests for authentication consistency.

**Feature: delivery-app, Property 1: User Registration and Authentication Consistency**
**Validates: Requirements 1.2, 1.3, 2.1**
"""

import pytest
from hypothesis import given, strategies as st, settings
from hypothesis.extra.django import TestCase as HypothesisTestCase
from django.contrib.auth import authenticate
from rest_framework.test import APIClient
from rest_framework import status
from accounts.models import User
from accounts.serializers import UserRegistrationSerializer


class TestAuthenticationProperties(HypothesisTestCase):
    """Property-based tests for authentication consistency"""
    
    def setUp(self):
        self.client = APIClient()
    
    @given(
        username=st.text(
            alphabet='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_',
            min_size=3,
            max_size=20
        ).filter(lambda x: x.strip() and not x.isspace() and x.isalnum()),
        email=st.emails().filter(lambda x: len(x) <= 254),  # Django email field max length
        password=st.text(
            alphabet='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*',
            min_size=8,
            max_size=30
        ).filter(
            lambda x: any(c.isalpha() for c in x) and any(c.isdigit() for c in x) and '\x00' not in x
        ),
        first_name=st.text(
            alphabet='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
            min_size=1,
            max_size=20
        ).filter(lambda x: x.strip() and not x.isspace() and x.isalpha()),
        last_name=st.text(
            alphabet='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
            min_size=1,
            max_size=20
        ).filter(lambda x: x.strip() and not x.isspace() and x.isalpha()),
        phone_number=st.text(
            alphabet='0123456789+-()',
            min_size=10,
            max_size=15
        ).filter(lambda x: any(c.isdigit() for c in x)),
        role=st.sampled_from(['CUSTOMER', 'COURIER', 'ADMIN'])
    )
    @settings(max_examples=50, deadline=None)
    def test_user_registration_and_authentication_consistency(
        self, username, email, password, first_name, last_name, phone_number, role
    ):
        """
        Property 1: User Registration and Authentication Consistency
        
        For any valid user registration data, the system must create an account 
        with correct role assignment and send appropriate verification notifications.
        
        This property ensures that:
        1. Valid registration data creates a user account
        2. The created user has the correct role assignment
        3. The user can authenticate with the provided credentials
        4. Authentication returns the correct user information
        """
        
        # Prepare registration data
        registration_data = {
            'username': username,
            'email': email,
            'password': password,
            'password_confirm': password,
            'first_name': first_name,
            'last_name': last_name,
            'phone_number': phone_number,
            'role': role
        }
        
        # Test user registration
        response = self.client.post('/api/auth/register/', registration_data)
        
        # Registration should succeed for valid data
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify response contains expected user data
        response_data = response.json()
        self.assertIn('user', response_data)
        self.assertIn('tokens', response_data)
        
        user_data = response_data['user']
        self.assertEqual(user_data['username'], username)
        # Email might be normalized to lowercase by Django
        self.assertEqual(user_data['email'].lower(), email.lower())
        self.assertEqual(user_data['role'], role)
        self.assertEqual(user_data['first_name'], first_name)
        self.assertEqual(user_data['last_name'], last_name)
        self.assertEqual(user_data['phone_number'], phone_number)
        
        # Verify user was created in database
        created_user = User.objects.get(username=username)
        # Email might be normalized to lowercase by Django
        self.assertEqual(created_user.email.lower(), email.lower())
        self.assertEqual(created_user.role, role)
        self.assertEqual(created_user.first_name, first_name)
        self.assertEqual(created_user.last_name, last_name)
        self.assertEqual(created_user.phone_number, phone_number)
        self.assertTrue(created_user.is_active)
        
        # Test authentication with created credentials
        login_data = {
            'username': username,
            'password': password
        }
        
        auth_response = self.client.post('/api/auth/login/', login_data)
        self.assertEqual(auth_response.status_code, status.HTTP_200_OK)
        
        # Verify authentication response contains correct user data
        auth_data = auth_response.json()
        self.assertIn('access', auth_data)
        self.assertIn('refresh', auth_data)
        self.assertIn('user', auth_data)
        
        auth_user_data = auth_data['user']
        self.assertEqual(auth_user_data['username'], username)
        self.assertEqual(auth_user_data['email'].lower(), email.lower())
        self.assertEqual(auth_user_data['role'], role)
        
        # Test Django's authenticate function
        django_user = authenticate(username=username, password=password)
        self.assertIsNotNone(django_user)
        self.assertEqual(django_user.username, username)
        self.assertEqual(django_user.role, role)
    
    @given(
        username=st.text(min_size=1, max_size=30),
        password=st.text(min_size=1, max_size=50)
    )
    @settings(max_examples=50, deadline=None)
    def test_authentication_fails_for_nonexistent_users(self, username, password):
        """
        Property: Authentication must fail for non-existent users
        
        For any username/password combination where the user doesn't exist,
        authentication should fail consistently.
        """
        
        # Ensure user doesn't exist
        if User.objects.filter(username=username).exists():
            return  # Skip this test case
        
        login_data = {
            'username': username,
            'password': password
        }
        
        response = self.client.post('/api/auth/login/', login_data)
        
        # Authentication should fail
        self.assertIn(response.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_401_UNAUTHORIZED])
    
    @given(
        role=st.sampled_from(['CUSTOMER', 'COURIER', 'ADMIN'])
    )
    @settings(max_examples=30, deadline=None)
    def test_role_assignment_consistency(self, role):
        """
        Property: Role assignment must be consistent and persistent
        
        For any valid role, when a user is created with that role,
        the role should be correctly stored and retrievable.
        """
        
        # Create a user with the specified role
        user_data = {
            'username': f'testuser_{role.lower()}',
            'email': f'test_{role.lower()}@example.com',
            'password': 'TestPassword123',
            'password_confirm': 'TestPassword123',
            'first_name': 'Test',
            'last_name': 'User',
            'phone_number': '+1234567890',
            'role': role
        }
        
        response = self.client.post('/api/auth/register/', user_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify role in response
        response_data = response.json()
        self.assertEqual(response_data['user']['role'], role)
        
        # Verify role in database
        created_user = User.objects.get(username=user_data['username'])
        self.assertEqual(created_user.role, role)
        
        # Verify role persists through authentication
        login_response = self.client.post('/api/auth/login/', {
            'username': user_data['username'],
            'password': user_data['password']
        })
        
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        auth_data = login_response.json()
        self.assertEqual(auth_data['user']['role'], role)
    
    def test_duplicate_username_registration_fails(self):
        """
        Property: Duplicate username registration must fail consistently
        """
        
        # Create first user
        user_data = {
            'username': 'testuser',
            'email': 'test1@example.com',
            'password': 'TestPassword123',
            'password_confirm': 'TestPassword123',
            'first_name': 'Test',
            'last_name': 'User',
            'phone_number': '+1234567890',
            'role': 'CUSTOMER'
        }
        
        response1 = self.client.post('/api/auth/register/', user_data)
        self.assertEqual(response1.status_code, status.HTTP_201_CREATED)
        
        # Try to create second user with same username
        user_data2 = user_data.copy()
        user_data2['email'] = 'test2@example.com'
        
        response2 = self.client.post('/api/auth/register/', user_data2)
        self.assertEqual(response2.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Verify error message mentions username
        response_data = response2.json()
        self.assertIn('username', str(response_data).lower())
    
    def test_duplicate_email_registration_fails(self):
        """
        Property: Duplicate email registration must fail consistently
        """
        
        # Create first user
        user_data = {
            'username': 'testuser1',
            'email': 'test@example.com',
            'password': 'TestPassword123',
            'password_confirm': 'TestPassword123',
            'first_name': 'Test',
            'last_name': 'User',
            'phone_number': '+1234567890',
            'role': 'CUSTOMER'
        }
        
        response1 = self.client.post('/api/auth/register/', user_data)
        self.assertEqual(response1.status_code, status.HTTP_201_CREATED)
        
        # Try to create second user with same email
        user_data2 = user_data.copy()
        user_data2['username'] = 'testuser2'
        
        response2 = self.client.post('/api/auth/register/', user_data2)
        self.assertEqual(response2.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Verify error message mentions email
        response_data = response2.json()
        self.assertIn('email', str(response_data).lower())