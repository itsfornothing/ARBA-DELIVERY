#!/usr/bin/env python3
"""
Error scenario testing script
Tests various error conditions and verifies proper error handling
"""

import os
import sys
import django
import json
import requests
from datetime import datetime
from typing import Dict, Any, Optional

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'delivery_platform.settings')
django.setup()

from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


class ErrorScenarioTester:
    def __init__(self, base_url: str = 'http://localhost:8000'):
        self.base_url = base_url
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
    
    def setup_test_user(self):
        """Create a test user"""
        print("\n🔧 Setting up test user...")
        
        user, created = User.objects.get_or_create(
            username='error_test_customer',
            defaults={
                'email': 'error_test@test.com',
                'first_name': 'Error',
                'last_name': 'Test',
                'role': 'CUSTOMER',
                'phone_number': '+1234567890'
            }
        )
        if created:
            user.set_password('testpass123')
            user.save()
        
        return user
    
    def get_auth_token(self, user: User) -> str:
        """Get JWT token for user"""
        refresh = RefreshToken.for_user(user)
        return str(refresh.access_token)
    
    def test_network_disconnection_simulation(self):
        """Test network disconnection scenarios"""
        print("\n🌐 Testing Network Disconnection Scenarios...")
        
        # Test connection to non-existent server
        try:
            response = requests.get('http://localhost:9999/api/notifications/unread_count/', timeout=2)
            self.log_result(
                "Network Disconnection Simulation",
                False,
                "Expected connection error but got response",
                {'status_code': response.status_code}
            )
        except requests.exceptions.ConnectionError:
            self.log_result(
                "Network Disconnection Simulation",
                True,
                "Connection error properly raised"
            )
        except requests.exceptions.Timeout:
            self.log_result(
                "Network Disconnection Simulation",
                True,
                "Timeout error properly raised"
            )
        except Exception as e:
            self.log_result(
                "Network Disconnection Simulation",
                True,
                f"Network error properly raised: {type(e).__name__}"
            )
    
    def test_invalid_authentication(self):
        """Test invalid authentication scenarios"""
        print("\n🔐 Testing Invalid Authentication Scenarios...")
        
        # Test with no authentication
        try:
            response = self.session.get(f'{self.base_url}/api/notifications/unread_count/')
            expected_status = 401
            success = response.status_code == expected_status
            
            self.log_result(
                "No Authentication",
                success,
                f"Status: {response.status_code} (Expected: {expected_status})",
                {'response': response.text[:200] if not success else None}
            )
        except Exception as e:
            self.log_result(
                "No Authentication",
                False,
                f"Unexpected error: {str(e)}"
            )
        
        # Test with invalid token
        try:
            headers = {'Authorization': 'Bearer invalid_token_12345'}
            response = self.session.get(f'{self.base_url}/api/notifications/unread_count/', headers=headers)
            expected_status = 401
            success = response.status_code == expected_status
            
            self.log_result(
                "Invalid Token",
                success,
                f"Status: {response.status_code} (Expected: {expected_status})",
                {'response': response.text[:200] if not success else None}
            )
        except Exception as e:
            self.log_result(
                "Invalid Token",
                False,
                f"Unexpected error: {str(e)}"
            )
        
        # Test with malformed token
        try:
            headers = {'Authorization': 'Bearer malformed.token.here'}
            response = self.session.get(f'{self.base_url}/api/notifications/unread_count/', headers=headers)
            expected_status = 401
            success = response.status_code == expected_status
            
            self.log_result(
                "Malformed Token",
                success,
                f"Status: {response.status_code} (Expected: {expected_status})",
                {'response': response.text[:200] if not success else None}
            )
        except Exception as e:
            self.log_result(
                "Malformed Token",
                False,
                f"Unexpected error: {str(e)}"
            )
        
        # Test with expired token (simulate by using a very old token)
        try:
            # Create a token with very short expiry
            user = self.setup_test_user()
            refresh = RefreshToken.for_user(user)
            # Manually create an expired token by setting exp to past
            import jwt
            from django.conf import settings
            
            payload = {
                'token_type': 'access',
                'exp': 1000000000,  # Very old timestamp (2001)
                'iat': 1000000000,
                'jti': 'test_expired_token',
                'user_id': str(user.id)
            }
            expired_token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')
            
            headers = {'Authorization': f'Bearer {expired_token}'}
            response = self.session.get(f'{self.base_url}/api/notifications/unread_count/', headers=headers)
            expected_status = 401
            success = response.status_code == expected_status
            
            self.log_result(
                "Expired Token",
                success,
                f"Status: {response.status_code} (Expected: {expected_status})",
                {'response': response.text[:200] if not success else None}
            )
        except Exception as e:
            self.log_result(
                "Expired Token",
                False,
                f"Unexpected error: {str(e)}"
            )
    
    def test_invalid_data_handling(self, auth_token: str):
        """Test invalid data handling scenarios"""
        print("\n📊 Testing Invalid Data Handling...")
        
        headers = {'Authorization': f'Bearer {auth_token}'}
        
        # Test non-existent order tracking
        try:
            response = self.session.get(f'{self.base_url}/api/orders/99999/tracking_info/', headers=headers)
            expected_status = 404
            success = response.status_code == expected_status
            
            self.log_result(
                "Non-existent Order Tracking",
                success,
                f"Status: {response.status_code} (Expected: {expected_status})",
                {'response': response.text[:200] if not success else None}
            )
        except Exception as e:
            self.log_result(
                "Non-existent Order Tracking",
                False,
                f"Unexpected error: {str(e)}"
            )
        
        # Test invalid timestamp parameter
        try:
            response = self.session.get(f'{self.base_url}/api/orders/real_time_updates/?since=invalid_timestamp', headers=headers)
            expected_status = 400
            success = response.status_code == expected_status
            
            self.log_result(
                "Invalid Timestamp Parameter",
                success,
                f"Status: {response.status_code} (Expected: {expected_status})",
                {'response': response.text[:200] if not success else None}
            )
        except Exception as e:
            self.log_result(
                "Invalid Timestamp Parameter",
                False,
                f"Unexpected error: {str(e)}"
            )
        
        # Test invalid order ID format
        try:
            response = self.session.get(f'{self.base_url}/api/orders/invalid_id/tracking_info/', headers=headers)
            expected_status = 404
            success = response.status_code == expected_status
            
            self.log_result(
                "Invalid Order ID Format",
                success,
                f"Status: {response.status_code} (Expected: {expected_status})",
                {'response': response.text[:200] if not success else None}
            )
        except Exception as e:
            self.log_result(
                "Invalid Order ID Format",
                False,
                f"Unexpected error: {str(e)}"
            )
    
    def test_error_response_format(self, auth_token: str):
        """Test that error responses have consistent format"""
        print("\n📋 Testing Error Response Format...")
        
        headers = {'Authorization': f'Bearer {auth_token}'}
        
        # Test 404 error response format
        try:
            response = self.session.get(f'{self.base_url}/api/orders/99999/tracking_info/', headers=headers)
            if response.status_code == 404:
                try:
                    error_data = response.json()
                    has_error_field = 'error' in error_data or 'detail' in error_data
                    
                    self.log_result(
                        "404 Error Response Format",
                        has_error_field,
                        f"Has error field: {has_error_field}",
                        {'response': error_data} if not has_error_field else None
                    )
                except json.JSONDecodeError:
                    self.log_result(
                        "404 Error Response Format",
                        False,
                        "Response is not valid JSON",
                        {'response': response.text[:200]}
                    )
            else:
                self.log_result(
                    "404 Error Response Format",
                    False,
                    f"Expected 404 but got {response.status_code}"
                )
        except Exception as e:
            self.log_result(
                "404 Error Response Format",
                False,
                f"Unexpected error: {str(e)}"
            )
        
        # Test 400 error response format
        try:
            response = self.session.get(f'{self.base_url}/api/orders/real_time_updates/?since=invalid', headers=headers)
            if response.status_code == 400:
                try:
                    error_data = response.json()
                    has_error_field = 'error' in error_data or 'detail' in error_data
                    
                    self.log_result(
                        "400 Error Response Format",
                        has_error_field,
                        f"Has error field: {has_error_field}",
                        {'response': error_data} if not has_error_field else None
                    )
                except json.JSONDecodeError:
                    self.log_result(
                        "400 Error Response Format",
                        False,
                        "Response is not valid JSON",
                        {'response': response.text[:200]}
                    )
            else:
                self.log_result(
                    "400 Error Response Format",
                    False,
                    f"Expected 400 but got {response.status_code}"
                )
        except Exception as e:
            self.log_result(
                "400 Error Response Format",
                False,
                f"Unexpected error: {str(e)}"
            )
    
    def test_user_friendly_error_messages(self):
        """Test that error messages are user-friendly"""
        print("\n💬 Testing User-Friendly Error Messages...")
        
        # Test unauthenticated access
        try:
            response = self.session.get(f'{self.base_url}/api/notifications/unread_count/')
            if response.status_code == 401:
                try:
                    error_data = response.json()
                    error_message = error_data.get('error') or error_data.get('detail', '')
                    
                    # Check if message is user-friendly (not technical)
                    technical_terms = ['traceback', 'exception', 'stack', 'django', 'python']
                    is_user_friendly = not any(term in error_message.lower() for term in technical_terms)
                    
                    self.log_result(
                        "User-Friendly Error Messages",
                        is_user_friendly,
                        f"Message is user-friendly: {is_user_friendly}",
                        {'error_message': error_message} if not is_user_friendly else None
                    )
                except json.JSONDecodeError:
                    self.log_result(
                        "User-Friendly Error Messages",
                        False,
                        "Error response is not JSON"
                    )
            else:
                self.log_result(
                    "User-Friendly Error Messages",
                    False,
                    f"Expected 401 but got {response.status_code}"
                )
        except Exception as e:
            self.log_result(
                "User-Friendly Error Messages",
                False,
                f"Unexpected error: {str(e)}"
            )
    
    def test_server_availability(self):
        """Test server availability and basic health"""
        print("\n🏥 Testing Server Availability...")
        
        # Test basic server response
        try:
            response = self.session.get(f'{self.base_url}/api/health/', timeout=5)
            success = response.status_code == 200
            
            self.log_result(
                "Server Health Check",
                success,
                f"Status: {response.status_code}",
                {'response': response.text[:200] if not success else None}
            )
        except requests.exceptions.ConnectionError:
            self.log_result(
                "Server Health Check",
                False,
                "Server is not running or not accessible"
            )
        except requests.exceptions.Timeout:
            self.log_result(
                "Server Health Check",
                False,
                "Server response timeout"
            )
        except Exception as e:
            self.log_result(
                "Server Health Check",
                False,
                f"Unexpected error: {str(e)}"
            )
    
    def run_all_tests(self):
        """Run all error scenario tests"""
        print("🚀 Starting Error Scenario Testing...")
        print("=" * 50)
        
        # Test server availability first
        self.test_server_availability()
        
        # Test network disconnection simulation
        self.test_network_disconnection_simulation()
        
        # Test invalid authentication
        self.test_invalid_authentication()
        
        # Test user-friendly error messages
        self.test_user_friendly_error_messages()
        
        # Test with valid authentication for data-related errors
        try:
            user = self.setup_test_user()
            auth_token = self.get_auth_token(user)
            
            # Test invalid data handling
            self.test_invalid_data_handling(auth_token)
            
            # Test error response format
            self.test_error_response_format(auth_token)
            
        except Exception as e:
            print(f"⚠️  Could not set up authenticated tests: {str(e)}")
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 50)
        print("📊 ERROR SCENARIO TEST SUMMARY")
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
        with open('error_scenario_test_results.json', 'w') as f:
            json.dump(self.test_results, f, indent=2, default=str)
        print("📄 Detailed results saved to: error_scenario_test_results.json")


if __name__ == '__main__':
    tester = ErrorScenarioTester()
    tester.run_all_tests()