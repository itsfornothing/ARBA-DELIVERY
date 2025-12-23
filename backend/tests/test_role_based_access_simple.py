"""
Property-based tests for role-based access control.

**Feature: delivery-app, Property 8: Role-Based Access Control**
**Validates: Requirements 2.5, 12.1**
"""

import pytest
import uuid
from hypothesis import given, strategies as st, settings
from hypothesis.extra.django import TestCase as HypothesisTestCase
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from accounts.models import User


class TestRoleBasedAccessProperties(HypothesisTestCase):
    """Property-based tests for role-based access control"""
    
    def setUp(self):
        """Set up test client"""
        self.api_client = APIClient()
        
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
        self.api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
    
    @given(
        role=st.sampled_from(['CUSTOMER', 'COURIER', 'ADMIN'])
    )
    @settings(max_examples=30, deadline=None)
    def test_role_based_dashboard_access_control(self, role):
        """
        Property 8: Role-Based Access Control
        
        For any user action requiring specific permissions, the system must verify 
        the user's role matches the required permission level before allowing the action.
        
        This property ensures that:
        1. Users can only access dashboards appropriate to their role
        2. Access is denied for inappropriate role combinations
        3. Authentication is required for all dashboard access
        """
        
        # Map roles to users and expected accessible dashboards
        role_user_map = {
            'ADMIN': self.admin_user,
            'CUSTOMER': self.customer_user,
            'COURIER': self.courier_user
        }
        
        user = role_user_map[role]
        
        # Authenticate user
        self.authenticate_user(user)
        
        # Test access to role-specific dashboard
        dashboard_endpoints = {
            'ADMIN': '/api/auth/dashboard/admin/',
            'CUSTOMER': '/api/auth/dashboard/customer/',
            'COURIER': '/api/auth/dashboard/courier/'
        }
        
        # User should be able to access their own role's dashboard
        own_dashboard = dashboard_endpoints[role]
        response = self.api_client.get(own_dashboard)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify response contains user information
        response_data = response.json()
        self.assertIn('user', response_data)
        self.assertEqual(response_data['user']['role'], role)
        
        # Test access to other role dashboards (should be denied)
        for other_role, endpoint in dashboard_endpoints.items():
            if other_role != role:
                response = self.api_client.get(endpoint)
                self.assertEqual(
                    response.status_code, 
                    status.HTTP_403_FORBIDDEN,
                    f"User with role {role} should not access {other_role} dashboard"
                )
    
    @given(
        requesting_role=st.sampled_from(['CUSTOMER', 'COURIER', 'ADMIN'])
    )
    @settings(max_examples=30, deadline=None)
    def test_admin_only_endpoints_access_control(self, requesting_role):
        """
        Property: Admin-only endpoints must enforce role-based access
        
        For any admin-only endpoint, only users with ADMIN role should have access.
        All other roles should be denied access.
        """
        
        role_user_map = {
            'ADMIN': self.admin_user,
            'CUSTOMER': self.customer_user,
            'COURIER': self.courier_user
        }
        
        user = role_user_map[requesting_role]
        
        # Authenticate user
        self.authenticate_user(user)
        
        # Admin-only endpoints
        admin_endpoints = [
            '/api/auth/admin/users/',
            '/api/auth/admin/couriers/available/',
        ]
        
        for endpoint in admin_endpoints:
            response = self.api_client.get(endpoint)
            
            if requesting_role == 'ADMIN':
                # Admin should have access
                self.assertEqual(
                    response.status_code, 
                    status.HTTP_200_OK,
                    f"Admin should have access to {endpoint}"
                )
            else:
                # Non-admin should be denied
                self.assertEqual(
                    response.status_code, 
                    status.HTTP_403_FORBIDDEN,
                    f"Role {requesting_role} should not have access to {endpoint}"
                )
    
    def test_unauthenticated_access_denied(self):
        """
        Property: Unauthenticated users must be denied access to protected endpoints
        
        For any protected endpoint, unauthenticated requests should be denied.
        """
        
        # Clear any authentication
        self.api_client.credentials()
        
        protected_endpoints = [
            '/api/auth/dashboard/admin/',
            '/api/auth/dashboard/customer/',
            '/api/auth/dashboard/courier/',
            '/api/auth/admin/users/',
            '/api/auth/profile/',
        ]
        
        for endpoint in protected_endpoints:
            response = self.api_client.get(endpoint)
            self.assertIn(
                response.status_code,
                [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN],
                f"Unauthenticated access to {endpoint} should be denied"
            )
    
    @given(
        role=st.sampled_from(['CUSTOMER', 'COURIER', 'ADMIN'])
    )
    @settings(max_examples=20, deadline=None)
    def test_profile_access_consistency(self, role):
        """
        Property: Profile access must be consistent with user authentication
        
        For any authenticated user, they should be able to access their own profile
        and the profile data should match their authentication information.
        """
        
        role_user_map = {
            'ADMIN': self.admin_user,
            'CUSTOMER': self.customer_user,
            'COURIER': self.courier_user
        }
        
        user = role_user_map[role]
        
        # Authenticate user
        self.authenticate_user(user)
        
        # Access profile endpoint
        response = self.api_client.get('/api/auth/profile/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify profile data matches user
        profile_data = response.json()
        self.assertEqual(profile_data['id'], user.id)
        self.assertEqual(profile_data['username'], user.username)
        self.assertEqual(profile_data['email'], user.email)
        self.assertEqual(profile_data['role'], user.role)
        self.assertEqual(profile_data['first_name'], user.first_name)
        self.assertEqual(profile_data['last_name'], user.last_name)
    
    def test_admin_user_management_permissions(self):
        """
        Property: Admin user management operations must enforce proper permissions
        
        Only admin users should be able to perform user management operations
        like creating couriers, activating/deactivating users, etc.
        """
        
        # Test with admin user
        self.authenticate_user(self.admin_user)
        
        # Admin should be able to create courier
        courier_data = {
            'username': 'new_courier_test',
            'email': 'newcourier@test.com',
            'password': 'TestPassword123',
            'password_confirm': 'TestPassword123',
            'first_name': 'New',
            'last_name': 'Courier',
            'phone_number': '+1234567890'
        }
        
        response = self.api_client.post('/api/auth/admin/couriers/create/', courier_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Test with non-admin users
        for user in [self.customer_user, self.courier_user]:
            self.authenticate_user(user)
            
            # Non-admin should be denied
            response = self.api_client.post('/api/auth/admin/couriers/create/', courier_data)
            self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    @given(
        role=st.sampled_from(['CUSTOMER', 'COURIER'])
    )
    @settings(max_examples=20, deadline=None)
    def test_non_admin_cannot_access_user_management(self, role):
        """
        Property: Non-admin users must be denied access to user management endpoints
        
        For any non-admin user, access to user management endpoints should be denied.
        """
        
        role_user_map = {
            'CUSTOMER': self.customer_user,
            'COURIER': self.courier_user
        }
        
        user = role_user_map[role]
        
        # Authenticate user
        self.authenticate_user(user)
        
        # User management endpoints that should be admin-only
        admin_only_endpoints = [
            ('/api/auth/admin/users/', 'GET'),
            ('/api/auth/admin/couriers/create/', 'POST'),
            ('/api/auth/admin/couriers/available/', 'GET'),
        ]
        
        for endpoint, method in admin_only_endpoints:
            if method == 'GET':
                response = self.api_client.get(endpoint)
            elif method == 'POST':
                response = self.api_client.post(endpoint, {})
            
            self.assertEqual(
                response.status_code, 
                status.HTTP_403_FORBIDDEN,
                f"Role {role} should not have {method} access to {endpoint}"
            )