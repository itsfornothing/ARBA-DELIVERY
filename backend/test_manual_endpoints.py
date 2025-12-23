#!/usr/bin/env python3
"""
Manual testing script for delivery API endpoints
This script tests the endpoints that the customer dashboard relies on
"""

import os
import sys
import django
import requests
import json
from datetime import datetime
from typing import Dict, Any, Optional

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'delivery_platform.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.test import Client
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

class EndpointTester:
    def __init__(self, base_url: str = 'http://localhost:8000'):
        self.base_url = base_url
        self.client = APIClient()
        self.session = requests.Session()
        self.test_results = []
        
    def log_result(self, test_name: str, success: bool, message: str, details: Optional[Dict] = None):
        """Log test result"""
        result = {
            'test': test_name,
            'success': success,
            'message': message,
            'timestamp': datetime.now().isoformat(),
            'details': details or {}
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        if details and not success:
            print(f"   Details: {json.dumps(details, indent=2)}")
    
    def create_test_users(self):
        """Create test users for different roles"""
        print("\n🔧 Setting up test users...")
        
        # Create customer user
        customer, created = User.objects.get_or_create(
            username='test_customer',
            defaults={
                'email': 'customer@test.com',
                'first_name': 'Test',
                'last_name': 'Customer',
                'role': 'CUSTOMER',
                'phone_number': '+1234567890'
            }
        )
        if created:
            customer.set_password('testpass123')
            customer.save()
        
        # Create courier user
        courier, created = User.objects.get_or_create(
            username='test_courier',
            defaults={
                'email': 'courier@test.com',
                'first_name': 'Test',
                'last_name': 'Courier',
                'role': 'COURIER',
                'phone_number': '+1234567891'
            }
        )
        if created:
            courier.set_password('testpass123')
            courier.save()
        
        # Create admin user
        admin, created = User.objects.get_or_create(
            username='test_admin',
            defaults={
                'email': 'admin@test.com',
                'first_name': 'Test',
                'last_name': 'Admin',
                'role': 'ADMIN',
                'phone_number': '+1234567892'
            }
        )
        if created:
            admin.set_password('testpass123')
            admin.save()
        
        return customer, courier, admin
    
    def get_auth_token(self, user: User) -> str:
        """Get JWT token for user"""
        refresh = RefreshToken.for_user(user)
        return str(refresh.access_token)
    
    def test_endpoint_accessibility(self, endpoint: str, method: str = 'GET', 
                                  auth_token: Optional[str] = None, 
                                  data: Optional[Dict] = None) -> Dict[str, Any]:
        """Test if endpoint is accessible and returns expected response"""
        url = f"{self.base_url}{endpoint}"
        headers = {}
        
        if auth_token:
            headers['Authorization'] = f'Bearer {auth_token}'
        
        try:
            if method == 'GET':
                response = self.session.get(url, headers=headers)
            elif method == 'POST':
                headers['Content-Type'] = 'application/json'
                response = self.session.post(url, headers=headers, json=data or {})
            elif method == 'PATCH':
                headers['Content-Type'] = 'application/json'
                response = self.session.patch(url, headers=headers, json=data or {})
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            return {
                'status_code': response.status_code,
                'success': response.status_code < 400,
                'response_data': response.json() if response.content else None,
                'error': None
            }
        except requests.exceptions.RequestException as e:
            return {
                'status_code': 0,
                'success': False,
                'response_data': None,
                'error': str(e)
            }
        except json.JSONDecodeError:
            return {
                'status_code': response.status_code,
                'success': response.status_code < 400,
                'response_data': response.text,
                'error': 'Invalid JSON response'
            }
    
    def test_notifications_endpoints(self, auth_token: str):
        """Test notifications endpoints"""
        print("\n📬 Testing Notifications Endpoints...")
        
        # Test unread count endpoint
        result = self.test_endpoint_accessibility('/api/notifications/unread_count/', 'GET', auth_token)
        if result['success']:
            if isinstance(result['response_data'], dict) and 'unread_count' in result['response_data']:
                self.log_result(
                    "Notifications Unread Count", 
                    True, 
                    f"Endpoint accessible, returned unread_count: {result['response_data']['unread_count']}"
                )
            else:
                self.log_result(
                    "Notifications Unread Count", 
                    False, 
                    "Endpoint accessible but response format incorrect",
                    {'expected_field': 'unread_count', 'actual_response': result['response_data']}
                )
        else:
            self.log_result(
                "Notifications Unread Count", 
                False, 
                f"Endpoint not accessible: {result['status_code']}",
                {'error': result['error'], 'response': result['response_data']}
            )
        
        # Test notifications list endpoint
        result = self.test_endpoint_accessibility('/api/notifications/', 'GET', auth_token)
        self.log_result(
            "Notifications List", 
            result['success'], 
            f"Status: {result['status_code']}" + (f" - {result['error']}" if result['error'] else ""),
            {'response_data': result['response_data']} if not result['success'] else None
        )
        
        # Test unread notifications endpoint
        result = self.test_endpoint_accessibility('/api/notifications/unread/', 'GET', auth_token)
        self.log_result(
            "Notifications Unread List", 
            result['success'], 
            f"Status: {result['status_code']}" + (f" - {result['error']}" if result['error'] else ""),
            {'response_data': result['response_data']} if not result['success'] else None
        )
    
    def test_orders_endpoints(self, auth_token: str):
        """Test orders endpoints"""
        print("\n📦 Testing Orders Endpoints...")
        
        # Test orders list endpoint
        result = self.test_endpoint_accessibility('/api/orders/', 'GET', auth_token)
        self.log_result(
            "Orders List", 
            result['success'], 
            f"Status: {result['status_code']}" + (f" - {result['error']}" if result['error'] else ""),
            {'response_data': result['response_data']} if not result['success'] else None
        )
        
        # Test real-time updates endpoint
        result = self.test_endpoint_accessibility('/api/orders/real_time_updates/', 'GET', auth_token)
        if result['success']:
            expected_fields = ['orders', 'notifications', 'timestamp', 'has_updates']
            response_data = result['response_data']
            
            if isinstance(response_data, dict):
                missing_fields = [field for field in expected_fields if field not in response_data]
                if not missing_fields:
                    self.log_result(
                        "Orders Real-time Updates", 
                        True, 
                        f"Endpoint accessible with all required fields"
                    )
                else:
                    self.log_result(
                        "Orders Real-time Updates", 
                        False, 
                        f"Missing required fields: {missing_fields}",
                        {'expected_fields': expected_fields, 'actual_response': response_data}
                    )
            else:
                self.log_result(
                    "Orders Real-time Updates", 
                    False, 
                    "Response is not a JSON object",
                    {'response_type': type(response_data), 'response': response_data}
                )
        else:
            self.log_result(
                "Orders Real-time Updates", 
                False, 
                f"Endpoint not accessible: {result['status_code']}",
                {'error': result['error'], 'response': result['response_data']}
            )
    
    def test_authentication_scenarios(self):
        """Test authentication scenarios"""
        print("\n🔐 Testing Authentication Scenarios...")
        
        # Test unauthenticated access
        result = self.test_endpoint_accessibility('/api/notifications/unread_count/', 'GET')
        expected_status = 401
        self.log_result(
            "Unauthenticated Access", 
            result['status_code'] == expected_status, 
            f"Expected {expected_status}, got {result['status_code']}",
            {'response': result['response_data']} if result['status_code'] != expected_status else None
        )
        
        # Test invalid token
        result = self.test_endpoint_accessibility('/api/notifications/unread_count/', 'GET', 'invalid_token')
        self.log_result(
            "Invalid Token Access", 
            result['status_code'] == 401, 
            f"Expected 401, got {result['status_code']}",
            {'response': result['response_data']} if result['status_code'] != 401 else None
        )
    
    def test_error_scenarios(self, auth_token: str):
        """Test error handling scenarios"""
        print("\n⚠️  Testing Error Scenarios...")
        
        # Test non-existent order tracking
        result = self.test_endpoint_accessibility('/api/orders/99999/tracking_info/', 'GET', auth_token)
        self.log_result(
            "Non-existent Order Tracking", 
            result['status_code'] == 404, 
            f"Expected 404, got {result['status_code']}",
            {'response': result['response_data']} if result['status_code'] != 404 else None
        )
        
        # Test invalid real-time updates timestamp
        result = self.test_endpoint_accessibility('/api/orders/real_time_updates/?since=invalid_timestamp', 'GET', auth_token)
        self.log_result(
            "Invalid Timestamp Parameter", 
            result['status_code'] == 400, 
            f"Expected 400, got {result['status_code']}",
            {'response': result['response_data']} if result['status_code'] != 400 else None
        )
    
    def test_url_patterns(self):
        """Test that URL patterns don't contain duplicates"""
        print("\n🔗 Testing URL Pattern Correctness...")
        
        from django.urls import reverse
        from django.urls.exceptions import NoReverseMatch
        
        # Test that the correct URL patterns are generated
        try:
            # These should work (correct patterns)
            notifications_url = reverse('notification-unread-count')
            orders_url = reverse('order-real-time-updates')
            
            # Check that URLs don't contain duplicate resource names
            duplicate_patterns = []
            if '/notifications/notifications/' in notifications_url:
                duplicate_patterns.append('notifications')
            if '/orders/orders/' in orders_url:
                duplicate_patterns.append('orders')
            
            if not duplicate_patterns:
                self.log_result(
                    "URL Pattern Correctness", 
                    True, 
                    "No duplicate resource names found in URL patterns"
                )
            else:
                self.log_result(
                    "URL Pattern Correctness", 
                    False, 
                    f"Found duplicate resource names: {duplicate_patterns}",
                    {'notifications_url': notifications_url, 'orders_url': orders_url}
                )
                
        except NoReverseMatch as e:
            self.log_result(
                "URL Pattern Correctness", 
                False, 
                f"URL reverse failed: {str(e)}"
            )
    
    def run_all_tests(self):
        """Run all manual tests"""
        print("🚀 Starting Manual Endpoint Testing...")
        print("=" * 50)
        
        # Setup test users
        customer, courier, admin = self.create_test_users()
        
        # Get auth tokens
        customer_token = self.get_auth_token(customer)
        courier_token = self.get_auth_token(courier)
        admin_token = self.get_auth_token(admin)
        
        # Test URL patterns
        self.test_url_patterns()
        
        # Test authentication scenarios
        self.test_authentication_scenarios()
        
        # Test endpoints with different user roles
        print(f"\n👤 Testing as Customer ({customer.username})...")
        self.test_notifications_endpoints(customer_token)
        self.test_orders_endpoints(customer_token)
        self.test_error_scenarios(customer_token)
        
        print(f"\n🚚 Testing as Courier ({courier.username})...")
        self.test_notifications_endpoints(courier_token)
        self.test_orders_endpoints(courier_token)
        
        print(f"\n👨‍💼 Testing as Admin ({admin.username})...")
        self.test_notifications_endpoints(admin_token)
        self.test_orders_endpoints(admin_token)
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 50)
        print("📊 TEST SUMMARY")
        print("=" * 50)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print(f"\n❌ Failed Tests:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['test']}: {result['message']}")
        
        print("\n" + "=" * 50)
        
        # Save detailed results to file
        with open('manual_test_results.json', 'w') as f:
            json.dump(self.test_results, f, indent=2, default=str)
        print("📄 Detailed results saved to: manual_test_results.json")


if __name__ == '__main__':
    tester = EndpointTester()
    tester.run_all_tests()