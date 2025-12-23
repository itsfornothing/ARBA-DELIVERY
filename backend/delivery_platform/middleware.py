"""
Middleware for enhanced error logging and debugging.
This addresses Requirements 4.1 from the delivery API endpoint fix specification.
"""

import logging
import json
from django.http import Http404
from django.urls import resolve, Resolver404
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger('delivery_platform.404_errors')


class Enhanced404LoggingMiddleware(MiddlewareMixin):
    """
    Middleware to capture and log detailed information about 404 errors.
    
    This helps with debugging API endpoint routing issues by logging:
    - Requested URL path
    - HTTP method
    - User information (if authenticated)
    - Request headers
    - Query parameters
    - Available URL patterns (for debugging)
    """
    
    def process_exception(self, request, exception):
        """Process 404 exceptions and log detailed information"""
        if isinstance(exception, Http404):
            self._log_404_error(request, exception)
        return None
    
    def process_response(self, request, response):
        """Process responses and log 404 status codes"""
        if response.status_code == 404:
            self._log_404_error(request, None, response)
        return response
    
    def _log_404_error(self, request, exception=None, response=None):
        """Log detailed 404 error information"""
        try:
            # Basic request information
            log_data = {
                'path': request.path,
                'method': request.method,
                'full_path': request.get_full_path(),
                'user_agent': request.META.get('HTTP_USER_AGENT', 'Unknown'),
                'remote_addr': self._get_client_ip(request),
                'timestamp': str(request.META.get('HTTP_DATE', 'Unknown')),
            }
            
            # User information (if authenticated)
            if hasattr(request, 'user') and request.user.is_authenticated:
                log_data['user'] = {
                    'id': request.user.id,
                    'username': request.user.username,
                    'role': getattr(request.user, 'role', 'Unknown'),
                    'is_staff': request.user.is_staff,
                }
            else:
                log_data['user'] = 'Anonymous'
            
            # Query parameters
            if request.GET:
                log_data['query_params'] = dict(request.GET)
            
            # Request headers (filtered for security)
            safe_headers = self._get_safe_headers(request)
            if safe_headers:
                log_data['headers'] = safe_headers
            
            # POST data (if applicable and safe to log)
            if request.method == 'POST' and request.content_type == 'application/json':
                try:
                    # Only log non-sensitive JSON data
                    post_data = json.loads(request.body.decode('utf-8'))
                    # Remove sensitive fields
                    safe_post_data = self._filter_sensitive_data(post_data)
                    if safe_post_data:
                        log_data['post_data'] = safe_post_data
                except (json.JSONDecodeError, UnicodeDecodeError):
                    log_data['post_data'] = 'Could not parse JSON data'
            
            # Try to resolve URL to see if it's close to a valid pattern
            similar_patterns = self._find_similar_url_patterns(request.path)
            if similar_patterns:
                log_data['similar_patterns'] = similar_patterns
            
            # Exception details
            if exception:
                log_data['exception'] = str(exception)
            
            # Response details
            if response:
                log_data['response_status'] = response.status_code
                if hasattr(response, 'content'):
                    # Log first 200 chars of response content for debugging
                    content_preview = response.content.decode('utf-8', errors='ignore')[:200]
                    log_data['response_preview'] = content_preview
            
            # Log the 404 error with all collected information
            logger.warning(
                f"404 Error: {request.method} {request.path}",
                extra={
                    '404_details': log_data,
                    'request_path': request.path,
                    'request_method': request.method,
                    'user_id': log_data.get('user', {}).get('id') if isinstance(log_data.get('user'), dict) else None,
                }
            )
            
            # Also log to console in DEBUG mode for immediate visibility
            from django.conf import settings
            if settings.DEBUG:
                print(f"\n🔍 404 DEBUG INFO:")
                print(f"   Path: {request.method} {request.path}")
                print(f"   User: {log_data.get('user', 'Anonymous')}")
                if similar_patterns:
                    print(f"   Similar patterns: {', '.join(similar_patterns)}")
                print(f"   Full details logged to 404_errors logger\n")
                
        except Exception as e:
            # Don't let logging errors break the application
            logger.error(f"Error in 404 logging middleware: {str(e)}")
    
    def _get_client_ip(self, request):
        """Get the client IP address from request"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
    
    def _get_safe_headers(self, request):
        """Get safe headers to log (excluding sensitive information)"""
        safe_header_keys = [
            'HTTP_ACCEPT',
            'HTTP_ACCEPT_ENCODING',
            'HTTP_ACCEPT_LANGUAGE',
            'HTTP_CACHE_CONTROL',
            'HTTP_CONNECTION',
            'HTTP_CONTENT_TYPE',
            'HTTP_HOST',
            'HTTP_REFERER',
            'HTTP_USER_AGENT',
            'HTTP_X_REQUESTED_WITH',
        ]
        
        safe_headers = {}
        for key in safe_header_keys:
            if key in request.META:
                safe_headers[key] = request.META[key]
        
        return safe_headers
    
    def _filter_sensitive_data(self, data):
        """Remove sensitive fields from data before logging"""
        if not isinstance(data, dict):
            return data
        
        sensitive_fields = [
            'password', 'token', 'secret', 'key', 'auth',
            'authorization', 'credential', 'private'
        ]
        
        filtered_data = {}
        for key, value in data.items():
            key_lower = key.lower()
            if any(sensitive_field in key_lower for sensitive_field in sensitive_fields):
                filtered_data[key] = '[FILTERED]'
            elif isinstance(value, dict):
                filtered_data[key] = self._filter_sensitive_data(value)
            else:
                filtered_data[key] = value
        
        return filtered_data
    
    def _find_similar_url_patterns(self, requested_path):
        """Find URL patterns similar to the requested path for debugging"""
        try:
            from django.urls import get_resolver
            from difflib import get_close_matches
            
            resolver = get_resolver()
            
            # Get all URL patterns
            all_patterns = []
            self._collect_url_patterns(resolver.url_patterns, all_patterns)
            
            # Find similar patterns
            similar = get_close_matches(
                requested_path, 
                all_patterns, 
                n=3, 
                cutoff=0.6
            )
            
            return similar
            
        except Exception:
            # Don't let pattern matching errors break the logging
            return []
    
    def _collect_url_patterns(self, patterns, collected, prefix=''):
        """Recursively collect all URL patterns"""
        for pattern in patterns:
            try:
                if hasattr(pattern, 'url_patterns'):
                    # This is an include() pattern
                    new_prefix = prefix + str(pattern.pattern)
                    self._collect_url_patterns(pattern.url_patterns, collected, new_prefix)
                else:
                    # This is a regular pattern
                    full_pattern = prefix + str(pattern.pattern)
                    # Convert regex pattern to a more readable format
                    readable_pattern = self._make_pattern_readable(full_pattern)
                    collected.append(readable_pattern)
            except Exception:
                # Skip patterns that cause errors
                continue
    
    def _make_pattern_readable(self, pattern):
        """Convert regex URL pattern to a more readable format"""
        # Simple conversions for common patterns
        pattern = str(pattern)
        pattern = pattern.replace('^', '')
        pattern = pattern.replace('$', '')
        pattern = pattern.replace('\\/', '/')
        pattern = pattern.replace('(?P<pk>[^/.]+)', '{id}')
        pattern = pattern.replace('(?P<id>[^/.]+)', '{id}')
        
        # Ensure it starts with /
        if not pattern.startswith('/'):
            pattern = '/' + pattern
            
        return pattern