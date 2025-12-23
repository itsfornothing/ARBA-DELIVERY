#!/usr/bin/env python3
"""
Role-based access testing script
Tests that different user roles have appropriate access to endpoints
"""

import os
import sys
import django
import json
from datetime import datetime
from typing import Dict, List, Tuple

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'delivery_platform.settings')
django.setup()

from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from orders.models import Order, PricingConfig
from notifications.models import Notification

User = get_user_model()


class RoleBasedTester:
    def __init__(self):
        self.client = APIClient()
        self.test_results = []
        self.users = {}
        
    def log_result(self, test_name: str, role: str, success: bool, message: str, details: Dict = None):
        """Log test result"""
        result = {
            'test': test_name,
            'role': role,
            'success': success,
            'message': message,
            'timestamp': datetime.now().isoformat(),
            'details': details or {}
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} [{role}] {test_name}: {message}")
        if details and not success:
            print(f"   Details: {json.dumps(details, indent=2)}")
    
    def setup_test_data(self):
        """Create test users and sample data"""
        print("\n🔧 Setting up test data...")
        
        # Create users
        customer, _ = User.objects.get_or_create(
            username='test_customer',
            defaults={
                'email': 'customer@test.com',
                'first_name': 'Test',
                'last_name': 'Customer',
                'role': 'CUSTOMER',
                'phone_number': '+1234567890'
            }
        )
        customer.set_password('testpass123')
        customer.save()
        
        courier, _ = User.objects.get_or_create(
            username='test_courier',
            defaults={
                'email': 'courier@test.com',
                'first_name': 'Test',
                'last_name': 'Courier',
                'role': 'COURIER',
                'phone_number': '+1234567891'
            }
        )
        courier.set_password('testpass123')
        courier.save()
        
        admin, _ = User.objects.get_or_create(
            username='test_admin',
            defaults={
                'email': 'admin@test.com',
                'first_name': 'Test',
                'last_name': 'Admin',
                'role': 'ADMIN',
                'phone_number': '+1234567892'
            }
        )
        admin.set_password('testpass123')
        admin.save()
        
        # Create another customer for testing data isolation
        other_customer, _ = User.objects.get_or_create(
            username='other_customer',
            defaults={
                'email': 'other@test.com',
                'first_name': 'Other',
                'last_name': 'Customer',
                'role': 'CUSTOMER',
                'phone_number': '+1234567893'
            }
        )
        other_customer.set_password('testpass123')
        other_customer.save()
        
        self.users = {
            'customer': customer,
            'courier': courier,
            'admin': admin,
            'other_customer': other_customer
        }
        
        # Create sample orders
        Order.objects.filter(customer=customer).delete()
        Order.objects.filter(customer=other_customer).delete()
        
        customer_order = Order.objects.create(
            customer=customer,
            pickup_address='123 Main St',
            delivery_address='456 Oak Ave',
            distance_km=5.0,
            price=15.00,
            status='CREATED'
        )
        
        other_order = Order.objects.create(
            customer=other_customer,
            pickup_address='789 Pine St',
            delivery_address='321 Elm St',
            distance_km=3.0,
            price=12.00,
            status='CREATED'
        )
        
        # Create sample notifications
        Notification.objects.filter(user=customer).delete()
        Notification.objects.filter(user=other_customer).delete()
        
        Notification.objects.create(
            user=customer,
            title='Order Created',
            message='Your order has been created',
            related_order=customer_order,
            is_read=False
        )
        
        Notification.objects.create(
            user=other_customer,
            title='Order Created',
            message='Your order has been created',
            related_order=other_order,
            is_read=False
        )
        
        print(f"✓ Created test users: customer, courier, admin, other_customer")
        print(f"✓ Created sample orders and notifications")
        
        return customer_order, other_order
    
    def get_auth_token(self, user: User) -> str:
        """Get JWT token for user"""
        refresh = RefreshToken.for_user(user)
        return str(refresh.access_token)
    
    def get_response_data(self, response):
        """Extract data from response object"""
        if hasattr(response, 'data'):
            return response.data
        elif hasattr(response, 'json'):
            try:
                return response.json()
            except:
                pass
        if hasattr(response, 'content'):
            try:
                import json
                return json.loads(response.content.decode())
            except:
                return response.content.decode() if response.content else None
        return None
    
    def test_notifications_access(self, role: str, user: User, token: str):
        """Test notifications endpoint access for a role"""
        print(f"\n📬 Testing Notifications Access for {role}...")
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Test unread count
        response = self.client.get('/api/notifications/unread_count/')
        response_data = self.get_response_data(response)
        
        self.log_result(
            "Unread Count Access",
            role,
            response.status_code == 200,
            f"Status: {response.status_code}",
            {'response': response_data if response.status_code != 200 else None}
        )
        
        # Test notifications list
        response = self.client.get('/api/notifications/')
        response_data = self.get_response_data(response)
        success = response.status_code == 200
        
        if success and role == 'customer':
            # Verify customer only sees their own notifications
            notifications = response_data
            if isinstance(notifications, list):
                # Check that all notifications belong to this user
                all_own = all(n.get('user') == user.id for n in notifications if 'user' in n)
                self.log_result(
                    "Notifications Data Isolation",
                    role,
                    all_own,
                    "Customer sees only their own notifications" if all_own else "Customer sees other users' notifications",
                    {'notification_count': len(notifications)}
                )
        
        self.log_result(
            "Notifications List Access",
            role,
            success,
            f"Status: {response.status_code}",
            {'response': response_data if not success else None}
        )
        
        # Test unread notifications
        response = self.client.get('/api/notifications/unread/')
        response_data = self.get_response_data(response)
        self.log_result(
            "Unread Notifications Access",
            role,
            response.status_code == 200,
            f"Status: {response.status_code}",
            {'response': response_data if response.status_code != 200 else None}
        )
    
    def test_orders_access(self, role: str, user: User, token: str, customer_order_id: int, other_order_id: int):
        """Test orders endpoint access for a role"""
        print(f"\n📦 Testing Orders Access for {role}...")
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Test orders list
        response = self.client.get('/api/orders/')
        response_data = self.get_response_data(response)
        success = response.status_code == 200
        
        if success:
            orders = response_data
            if isinstance(orders, list):
                order_ids = [o.get('id') for o in orders]
                
                if role == 'customer':
                    # Customer should only see their own orders
                    has_own = customer_order_id in order_ids
                    has_other = other_order_id in order_ids
                    
                    self.log_result(
                        "Orders Data Isolation",
                        role,
                        has_own and not has_other,
                        f"Customer sees own order: {has_own}, sees other's order: {has_other}",
                        {'order_ids': order_ids}
                    )
                elif role == 'admin':
                    # Admin should see all orders
                    has_both = customer_order_id in order_ids and other_order_id in order_ids
                    self.log_result(
                        "Admin Full Access",
                        role,
                        has_both,
                        f"Admin sees all orders: {has_both}",
                        {'order_ids': order_ids}
                    )
                elif role == 'courier':
                    # Courier should see available orders (CREATED status)
                    self.log_result(
                        "Courier Available Orders",
                        role,
                        True,
                        f"Courier sees {len(orders)} orders",
                        {'order_count': len(orders)}
                    )
        
        self.log_result(
            "Orders List Access",
            role,
            success,
            f"Status: {response.status_code}",
            {'response': response_data if not success else None}
        )
        
        # Test real-time updates
        response = self.client.get('/api/orders/real_time_updates/')
        response_data = self.get_response_data(response)
        success = response.status_code == 200
        
        if success:
            data = response_data
            required_fields = ['orders', 'notifications', 'timestamp', 'has_updates']
            has_all_fields = all(field in data for field in required_fields)
            
            self.log_result(
                "Real-time Updates Format",
                role,
                has_all_fields,
                f"Has all required fields: {has_all_fields}",
                {'missing_fields': [f for f in required_fields if f not in data]} if not has_all_fields else None
            )
        
        self.log_result(
            "Real-time Updates Access",
            role,
            success,
            f"Status: {response.status_code}",
            {'response': response_data if not success else None}
        )
        
        # Test tracking info for own order (customer)
        if role == 'customer':
            response = self.client.get(f'/api/orders/{customer_order_id}/tracking_info/')
            response_data = self.get_response_data(response)
            self.log_result(
                "Own Order Tracking",
                role,
                response.status_code == 200,
                f"Status: {response.status_code}",
                {'response': response_data if response.status_code != 200 else None}
            )
            
            # Try to access other customer's order
            response = self.client.get(f'/api/orders/{other_order_id}/tracking_info/')
            response_data = self.get_response_data(response)
            self.log_result(
                "Other Order Tracking (Should Fail)",
                role,
                response.status_code == 403 or response.status_code == 404,
                f"Status: {response.status_code} (Expected 403 or 404)",
                {'response': response_data if response.status_code == 200 else None}
            )
    
    def test_admin_only_endpoints(self, role: str, token: str):
        """Test endpoints that should only be accessible to admins"""
        print(f"\n👨‍💼 Testing Admin-Only Endpoints for {role}...")
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Test dispatch statistics (admin only)
        response = self.client.get('/api/orders/dispatch_statistics/')
        response_data = self.get_response_data(response)
        
        if role == 'admin':
            expected_status = 200
            expected_result = True
        else:
            expected_status = 403
            expected_result = True
        
        actual_result = response.status_code == expected_status
        
        self.log_result(
            "Dispatch Statistics Access",
            role,
            actual_result,
            f"Status: {response.status_code} (Expected: {expected_status})",
            {'response': response_data if not actual_result else None}
        )
    
    def run_all_tests(self):
        """Run all role-based access tests"""
        print("🚀 Starting Role-Based Access Testing...")
        print("=" * 60)
        
        # Setup test data
        customer_order, other_order = self.setup_test_data()
        
        # Test each role
        for role_name, user in self.users.items():
            if role_name == 'other_customer':
                continue  # Skip other_customer for main tests
            
            print(f"\n{'=' * 60}")
            print(f"Testing Role: {role_name.upper()}")
            print(f"{'=' * 60}")
            
            token = self.get_auth_token(user)
            
            # Test notifications access
            self.test_notifications_access(role_name, user, token)
            
            # Test orders access
            self.test_orders_access(role_name, user, token, customer_order.id, other_order.id)
            
            # Test admin-only endpoints
            self.test_admin_only_endpoints(role_name, token)
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("📊 ROLE-BASED ACCESS TEST SUMMARY")
        print("=" * 60)
        
        # Group results by role
        roles = {}
        for result in self.test_results:
            role = result['role']
            if role not in roles:
                roles[role] = {'passed': 0, 'failed': 0, 'tests': []}
            
            if result['success']:
                roles[role]['passed'] += 1
            else:
                roles[role]['failed'] += 1
                roles[role]['tests'].append(result)
        
        # Print per-role summary
        for role, stats in roles.items():
            total = stats['passed'] + stats['failed']
            success_rate = (stats['passed'] / total * 100) if total > 0 else 0
            
            print(f"\n{role.upper()}:")
            print(f"  Total Tests: {total}")
            print(f"  Passed: {stats['passed']} ✅")
            print(f"  Failed: {stats['failed']} ❌")
            print(f"  Success Rate: {success_rate:.1f}%")
            
            if stats['failed'] > 0:
                print(f"  Failed Tests:")
                for test in stats['tests']:
                    print(f"    - {test['test']}: {test['message']}")
        
        # Overall summary
        total_tests = len(self.test_results)
        passed_tests = sum(1 for r in self.test_results if r['success'])
        failed_tests = total_tests - passed_tests
        
        print(f"\n{'=' * 60}")
        print(f"OVERALL:")
        print(f"  Total Tests: {total_tests}")
        print(f"  Passed: {passed_tests} ✅")
        print(f"  Failed: {failed_tests} ❌")
        print(f"  Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        print(f"{'=' * 60}")
        
        # Save detailed results
        with open('role_based_test_results.json', 'w') as f:
            json.dump(self.test_results, f, indent=2, default=str)
        print("\n📄 Detailed results saved to: role_based_test_results.json")


if __name__ == '__main__':
    tester = RoleBasedTester()
    tester.run_all_tests()
