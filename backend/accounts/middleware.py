from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin
import json


class RoleBasedAccessMiddleware(MiddlewareMixin):
    """
    Middleware to enforce role-based access control for specific URL patterns.
    This middleware checks user roles for protected endpoints.
    """
    
    # Define role-based URL patterns
    ROLE_PROTECTED_URLS = {
        '/auth/dashboard/admin/': ['ADMIN'],
        '/auth/dashboard/customer/': ['CUSTOMER'],
        '/auth/dashboard/courier/': ['COURIER'],
        '/auth/admin/': ['ADMIN'],
    }
    
    def process_request(self, request):
        # Skip middleware for non-API requests or unauthenticated users
        if not request.path.startswith('/auth/') or not request.user.is_authenticated:
            return None
        
        # Check if the URL requires specific roles
        for url_pattern, required_roles in self.ROLE_PROTECTED_URLS.items():
            if request.path.startswith(url_pattern):
                if not hasattr(request.user, 'role') or request.user.role not in required_roles:
                    return JsonResponse({
                        'error': 'Access denied. Insufficient permissions.',
                        'required_roles': required_roles,
                        'user_role': getattr(request.user, 'role', None)
                    }, status=403)
        
        return None


class JWTAuthenticationMiddleware(MiddlewareMixin):
    """
    Middleware to handle JWT authentication errors gracefully.
    """
    
    def process_response(self, request, response):
        # Handle JWT authentication errors
        if response.status_code == 401 and hasattr(response, 'data'):
            if isinstance(response.data, dict) and 'detail' in response.data:
                # Customize JWT error messages
                detail = response.data['detail']
                if 'token' in str(detail).lower():
                    response.data = {
                        'error': 'Authentication failed',
                        'message': 'Invalid or expired token. Please login again.',
                        'code': 'TOKEN_INVALID'
                    }
        
        return response