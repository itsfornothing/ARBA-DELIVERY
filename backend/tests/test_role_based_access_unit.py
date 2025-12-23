"""
Unit tests for role-based access control.

**Feature: delivery-app, Property 8: Role-Based Access Control**
**Validates: Requirements 2.5, 12.1**
"""

import uuid
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from accounts.models import User


class TestRoleBasedAccessControl(TestCase):
    """Unit tests for role-based access control"""
    
    def setUp(self):
        self.client = APIClient()
        
        # Generate unique usernames for each test run
        test_id = str(uuid.uuid4())[:8]
        
        # Create test users for each role
        self.admin_user = User.objects.create_user(
            username=f'admin_test_{test_id}',
            email=f'admin_{test_id}@test.com',
            password='TestPassword123',
            role='ADMIN',
            first_name='Admin',
            last_name='User'
        )
        
        self.customer_user = User.objects.create_user(
            username=f'customer_test_{test_id}',
            email=f'customer_{test_id}@test.com',
            password='TestPassword123',
            role='CUSTOMER',
            first_name='Customer',
            last_name='User'
        )
        
        self.courier_user = User.objects.create_user(
            username=f'courier_test_{test_id}',
            email=f'courier_{test_id}@test.com',
            password='TestPassword123',
            role='COURIER',
            first_name='Courier',
            last_name='User'
        )
    
    def authenticate_user(self, user):
        """Helper method to authenticate a user with JWT"""
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
    
    def test_admin_dashboard_access(self):
        """Test that admin users can access admin dashboard"""
        self.authenticate_user(self.admin_user)
        
        response = self.client.get('/api/auth/dashboard/admin/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        response_data = response.json()
        self.assertIn('user', response_data)
        self.assertEqual(response_data['user']['role'], 'ADMIN')
    
    def test_customer_dashboard_access(self):
        """Test that customer users can access customer dashboard"""
        self.authenticate_user(self.customer_user)
        
        response = self.client.get('/api/auth/dashboard/customer/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        response_data = response.json()
        self.assertIn('user', response_data)
        self.assertEqual(response_data['user']['role'], 'CUSTOMER')
    
    def test_courier_dashboard_access(self):
        """Test that courier users can access courier dashboard"""
        self.authenticate_user(self.courier_user)
        
        response = self.client.get('/api/auth/dashboard/courier/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        response_data = response.json()
        self.assertIn('user', response_data)
        self.assertEqual(response_data['user']['role'], 'COURIER')
    
    def test_cross_role_dashboard_access_denied(self):
        """Test that users cannot access dashboards for other roles"""
        # Customer trying to access admin dashboard
        self.authenticate_user(self.customer_user)
        response = self.client.get('/api/auth/dashboard/admin/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Customer trying to access courier dashboard
        response = self.client.get('/api/auth/dashboard/courier/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Courier trying to access admin dashboard
        self.authenticate_user(self.courier_user)
        response = self.client.get('/api/auth/dashboard/admin/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Courier trying to access customer dashboard
        response = self.client.get('/api/auth/dashboard/customer/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_admin_only_endpoints_access(self):
        """Test that only admin users can access admin-only endpoints"""
        admin_endpoints = [
            '/api/auth/admin/users/',
            '/api/auth/admin/couriers/available/',
        ]
        
        # Admin should have access
        self.authenticate_user(self.admin_user)
        for endpoint in admin_endpoints:
            response = self.client.get(endpoint)
            self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Non-admin users should be denied
        for user in [self.customer_user, self.courier_user]:
            self.authenticate_user(user)
            for endpoint in admin_endpoints:
                response = self.client.get(endpoint)
                self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_unauthenticated_access_denied(self):
        """Test that unauthenticated users are denied access to protected endpoints"""
        self.client.credentials()  # Clear authentication
        
        protected_endpoints = [
            '/api/auth/dashboard/admin/',
            '/api/auth/dashboard/customer/',
            '/api/auth/dashboard/courier/',
            '/api/auth/admin/users/',
            '/api/auth/profile/',
        ]
        
        for endpoint in protected_endpoints:
            response = self.client.get(endpoint)
            self.assertIn(
                response.status_code,
                [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]
            )
    
    def test_profile_access_consistency(self):
        """Test that users can access their own profile with correct data"""
        for user in [self.admin_user, self.customer_user, self.courier_user]:
            self.authenticate_user(user)
            
            response = self.client.get('/api/auth/profile/')
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            
            profile_data = response.json()
            self.assertEqual(profile_data['id'], user.id)
            self.assertEqual(profile_data['username'], user.username)
            self.assertEqual(profile_data['email'], user.email)
            self.assertEqual(profile_data['role'], user.role)
    
    def test_admin_user_management_permissions(self):
        """Test that only admin users can perform user management operations"""
        courier_data = {
            'username': 'new_courier_test',
            'email': 'newcourier@test.com',
            'password': 'TestPassword123',
            'password_confirm': 'TestPassword123',
            'first_name': 'New',
            'last_name': 'Courier',
            'phone_number': '+1234567890'
        }
        
        # Admin should be able to create courier
        self.authenticate_user(self.admin_user)
        response = self.client.post('/api/auth/admin/couriers/create/', courier_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Non-admin users should be denied
        for user in [self.customer_user, self.courier_user]:
            self.authenticate_user(user)
            response = self.client.post('/api/auth/admin/couriers/create/', courier_data)
            self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)