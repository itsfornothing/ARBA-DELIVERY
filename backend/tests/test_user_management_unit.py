"""
Unit tests for user management operations.

Tests user creation, activation, deactivation workflows, admin permissions,
and user profile updates and validation.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**
"""

import uuid
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from accounts.models import User


class TestUserManagementOperations(TestCase):
    """Unit tests for user management operations"""
    
    def setUp(self):
        self.client = APIClient()
        
        # Generate unique usernames for each test run
        test_id = str(uuid.uuid4())[:8]
        
        # Create test admin user
        self.admin_user = User.objects.create_user(
            username=f'admin_test_{test_id}',
            email=f'admin_{test_id}@test.com',
            password='TestPassword123',
            role='ADMIN',
            first_name='Admin',
            last_name='User'
        )
        
        # Create test customer user
        self.customer_user = User.objects.create_user(
            username=f'customer_test_{test_id}',
            email=f'customer_{test_id}@test.com',
            password='TestPassword123',
            role='CUSTOMER',
            first_name='Customer',
            last_name='User'
        )
        
        # Create test courier user
        self.courier_user = User.objects.create_user(
            username=f'courier_test_{test_id}',
            email=f'courier_{test_id}@test.com',
            password='TestPassword123',
            role='COURIER',
            first_name='Courier',
            last_name='User'
        )
    
    def authenticate_admin(self):
        """Helper method to authenticate admin user"""
        refresh = RefreshToken.for_user(self.admin_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    
    def authenticate_user(self, user):
        """Helper method to authenticate any user"""
        refresh = RefreshToken.for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    
    def test_admin_can_list_all_users(self):
        """Test that admin can list all users"""
        self.authenticate_admin()
        
        response = self.client.get('/api/auth/admin/users/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Should return paginated results
        response_data = response.json()
        self.assertIn('results', response_data)
        
        # Should contain at least our test users
        user_count = response_data['count']
        self.assertGreaterEqual(user_count, 3)  # admin, customer, courier
    
    def test_admin_can_filter_users_by_role(self):
        """Test that admin can filter users by role"""
        self.authenticate_admin()
        
        # Filter by CUSTOMER role
        response = self.client.get('/api/auth/admin/users/?role=CUSTOMER')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        response_data = response.json()
        for user in response_data['results']:
            self.assertEqual(user['role'], 'CUSTOMER')
    
    def test_admin_can_filter_users_by_active_status(self):
        """Test that admin can filter users by active status"""
        self.authenticate_admin()
        
        # Filter by active status
        response = self.client.get('/api/auth/admin/users/?is_active=true')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        response_data = response.json()
        for user in response_data['results']:
            self.assertTrue(user['is_active'])
    
    def test_admin_can_search_users(self):
        """Test that admin can search users by username, email, or name"""
        self.authenticate_admin()
        
        # Search by username
        response = self.client.get(f'/api/auth/admin/users/?search={self.customer_user.username}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        response_data = response.json()
        self.assertGreater(response_data['count'], 0)
        
        # Verify search result contains the searched user
        found_user = False
        for user in response_data['results']:
            if user['username'] == self.customer_user.username:
                found_user = True
                break
        self.assertTrue(found_user)
    
    def test_admin_can_view_user_details(self):
        """Test that admin can view individual user details"""
        self.authenticate_admin()
        
        response = self.client.get(f'/api/auth/admin/users/{self.customer_user.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        user_data = response.json()
        self.assertEqual(user_data['id'], self.customer_user.id)
        self.assertEqual(user_data['username'], self.customer_user.username)
        self.assertEqual(user_data['role'], self.customer_user.role)
    
    def test_admin_can_update_user_details(self):
        """Test that admin can update user details"""
        self.authenticate_admin()
        
        update_data = {
            'first_name': 'Updated',
            'last_name': 'Name',
            'email': 'updated@test.com'
        }
        
        response = self.client.patch(f'/api/auth/admin/users/{self.customer_user.id}/', update_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify update in database
        updated_user = User.objects.get(id=self.customer_user.id)
        self.assertEqual(updated_user.first_name, 'Updated')
        self.assertEqual(updated_user.last_name, 'Name')
        self.assertEqual(updated_user.email, 'updated@test.com')
    
    def test_admin_can_activate_deactivate_users(self):
        """Test admin user activation and deactivation workflow"""
        self.authenticate_admin()
        
        # Deactivate user
        response = self.client.patch(f'/api/auth/admin/users/{self.customer_user.id}/activate/', {
            'is_active': False
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify user is deactivated
        deactivated_user = User.objects.get(id=self.customer_user.id)
        self.assertFalse(deactivated_user.is_active)
        
        # Reactivate user
        response = self.client.patch(f'/api/auth/admin/users/{self.customer_user.id}/activate/', {
            'is_active': True
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify user is reactivated
        reactivated_user = User.objects.get(id=self.customer_user.id)
        self.assertTrue(reactivated_user.is_active)
    
    def test_admin_can_create_courier_accounts(self):
        """Test admin courier account creation functionality"""
        self.authenticate_admin()
        
        courier_data = {
            'username': 'new_courier_test',
            'email': 'newcourier@test.com',
            'password': 'TestPassword123',
            'password_confirm': 'TestPassword123',
            'first_name': 'New',
            'last_name': 'Courier',
            'phone_number': '+1234567890'
        }
        
        response = self.client.post('/api/auth/admin/couriers/create/', courier_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify courier was created with correct role
        created_courier = User.objects.get(username='new_courier_test')
        self.assertEqual(created_courier.role, 'COURIER')
        self.assertEqual(created_courier.first_name, 'New')
        self.assertEqual(created_courier.last_name, 'Courier')
        self.assertTrue(created_courier.is_active)
    
    def test_admin_can_list_available_couriers(self):
        """Test admin can list available couriers"""
        self.authenticate_admin()
        
        response = self.client.get('/api/auth/admin/couriers/available/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        response_data = response.json()
        self.assertIn('results', response_data)
        
        # Should contain only courier users
        for courier in response_data['results']:
            self.assertEqual(courier['role'], 'COURIER')
            self.assertTrue(courier['is_active'])
    
    def test_non_admin_cannot_access_user_management(self):
        """Test that non-admin users cannot access user management endpoints"""
        
        # Test with customer user
        self.authenticate_user(self.customer_user)
        
        # Should be denied access to user listing
        response = self.client.get('/api/auth/admin/users/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Should be denied access to courier creation
        response = self.client.post('/api/auth/admin/couriers/create/', {})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Should be denied access to user activation
        response = self.client.patch(f'/api/auth/admin/users/{self.admin_user.id}/activate/', {})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Test with courier user
        self.authenticate_user(self.courier_user)
        
        # Should be denied access to user listing
        response = self.client.get('/api/auth/admin/users/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_user_profile_update_validation(self):
        """Test user profile update validation"""
        self.authenticate_user(self.customer_user)
        
        # Test valid profile update
        valid_update = {
            'first_name': 'Updated',
            'last_name': 'Customer',
            'email': 'updated_customer@test.com',
            'phone_number': '+9876543210'
        }
        
        response = self.client.patch('/api/auth/profile/', valid_update)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify update
        updated_user = User.objects.get(id=self.customer_user.id)
        self.assertEqual(updated_user.first_name, 'Updated')
        self.assertEqual(updated_user.email, 'updated_customer@test.com')
    
    def test_user_cannot_change_own_role(self):
        """Test that users cannot change their own role"""
        self.authenticate_user(self.customer_user)
        
        # Try to change role (should be ignored or rejected)
        response = self.client.patch('/api/auth/profile/', {
            'role': 'ADMIN'
        })
        
        # Should either succeed but ignore role change, or return error
        # Role should remain unchanged
        user = User.objects.get(id=self.customer_user.id)
        self.assertEqual(user.role, 'CUSTOMER')
    
    def test_courier_creation_validation(self):
        """Test courier creation validation"""
        self.authenticate_admin()
        
        # Test with missing required fields
        invalid_data = {
            'username': 'incomplete_courier',
            'password': 'TestPassword123',
            'password_confirm': 'TestPassword123'
            # Missing email, first_name, last_name, phone_number
        }
        
        response = self.client.post('/api/auth/admin/couriers/create/', invalid_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Test with password mismatch
        mismatch_data = {
            'username': 'mismatch_courier',
            'email': 'mismatch@test.com',
            'password': 'TestPassword123',
            'password_confirm': 'DifferentPassword123',
            'first_name': 'Test',
            'last_name': 'Courier',
            'phone_number': '+1234567890'
        }
        
        response = self.client.post('/api/auth/admin/couriers/create/', mismatch_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_duplicate_username_email_validation(self):
        """Test validation for duplicate usernames and emails"""
        self.authenticate_admin()
        
        # Try to create courier with existing username
        duplicate_username_data = {
            'username': self.customer_user.username,  # Existing username
            'email': 'different@test.com',
            'password': 'TestPassword123',
            'password_confirm': 'TestPassword123',
            'first_name': 'Test',
            'last_name': 'Courier',
            'phone_number': '+1234567890'
        }
        
        response = self.client.post('/api/auth/admin/couriers/create/', duplicate_username_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Try to create courier with existing email
        duplicate_email_data = {
            'username': 'unique_username',
            'email': self.customer_user.email,  # Existing email
            'password': 'TestPassword123',
            'password_confirm': 'TestPassword123',
            'first_name': 'Test',
            'last_name': 'Courier',
            'phone_number': '+1234567890'
        }
        
        response = self.client.post('/api/auth/admin/couriers/create/', duplicate_email_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_user_activation_validation(self):
        """Test user activation/deactivation validation"""
        self.authenticate_admin()
        
        # Test with missing is_active field
        response = self.client.patch(f'/api/auth/admin/users/{self.customer_user.id}/activate/', {})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Test with invalid user ID
        response = self.client.patch('/api/auth/admin/users/99999/activate/', {
            'is_active': False
        })
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)