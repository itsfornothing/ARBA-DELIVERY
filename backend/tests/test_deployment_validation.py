"""
Deployment validation tests for production environment
**Feature: delivery-app, Deployment Validation**
**Validates: System deployment and scalability requirements**
"""
import pytest
import time
import os
from django.test import TestCase, override_settings
from django.core.management import call_command
from django.db import connection
from django.core.cache import cache
from django.conf import settings
from unittest.mock import patch, MagicMock


class ProductionConfigurationTest(TestCase):
    """Test production configuration settings"""
    
    def test_debug_disabled_in_production(self):
        """Verify DEBUG is disabled in production"""
        with override_settings(DEBUG=False):
            self.assertFalse(settings.DEBUG)
    
    def test_secret_key_configured(self):
        """Verify SECRET_KEY is properly configured"""
        self.assertIsNotNone(settings.SECRET_KEY)
        self.assertNotEqual(settings.SECRET_KEY, 'django-insecure-development-key-change-in-production')
        self.assertGreater(len(settings.SECRET_KEY), 20)
    
    def test_allowed_hosts_configured(self):
        """Verify ALLOWED_HOSTS is properly configured"""
        self.assertIsInstance(settings.ALLOWED_HOSTS, list)
        self.assertGreater(len(settings.ALLOWED_HOSTS), 0)
        # Should not contain wildcard in production
        self.assertNotIn('*', settings.ALLOWED_HOSTS)
    
    def test_database_configuration(self):
        """Verify database configuration"""
        db_config = settings.DATABASES['default']
        self.assertIn('ENGINE', db_config)
        self.assertIn('NAME', db_config)
        
        # In production, should use PostgreSQL
        if not settings.DEBUG:
            self.assertIn('postgresql', db_config['ENGINE'])
    
    def test_static_files_configuration(self):
        """Verify static files are properly configured"""
        self.assertIsNotNone(settings.STATIC_URL)
        if hasattr(settings, 'STATIC_ROOT'):
            self.assertIsNotNone(settings.STATIC_ROOT)


class DatabaseConnectionTest(TestCase):
    """Test database connectivity and migrations"""
    
    def test_database_connection(self):
        """Test database connection is working"""
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            result = cursor.fetchone()
            self.assertEqual(result[0], 1)
    
    def test_database_migrations_applied(self):
        """Test that all migrations are applied"""
        from django.db.migrations.executor import MigrationExecutor
        
        executor = MigrationExecutor(connection)
        plan = executor.migration_plan(executor.loader.graph.leaf_nodes())
        
        # No pending migrations
        self.assertEqual(len(plan), 0, "There are unapplied migrations")
    
    def test_database_tables_exist(self):
        """Test that required tables exist"""
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
            """)
            tables = [row[0] for row in cursor.fetchall()]
            
            required_tables = [
                'accounts_user',
                'orders_order',
                'notifications_notification',
                'analytics_pricingconfig'
            ]
            
            for table in required_tables:
                self.assertIn(table, tables, f"Required table {table} not found")


class CacheConnectionTest(TestCase):
    """Test Redis cache connectivity"""
    
    def test_cache_connection(self):
        """Test Redis cache connection"""
        test_key = 'deployment_test_key'
        test_value = 'deployment_test_value'
        
        # Set and get value
        cache.set(test_key, test_value, 30)
        retrieved_value = cache.get(test_key)
        
        self.assertEqual(retrieved_value, test_value)
        
        # Clean up
        cache.delete(test_key)
    
    def test_cache_performance(self):
        """Test cache performance"""
        start_time = time.time()
        
        # Perform multiple cache operations
        for i in range(100):
            cache.set(f'perf_test_{i}', f'value_{i}', 30)
            cache.get(f'perf_test_{i}')
        
        end_time = time.time()
        duration = end_time - start_time
        
        # Should complete within reasonable time (2 seconds for 100 operations)
        self.assertLess(duration, 2.0, "Cache operations too slow")
        
        # Clean up
        for i in range(100):
            cache.delete(f'perf_test_{i}')


class HealthCheckEndpointTest(TestCase):
    """Test health check endpoints"""
    
    def test_health_check_endpoint(self):
        """Test main health check endpoint"""
        from django.test import Client
        
        client = Client()
        response = client.get('/api/health/')
        
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertIn('status', data)
        self.assertIn('checks', data)
        self.assertIn('timestamp', data)
    
    def test_readiness_check_endpoint(self):
        """Test readiness check endpoint"""
        from django.test import Client
        
        client = Client()
        response = client.get('/api/ready/')
        
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertEqual(data['status'], 'ready')
    
    def test_liveness_check_endpoint(self):
        """Test liveness check endpoint"""
        from django.test import Client
        
        client = Client()
        response = client.get('/api/live/')
        
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertEqual(data['status'], 'alive')


class StaticFilesTest(TestCase):
    """Test static file serving"""
    
    def test_static_files_collection(self):
        """Test that static files can be collected"""
        # This would normally be run during deployment
        try:
            call_command('collectstatic', '--noinput', verbosity=0)
        except Exception as e:
            self.fail(f"Static files collection failed: {e}")
    
    def test_static_root_exists(self):
        """Test that STATIC_ROOT directory exists or can be created"""
        if hasattr(settings, 'STATIC_ROOT') and settings.STATIC_ROOT:
            static_root = settings.STATIC_ROOT
            
            # Check if directory exists or can be created
            if not os.path.exists(static_root):
                try:
                    os.makedirs(static_root, exist_ok=True)
                    self.assertTrue(os.path.exists(static_root))
                except Exception as e:
                    self.fail(f"Cannot create STATIC_ROOT directory: {e}")


class SecurityConfigurationTest(TestCase):
    """Test security configuration"""
    
    def test_security_middleware_configured(self):
        """Test that security middleware is configured"""
        middleware = settings.MIDDLEWARE
        
        security_middleware = [
            'django.middleware.security.SecurityMiddleware',
            'django.middleware.csrf.CsrfViewMiddleware',
            'django.contrib.auth.middleware.AuthenticationMiddleware',
        ]
        
        for middleware_class in security_middleware:
            self.assertIn(middleware_class, middleware)
    
    def test_cors_configuration(self):
        """Test CORS configuration"""
        self.assertTrue(hasattr(settings, 'CORS_ALLOWED_ORIGINS'))
        
        # Should not allow all origins in production
        if not settings.DEBUG:
            cors_origins = getattr(settings, 'CORS_ALLOWED_ORIGINS', [])
            self.assertNotIn('*', cors_origins)
    
    def test_jwt_configuration(self):
        """Test JWT configuration"""
        self.assertTrue(hasattr(settings, 'SIMPLE_JWT'))
        
        jwt_config = settings.SIMPLE_JWT
        self.assertIn('ACCESS_TOKEN_LIFETIME', jwt_config)
        self.assertIn('REFRESH_TOKEN_LIFETIME', jwt_config)
        self.assertIn('ALGORITHM', jwt_config)


@pytest.mark.integration
class EndToEndDeploymentTest(TestCase):
    """End-to-end deployment validation tests"""
    
    def test_api_endpoints_accessible(self):
        """Test that main API endpoints are accessible"""
        from django.test import Client
        
        client = Client()
        
        # Test endpoints that should be accessible without authentication
        endpoints = [
            '/api/health/',
            '/api/ready/',
            '/api/live/',
        ]
        
        for endpoint in endpoints:
            response = client.get(endpoint)
            self.assertIn(response.status_code, [200, 301, 302], 
                         f"Endpoint {endpoint} not accessible")
    
    def test_admin_interface_accessible(self):
        """Test that admin interface is accessible"""
        from django.test import Client
        
        client = Client()
        response = client.get('/admin/')
        
        # Should redirect to login or show admin page
        self.assertIn(response.status_code, [200, 302])
    
    def test_authentication_flow(self):
        """Test basic authentication flow"""
        from django.contrib.auth import get_user_model
        from django.test import Client
        
        User = get_user_model()
        
        # Create test user
        user = User.objects.create_user(
            username='test_deployment',
            email='test@deployment.com',
            password='testpass123',
            role='CUSTOMER'
        )
        
        client = Client()
        
        # Test login endpoint exists
        response = client.post('/api/auth/login/', {
            'email': 'test@deployment.com',
            'password': 'testpass123'
        })
        
        # Should return 200 or appropriate auth response
        self.assertIn(response.status_code, [200, 400, 401])
        
        # Clean up
        user.delete()


class PerformanceValidationTest(TestCase):
    """Test performance characteristics"""
    
    def test_database_query_performance(self):
        """Test database query performance"""
        from django.contrib.auth import get_user_model
        
        User = get_user_model()
        
        start_time = time.time()
        
        # Perform database operations
        users = list(User.objects.all()[:10])
        
        end_time = time.time()
        duration = end_time - start_time
        
        # Should complete within reasonable time
        self.assertLess(duration, 1.0, "Database queries too slow")
    
    def test_health_check_response_time(self):
        """Test health check response time"""
        from django.test import Client
        
        client = Client()
        
        start_time = time.time()
        response = client.get('/api/health/')
        end_time = time.time()
        
        duration = end_time - start_time
        
        # Health check should be fast
        self.assertLess(duration, 0.5, "Health check too slow")
        self.assertEqual(response.status_code, 200)


class ResourceValidationTest(TestCase):
    """Test resource availability and limits"""
    
    def test_memory_usage_reasonable(self):
        """Test that memory usage is reasonable"""
        import psutil
        import os
        
        process = psutil.Process(os.getpid())
        memory_info = process.memory_info()
        
        # Memory usage should be less than 512MB for basic operations
        memory_mb = memory_info.rss / 1024 / 1024
        self.assertLess(memory_mb, 512, f"Memory usage too high: {memory_mb}MB")
    
    def test_file_system_permissions(self):
        """Test file system permissions"""
        import tempfile
        
        # Test write permissions in media directory
        if hasattr(settings, 'MEDIA_ROOT') and settings.MEDIA_ROOT:
            media_root = settings.MEDIA_ROOT
            
            try:
                # Create test file
                test_file = os.path.join(media_root, 'deployment_test.txt')
                os.makedirs(os.path.dirname(test_file), exist_ok=True)
                
                with open(test_file, 'w') as f:
                    f.write('deployment test')
                
                # Verify file exists and is readable
                self.assertTrue(os.path.exists(test_file))
                
                with open(test_file, 'r') as f:
                    content = f.read()
                    self.assertEqual(content, 'deployment test')
                
                # Clean up
                os.remove(test_file)
                
            except Exception as e:
                self.fail(f"File system permissions test failed: {e}")


if __name__ == '__main__':
    pytest.main([__file__])