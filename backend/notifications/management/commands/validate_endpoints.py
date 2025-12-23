"""
Management command to validate that all required API endpoints are properly registered.
This addresses Requirements 4.2 from the delivery API endpoint fix specification.
"""

import logging
from django.core.management.base import BaseCommand
from django.urls import reverse, NoReverseMatch
from django.test import Client
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

logger = logging.getLogger(__name__)

User = get_user_model()


class Command(BaseCommand):
    help = 'Validate that all required API endpoints are properly registered'

    def add_arguments(self, parser):
        parser.add_argument(
            '--verbose',
            action='store_true',
            help='Enable verbose output',
        )

    def handle(self, *args, **options):
        self.verbose = options['verbose']
        self.stdout.write(self.style.SUCCESS('Starting endpoint validation...'))
        
        # Define required endpoints based on the specification
        required_endpoints = {
            # Notifications endpoints
            'notification-list': {
                'url_pattern': '/api/notifications/',
                'methods': ['GET', 'POST'],
                'description': 'Notifications list endpoint'
            },
            'notification-unread-count': {
                'url_pattern': '/api/notifications/unread_count/',
                'methods': ['GET'],
                'description': 'Unread notifications count endpoint'
            },
            'notification-unread': {
                'url_pattern': '/api/notifications/unread/',
                'methods': ['GET'],
                'description': 'Unread notifications list endpoint'
            },
            'notification-mark-read': {
                'url_pattern': '/api/notifications/{id}/mark_read/',
                'methods': ['PATCH'],
                'description': 'Mark single notification as read endpoint'
            },
            'notification-mark-as-read': {
                'url_pattern': '/api/notifications/mark_as_read/',
                'methods': ['POST'],
                'description': 'Mark multiple notifications as read endpoint'
            },
            'notification-mark-all-read': {
                'url_pattern': '/api/notifications/mark_all_read/',
                'methods': ['POST'],
                'description': 'Mark all notifications as read endpoint'
            },
            
            # Orders endpoints
            'order-list': {
                'url_pattern': '/api/orders/',
                'methods': ['GET', 'POST'],
                'description': 'Orders list endpoint'
            },
            'order-real-time-updates': {
                'url_pattern': '/api/orders/real_time_updates/',
                'methods': ['GET'],
                'description': 'Real-time updates endpoint'
            },
            'order-tracking-info': {
                'url_pattern': '/api/orders/{id}/tracking_info/',
                'methods': ['GET'],
                'description': 'Order tracking info endpoint'
            },
            'order-update-status': {
                'url_pattern': '/api/orders/{id}/update_status/',
                'methods': ['PATCH'],
                'description': 'Order status update endpoint'
            },
            'order-assign-courier': {
                'url_pattern': '/api/orders/{id}/assign_courier/',
                'methods': ['POST'],
                'description': 'Assign courier to order endpoint'
            },
            'order-accept-order': {
                'url_pattern': '/api/orders/{id}/accept_order/',
                'methods': ['POST'],
                'description': 'Accept order endpoint'
            },
            'order-available-orders': {
                'url_pattern': '/api/orders/available_orders/',
                'methods': ['GET'],
                'description': 'Available orders endpoint'
            },
        }
        
        validation_results = {
            'passed': [],
            'failed': [],
            'warnings': []
        }
        
        # Test each required endpoint
        for endpoint_name, endpoint_info in required_endpoints.items():
            try:
                self._validate_endpoint(endpoint_name, endpoint_info, validation_results)
            except Exception as e:
                error_msg = f"Error validating {endpoint_name}: {str(e)}"
                validation_results['failed'].append({
                    'endpoint': endpoint_name,
                    'error': error_msg,
                    'description': endpoint_info['description']
                })
                logger.error(error_msg)
        
        # Report results
        self._report_results(validation_results)
        
        # Exit with error code if any validations failed
        if validation_results['failed']:
            self.stdout.write(
                self.style.ERROR(
                    f"Endpoint validation failed! {len(validation_results['failed'])} endpoints are misconfigured."
                )
            )
            exit(1)
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f"All {len(validation_results['passed'])} required endpoints are properly configured!"
                )
            )

    def _validate_endpoint(self, endpoint_name, endpoint_info, results):
        """Validate a single endpoint"""
        try:
            # Try to reverse the URL
            if '{id}' in endpoint_info['url_pattern']:
                # For detail endpoints, use a test ID
                url = reverse(endpoint_name, kwargs={'pk': 1})
            else:
                url = reverse(endpoint_name)
            
            # Check if the URL matches expected pattern
            expected_pattern = endpoint_info['url_pattern'].replace('{id}', '1')
            if url != expected_pattern:
                results['warnings'].append({
                    'endpoint': endpoint_name,
                    'warning': f"URL pattern mismatch. Expected: {expected_pattern}, Got: {url}",
                    'description': endpoint_info['description']
                })
            
            results['passed'].append({
                'endpoint': endpoint_name,
                'url': url,
                'methods': endpoint_info['methods'],
                'description': endpoint_info['description']
            })
            
            if self.verbose:
                self.stdout.write(f"✓ {endpoint_name}: {url}")
                
        except NoReverseMatch as e:
            results['failed'].append({
                'endpoint': endpoint_name,
                'error': f"URL reverse failed: {str(e)}",
                'expected_pattern': endpoint_info['url_pattern'],
                'description': endpoint_info['description']
            })
            
            if self.verbose:
                self.stdout.write(f"✗ {endpoint_name}: URL reverse failed")

    def _report_results(self, results):
        """Report validation results"""
        self.stdout.write("\n" + "="*60)
        self.stdout.write(self.style.SUCCESS("ENDPOINT VALIDATION REPORT"))
        self.stdout.write("="*60)
        
        # Passed endpoints
        if results['passed']:
            self.stdout.write(f"\n✓ PASSED ({len(results['passed'])} endpoints):")
            for item in results['passed']:
                self.stdout.write(f"  - {item['endpoint']}: {item['url']}")
        
        # Failed endpoints
        if results['failed']:
            self.stdout.write(f"\n✗ FAILED ({len(results['failed'])} endpoints):")
            for item in results['failed']:
                self.stdout.write(
                    self.style.ERROR(f"  - {item['endpoint']}: {item['error']}")
                )
                self.stdout.write(f"    Description: {item['description']}")
                if 'expected_pattern' in item:
                    self.stdout.write(f"    Expected: {item['expected_pattern']}")
        
        # Warnings
        if results['warnings']:
            self.stdout.write(f"\n⚠ WARNINGS ({len(results['warnings'])} endpoints):")
            for item in results['warnings']:
                self.stdout.write(
                    self.style.WARNING(f"  - {item['endpoint']}: {item['warning']}")
                )
        
        # Summary
        self.stdout.write(f"\nSUMMARY:")
        self.stdout.write(f"  Passed: {len(results['passed'])}")
        self.stdout.write(f"  Failed: {len(results['failed'])}")
        self.stdout.write(f"  Warnings: {len(results['warnings'])}")
        
        # Log results for debugging
        if results['failed']:
            logger.error(f"Endpoint validation failed for {len(results['failed'])} endpoints")
            for item in results['failed']:
                logger.error(f"Failed endpoint: {item['endpoint']} - {item['error']}")
        
        if results['warnings']:
            logger.warning(f"Endpoint validation warnings for {len(results['warnings'])} endpoints")
            for item in results['warnings']:
                logger.warning(f"Warning for endpoint: {item['endpoint']} - {item['warning']}")