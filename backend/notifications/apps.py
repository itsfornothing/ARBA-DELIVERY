from django.apps import AppConfig
import logging

logger = logging.getLogger(__name__)


class NotificationsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "notifications"

    def ready(self):
        """Import signals and perform startup validation when the app is ready"""
        import notifications.signals
        
        # Perform endpoint validation on startup (only in non-test environments)
        import sys
        if 'test' not in sys.argv and 'migrate' not in sys.argv:
            self._validate_endpoints()
    
    def _validate_endpoints(self):
        """Validate that required endpoints are properly registered"""
        from django.urls import reverse, NoReverseMatch
        
        # Critical endpoints that must be available
        critical_endpoints = [
            ('notifications:notification-list', 'Notifications list'),
            ('notifications:notification-unread-count', 'Unread count'),
            ('notifications:notification-unread', 'Unread notifications'),
        ]
        
        missing_endpoints = []
        
        for endpoint_name, description in critical_endpoints:
            try:
                reverse(endpoint_name)
                logger.info(f"✓ Endpoint validated: {endpoint_name}")
            except NoReverseMatch:
                missing_endpoints.append(f"{endpoint_name} ({description})")
                logger.error(f"✗ Missing endpoint: {endpoint_name} ({description})")
        
        if missing_endpoints:
            error_msg = f"Critical endpoints are missing: {', '.join(missing_endpoints)}"
            logger.error(error_msg)
            logger.error("Run 'python manage.py validate_endpoints' for detailed information")
        else:
            logger.info("All critical notification endpoints are properly registered")
