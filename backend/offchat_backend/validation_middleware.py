"""
Input validation and sanitization middleware.
"""
import json
import logging
import time
from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger(__name__)

class InputValidationMiddleware(MiddlewareMixin):
    """Validate and sanitize incoming requests."""
    
    MAX_BODY_SIZE = 2147483648  # 2048MB
    DANGEROUS_PATTERNS = [
        '<script',
        'javascript:',
        'onerror=',
        'onclick=',
        'onload=',
    ]
    
    def process_request(self, request):
        # Check request body size
        if request.method in ['POST', 'PUT', 'PATCH']:
            content_length = request.META.get('CONTENT_LENGTH', 0)
            try:
                content_length = int(content_length)
                if content_length > self.MAX_BODY_SIZE:
                    logger.warning(f"Request body too large: {content_length} bytes from {request.META.get('REMOTE_ADDR')}")
                    return JsonResponse(
                        {'error': 'Request body too large'},
                        status=413
                    )
            except (ValueError, TypeError):
                pass
        
        # Validate JSON content type for API endpoints
        if request.path.startswith('/api/') and request.method in ['POST', 'PUT', 'PATCH']:
            content_type = request.META.get('CONTENT_TYPE', '')
            if 'application/json' not in content_type and 'multipart/form-data' not in content_type:
                logger.warning(f"Invalid content type: {content_type} from {request.META.get('REMOTE_ADDR')}")
                return JsonResponse(
                    {'error': 'Invalid content type. Use application/json or multipart/form-data'},
                    status=400
                )
        
        return None
    
    def process_response(self, request, response):
        # Add security headers
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        
        return response


class RateLimitMiddleware(MiddlewareMixin):
    """Simple rate limiting middleware."""
    
    # Endpoints exempt from rate limiting
    EXEMPT_PATHS = [
        '/api/users/all-users/',
        '/api/users/heartbeat/',
        '/api/auth/login/',
        '/api/auth/register/',
    ]
    
    def __init__(self, get_response):
        self.get_response = get_response
        self.request_counts = {}
        super().__init__(get_response)
    
    def process_request(self, request):
        # Skip rate limiting for exempt paths
        if any(request.path.startswith(path) for path in self.EXEMPT_PATHS):
            return None
        
        # Get client IP
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        
        # Get rate limit from settings (default 5000 requests per minute)
        try:
            from admin_panel.services.settings_service import SettingsService
            rate_limit = SettingsService.get_int('rate_limit_requests', 5000)
        except Exception:
            rate_limit = 5000
        
        current_time = int(time.time() / 60)
        key = f"{ip}:{current_time}"
        
        self.request_counts[key] = self.request_counts.get(key, 0) + 1
        
        if self.request_counts[key] > rate_limit:
            logger.warning(f"Rate limit exceeded for IP: {ip}")
            return JsonResponse(
                {'error': 'Rate limit exceeded'},
                status=429
            )
        
        # Clean up old entries
        if len(self.request_counts) > 10000:
            self.request_counts.clear()
        
        return None
