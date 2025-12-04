"""
Custom middleware for JWT token validation and security.
"""
import re
import json
import ipaddress
import traceback
import logging
import time
from urllib.parse import urlparse
from django.utils import timezone
from django.core.cache import cache
from django.conf import settings
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from .models import BlacklistedToken, IPAddress, IPAccessLog, SuspiciousActivity
from .utils import get_client_ip, log_security_event, get_error_context, sanitize_log_data


class BlacklistValidationMiddleware:
    """
    Middleware to validate JWT tokens against blacklist.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Only process requests with JWT tokens
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        
        if auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            
            # Check if token is blacklisted
            if BlacklistedToken.is_token_blacklisted(token):
                from rest_framework.response import Response
                from rest_framework import status
                return Response({
                    'detail': 'Token has been revoked'
                }, status=status.HTTP_401_UNAUTHORIZED)
        
        response = self.get_response(request)
        return response


class RateLimitMiddleware:
    """
    Advanced rate limiting middleware with abuse prevention.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        self.rate_limit_cache_key = 'rate_limit_{}'
        self.abuse_cache_key = 'abuse_{}'
        
        # Load configuration from Django settings
        from django.conf import settings
        
        # Rate limiting rules
        self.rate_limits = getattr(settings, 'RATE_LIMIT_CONFIG', {
            'auth': {'requests': 5, 'window': 300, 'block_duration': 900},
            'api': {'requests': 100, 'window': 3600, 'block_duration': 3600},
            'upload': {'requests': 10, 'window': 3600, 'block_duration': 1800},
            'general': {'requests': 200, 'window': 3600, 'block_duration': 1800},
        })
        
        # Abuse prevention settings
        abuse_config = getattr(settings, 'ABUSE_PREVENTION', {})
        self.suspicious_patterns = {
            'rapid_fire': {
                'threshold': abuse_config.get('rapid_fire_threshold', 50),
                'window': abuse_config.get('rapid_fire_window', 60)
            },
            'error_spike': {
                'threshold': abuse_config.get('error_spike_threshold', 20),
                'window': abuse_config.get('error_spike_window', 300)
            },
            'bot_user_agent': abuse_config.get('blacklisted_user_agents', [
                'bot', 'crawler', 'spider', 'scraper'
            ]),
        }
        
        # Configuration flags
        self.enable_bot_detection = abuse_config.get('enable_bot_detection', True)
        self.block_suspicious_ips = abuse_config.get('block_suspicious_ips', True)
        
        # IP whitelist
        self.ip_whitelist = getattr(settings, 'IP_WHITELIST', [])
        
        # Blacklisted user agents
        self.blacklisted_user_agents = getattr(settings, 'BLACKLISTED_USER_AGENTS', [])
        
    def __call__(self, request):
        client_ip = self.get_client_ip(request)
        
        # Skip rate limiting for certain paths
        if self.should_skip_rate_limiting(request):
            response = self.get_response(request)
            return response
        
        # Check if IP is already blocked
        if self.is_ip_blocked(client_ip):
            from rest_framework.response import Response
            from rest_framework import status
            return Response({
                'detail': 'IP address temporarily blocked due to abuse. Try again later.'
            }, status=status.HTTP_429_TOO_MANY_REQUESTS)
        
        # Determine rate limit category
        category = self.get_rate_limit_category(request)
        
        # Check rate limit
        if not self.check_rate_limit(client_ip, category):
            # Log abuse attempt
            self.log_abuse_attempt(client_ip, request, category, 'rate_limit_exceeded')
            
            # Block IP for abuse prevention
            self.block_ip_for_abuse(client_ip, category)
            
            from rest_framework.response import Response
            from rest_framework import status
            return Response({
                'detail': f'Rate limit exceeded for {category} endpoints. Try again later.',
                'category': category,
                'retry_after': self.rate_limits[category]['block_duration']
            }, status=status.HTTP_429_TOO_MANY_REQUESTS)
        
        # Check for suspicious behavior
        self.check_suspicious_behavior(client_ip, request)
        
        response = self.get_response(request)
        
        # Track successful requests
        self.track_successful_request(client_ip, category)
        
        # Track errors for abuse detection
        if response.status_code >= 400:
            self.track_error_request(client_ip, category)
        
        return response
    
    def should_skip_rate_limiting(self, request):
        """Skip rate limiting for certain paths and conditions."""
        client_ip = self.get_client_ip(request)
        
        # Check if IP is whitelisted
        if client_ip in self.ip_whitelist:
            return True
        
        skip_paths = [
            '/static/',
            '/media/',
            '/admin/jsi18n/',
            '/favicon.ico',
            '/robots.txt',
            '/health/',
        ]
        
        # Skip static files and admin endpoints
        if any(request.path.startswith(path) for path in skip_paths):
            return True
        
        # Skip OPTIONS requests (CORS preflight)
        if request.method == 'OPTIONS':
            return True
        
        return False
    
    def get_rate_limit_category(self, request):
        """Determine the rate limit category based on the request."""
        path = request.path.lower()
        
        # Authentication endpoints
        if any(auth_path in path for auth_path in ['/login', '/register', '/refresh', '/verify']):
            return 'auth'
        
        # File upload endpoints
        if any(upload_path in path for upload_path in ['/upload', '/avatar', '/attachment']):
            return 'upload'
        
        # API endpoints
        if path.startswith('/api/'):
            return 'api'
        
        # Default to general
        return 'general'
    
    def check_rate_limit(self, client_ip, category):
        """Check if the client has exceeded the rate limit."""
        cache_key = f"{self.rate_limit_cache_key.format(client_ip)}_{category}"
        current_requests = cache.get(cache_key, 0)
        
        limit_config = self.rate_limits[category]
        max_requests = limit_config['requests']
        window = limit_config['window']
        
        if current_requests >= max_requests:
            return False
        
        # Increment counter
        cache.set(cache_key, current_requests + 1, window)
        return True
    
    def is_ip_blocked(self, client_ip):
        """Check if IP is currently blocked for abuse."""
        block_key = f"{self.abuse_cache_key.format(client_ip)}_blocked"
        return cache.get(block_key) is not None
    
    def block_ip_for_abuse(self, client_ip, category):
        """Block IP address for abuse prevention."""
        if not self.block_suspicious_ips:
            return
            
        # Don't block whitelisted IPs
        if client_ip in self.ip_whitelist:
            return
            
        block_duration = self.rate_limits[category]['block_duration']
        block_key = f"{self.abuse_cache_key.format(client_ip)}_blocked"
        
        # Set block with expiration
        cache.set(block_key, True, block_duration)
        
        # Log the blocking action
        try:
            from users.models import SuspiciousActivity
            SuspiciousActivity.objects.create(
                ip_address=client_ip,
                activity_type='rapid_requests',
                description=f'IP blocked for rate limit abuse on {category} endpoints',
                severity='medium'
            )
        except Exception:
            pass
    
    def check_suspicious_behavior(self, client_ip, request):
        """Check for suspicious behavior patterns."""
        # Check for rapid fire requests
        self.check_rapid_fire_requests(client_ip)
        
        # Check for bot user agent
        self.check_bot_user_agent(client_ip, request)
        
        # Check for unusual request patterns
        self.check_unusual_patterns(client_ip, request)
    
    def check_rapid_fire_requests(self, client_ip):
        """Check for rapid fire request patterns."""
        # Don't check whitelisted IPs
        if client_ip in self.ip_whitelist:
            return
            
        rapid_key = f"{self.abuse_cache_key.format(client_ip)}_rapid"
        current_count = cache.get(rapid_key, 0)
        
        threshold = self.suspicious_patterns['rapid_fire']['threshold']
        window = self.suspicious_patterns['rapid_fire']['window']
        
        if current_count >= threshold:
            # Log suspicious activity
            try:
                from users.models import SuspiciousActivity
                SuspiciousActivity.objects.create(
                    ip_address=client_ip,
                    activity_type='rapid_requests',
                    description=f'Rapid fire requests detected: {current_count} in {window} seconds',
                    severity='high'
                )
            except Exception:
                pass
            
            # Block IP temporarily
            self.block_ip_for_abuse(client_ip, 'general')
            return
        
        # Increment counter
        cache.set(rapid_key, current_count + 1, window)
    
    def check_bot_user_agent(self, client_ip, request):
        """Check for bot user agents."""
        if not self.enable_bot_detection:
            return
            
        user_agent = request.META.get('HTTP_USER_AGENT', '').lower()
        
        if not user_agent:
            return
        
        # Check against both suspicious patterns and blacklisted user agents
        bot_patterns = self.suspicious_patterns['bot_user_agent']
        blacklisted_patterns = self.blacklisted_user_agents
        
        is_bot = any(pattern in user_agent for pattern in bot_patterns + blacklisted_patterns)
        
        if is_bot:
            # Log suspicious activity
            try:
                from users.models import SuspiciousActivity
                SuspiciousActivity.objects.create(
                    ip_address=client_ip,
                    activity_type='bot_activity',
                    description=f'Bot user agent detected: {user_agent[:100]}',
                    severity='medium'
                )
            except Exception:
                pass
    
    def check_unusual_patterns(self, client_ip, request):
        """Check for unusual request patterns."""
        # Check for common attack vectors in URL
        path = request.path.lower()
        suspicious_paths = ['wp-admin', 'phpmyadmin', 'admin', 'config', '.env']
        
        if any(suspicious in path for suspicious in suspicious_paths):
            try:
                from users.models import SuspiciousActivity
                SuspiciousActivity.objects.create(
                    ip_address=client_ip,
                    activity_type='unusual_location',
                    description=f'Suspicious path access: {path}',
                    severity='medium'
                )
            except Exception:
                pass
    
    def track_successful_request(self, client_ip, category):
        """Track successful requests for analytics."""
        # Could be used for analytics or gradual rate limit increases
        pass
    
    def track_error_request(self, client_ip, category):
        """Track error requests for abuse detection."""
        error_key = f"{self.abuse_cache_key.format(client_ip)}_errors"
        current_errors = cache.get(error_key, 0)
        
        threshold = self.suspicious_patterns['error_spike']['threshold']
        window = self.suspicious_patterns['error_spike']['window']
        
        if current_errors >= threshold:
            # Log suspicious activity
            try:
                from users.models import SuspiciousActivity
                SuspiciousActivity.objects.create(
                    ip_address=client_ip,
                    activity_type='rapid_requests',
                    description=f'High error rate detected: {current_errors} errors',
                    severity='medium'
                )
            except Exception:
                pass
        
        # Increment error counter
        cache.set(error_key, current_errors + 1, window)
    
    def log_abuse_attempt(self, client_ip, request, category, reason):
        """Log abuse attempt for security monitoring."""
        try:
            from users.models import SuspiciousActivity
            SuspiciousActivity.objects.create(
                ip_address=client_ip,
                activity_type='rapid_requests',
                description=f'Abuse attempt: {reason} on {category} endpoints',
                severity='medium',
                metadata={
                    'path': request.path,
                    'method': request.method,
                    'category': category,
                    'user_agent': request.META.get('HTTP_USER_AGENT', '')[:200]
                }
            )
        except Exception:
            pass
    
    def get_client_ip(self, request):
        """Get the client IP address."""
        return get_client_ip(request)


class ErrorHandlingMiddleware:
    """
    Comprehensive error handling and logging middleware.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        self.logger = logging.getLogger(__name__)
    
    def __call__(self, request):
        # Add request start time for performance tracking
        request._start_time = time.time()
        
        response = None
        exception = None
        
        try:
            response = self.get_response(request)
            
        except Exception as e:
            exception = e
            response = self.handle_exception(request, e)
        
        finally:
            # Log request completion
            self.log_request_completion(request, response, exception)
        
        return response
    
    def handle_exception(self, request, exception):
        """Handle exceptions and return appropriate response."""
        try:
            # Log the exception
            error_context = get_error_context(request, exception)
            self.logger.error(
                f"Unhandled exception: {str(exception)}",
                extra={'error_context': error_context},
                exc_info=True
            )
            
            # Log security event if it's a security-related exception
            if self.is_security_exception(exception):
                log_security_event(
                    request=request,
                    event_type='security_exception',
                    description=f"Security exception: {str(exception)}",
                    severity='ERROR',
                    extra_data={'exception_type': exception.__class__.__name__}
                )
            
            # Return appropriate error response
            from rest_framework.response import Response
            from rest_framework import status
            
            if hasattr(exception, 'status_code'):
                status_code = exception.status_code
            elif hasattr(exception, 'status'):
                status_code = exception.status
            else:
                status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
            
            # Create user-friendly error message
            if status_code >= 500:
                message = "Internal server error. Please try again later."
            elif status_code >= 400:
                message = str(exception)
            else:
                message = "An error occurred processing your request."
            
            error_response = {
                'error': True,
                'message': message,
                'timestamp': timezone.now().isoformat(),
                'exception_type': exception.__class__.__name__,
            }
            
            # Don't expose internal errors in production
            from django.conf import settings
            if not settings.DEBUG and status_code >= 500:
                error_response['message'] = "Internal server error. Please try again later."
            
            return Response(error_response, status=status_code)
            
        except Exception as logging_error:
            # Fallback error handling
            self.logger.error(f"Error in exception handling: {str(logging_error)}")
            from rest_framework.response import Response
            from rest_framework import status
            return Response({
                'error': True,
                'message': 'An unexpected error occurred.',
                'timestamp': timezone.now().isoformat(),
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def is_security_exception(self, exception):
        """Check if exception is security-related."""
        security_exceptions = [
            'PermissionDenied',
            'SecurityError',
            'SuspiciousOperation',
            'DisallowedHost',
            'DisallowedUserAgent',
        ]
        
        exception_name = exception.__class__.__name__
        return (exception_name in security_exceptions or 
                'security' in exception_name.lower() or
                'permission' in str(exception).lower())
    
    def log_request_completion(self, request, response, exception):
        """Log request completion with timing and error information."""
        try:
            # Calculate request duration
            duration = None
            if hasattr(request, '_start_time'):
                import time
                duration = time.time() - request._start_time
            
            # Prepare log data
            log_data = {
                'method': request.method,
                'path': request.path,
                'status_code': response.status_code if response else None,
                'duration': duration,
                'client_ip': get_client_ip(request),
                'user_agent': request.META.get('HTTP_USER_AGENT', ''),
                'user_id': request.user.id if request.user.is_authenticated else None,
            }
            
            # Add user info if authenticated
            if request.user.is_authenticated:
                log_data['username'] = request.user.username
            
            # Add exception info if there was an error
            if exception:
                log_data['exception'] = str(exception)
                log_data['exception_type'] = exception.__class__.__name__
            
            # Sanitize sensitive data
            log_data = sanitize_log_data(log_data)
            
            # Log at appropriate level
            if exception:
                self.logger.error(f"REQUEST ERROR: {json.dumps(log_data)}")
            elif response.status_code >= 500:
                self.logger.error(f"SERVER ERROR: {json.dumps(log_data)}")
            elif response.status_code >= 400:
                self.logger.warning(f"CLIENT ERROR: {json.dumps(log_data)}")
            else:
                self.logger.info(f"REQUEST: {json.dumps(log_data)}")
                
        except Exception as e:
            # Don't let logging errors break the request
            self.logger.error(f"Error logging request completion: {str(e)}")


class SecurityHeadersMiddleware:
    """
    Add security headers to all responses.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        
        # Add security headers
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        response['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=()'
        
        # Only add HSTS header in production
        from django.conf import settings
        if not settings.DEBUG:
            response['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        
        return response


class SessionManagementMiddleware:
    """
    Enhanced session management and security.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Handle session security
        self.handle_session_security(request)
        
        response = self.get_response(request)
        
        # Update session security
        self.update_session_security(request, response)
        
        return response
    
    def handle_session_security(self, request):
        """Handle session security checks."""
        if request.user.is_authenticated:
            session_key = request.session.session_key
            
            # Check for session fixation
            if not session_key:
                request.session.cycle_key()
            
            # Store additional security info
            request.session['last_activity'] = timezone.now().isoformat()
            request.session['ip_address'] = self.get_client_ip(request)
            request.session['user_agent'] = request.META.get('HTTP_USER_AGENT', '')
    
    def update_session_security(self, request, response):
        """Update session security settings."""
        if hasattr(request, 'session') and request.session.get('last_activity'):
            # Update last activity
            request.session['last_activity'] = timezone.now().isoformat()
            
            # Set secure cookie settings for production
            from django.conf import settings
            if not settings.DEBUG:
                response.set_cookie(
                    'sessionid',
                    request.session.session_key,
                    max_age=settings.SESSION_COOKIE_AGE,
                    secure=True,
                    httponly=True,
                    samesite='Lax'
                )
    
    def get_client_ip(self, request):
        """Get the client IP address."""
        return get_client_ip(request)


class ErrorHandlingMiddleware:
    """
    Comprehensive error handling and logging middleware.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        self.logger = logging.getLogger(__name__)
    
    def __call__(self, request):
        # Add request start time for performance tracking
        request._start_time = time.time()
        
        response = None
        exception = None
        
        try:
            response = self.get_response(request)
            
        except Exception as e:
            exception = e
            response = self.handle_exception(request, e)
        
        finally:
            # Log request completion
            self.log_request_completion(request, response, exception)
        
        return response
    
    def handle_exception(self, request, exception):
        """Handle exceptions and return appropriate response."""
        try:
            # Log the exception
            error_context = get_error_context(request, exception)
            self.logger.error(
                f"Unhandled exception: {str(exception)}",
                extra={'error_context': error_context},
                exc_info=True
            )
            
            # Log security event if it's a security-related exception
            if self.is_security_exception(exception):
                log_security_event(
                    request=request,
                    event_type='security_exception',
                    description=f"Security exception: {str(exception)}",
                    severity='ERROR',
                    extra_data={'exception_type': exception.__class__.__name__}
                )
            
            # Return appropriate error response
            from rest_framework.response import Response
            from rest_framework import status
            
            if hasattr(exception, 'status_code'):
                status_code = exception.status_code
            elif hasattr(exception, 'status'):
                status_code = exception.status
            else:
                status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
            
            # Create user-friendly error message
            if status_code >= 500:
                message = "Internal server error. Please try again later."
            elif status_code >= 400:
                message = str(exception)
            else:
                message = "An error occurred processing your request."
            
            error_response = {
                'error': True,
                'message': message,
                'timestamp': timezone.now().isoformat(),
                'exception_type': exception.__class__.__name__,
            }
            
            # Don't expose internal errors in production
            from django.conf import settings
            if not settings.DEBUG and status_code >= 500:
                error_response['message'] = "Internal server error. Please try again later."
            
            return Response(error_response, status=status_code)
            
        except Exception as logging_error:
            # Fallback error handling
            self.logger.error(f"Error in exception handling: {str(logging_error)}")
            from rest_framework.response import Response
            from rest_framework import status
            return Response({
                'error': True,
                'message': 'An unexpected error occurred.',
                'timestamp': timezone.now().isoformat(),
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def is_security_exception(self, exception):
        """Check if exception is security-related."""
        security_exceptions = [
            'PermissionDenied',
            'SecurityError',
            'SuspiciousOperation',
            'DisallowedHost',
            'DisallowedUserAgent',
        ]
        
        exception_name = exception.__class__.__name__
        return (exception_name in security_exceptions or 
                'security' in exception_name.lower() or
                'permission' in str(exception).lower())
    
    def log_request_completion(self, request, response, exception):
        """Log request completion with timing and error information."""
        try:
            # Calculate request duration
            duration = None
            if hasattr(request, '_start_time'):
                import time
                duration = time.time() - request._start_time
            
            # Prepare log data
            log_data = {
                'method': request.method,
                'path': request.path,
                'status_code': response.status_code if response else None,
                'duration': duration,
                'client_ip': get_client_ip(request),
                'user_agent': request.META.get('HTTP_USER_AGENT', ''),
                'user_id': request.user.id if request.user.is_authenticated else None,
            }
            
            # Add user info if authenticated
            if request.user.is_authenticated:
                log_data['username'] = request.user.username
            
            # Add exception info if there was an error
            if exception:
                log_data['exception'] = str(exception)
                log_data['exception_type'] = exception.__class__.__name__
            
            # Sanitize sensitive data
            log_data = sanitize_log_data(log_data)
            
            # Log at appropriate level
            if exception:
                self.logger.error(f"REQUEST ERROR: {json.dumps(log_data)}")
            elif response.status_code >= 500:
                self.logger.error(f"SERVER ERROR: {json.dumps(log_data)}")
            elif response.status_code >= 400:
                self.logger.warning(f"CLIENT ERROR: {json.dumps(log_data)}")
            else:
                self.logger.info(f"REQUEST: {json.dumps(log_data)}")
                
        except Exception as e:
            # Don't let logging errors break the request
            self.logger.error(f"Error logging request completion: {str(e)}")


class IPTrackingMiddleware:
    """
    Comprehensive IP tracking middleware for security and analytics.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        
        # Suspicious patterns to detect
        self.sql_injection_patterns = [
            r'(\bunion\b.*\bselect\b)',
            r'(\bor\b\s+\d+\s*=\s*\d+)',
            r'(\bdrop\s+table\b)',
            r'(\binsert\s+into\b)',
            r'(\bupdate\b.*\bset\b)',
            r'(\bdelete\s+from\b)',
        ]
        
        self.xss_patterns = [
            r'<script[^>]*>.*?</script>',
            r'javascript:',
            r'on\w+\s*=',
            r'<iframe[^>]*>.*?</iframe>',
        ]
        
        self.path_traversal_patterns = [
            r'\.\./',
            r'\.\.\\',
            r'%2e%2e%2f',
            r'%2e%2e%5c',
        ]
    
    def __call__(self, request):
        import time
        start_time = time.time()
        
        # Get client IP and check if blocked
        client_ip = self.get_client_ip(request)
        
        # Skip IP tracking for static files and health checks
        if self.should_skip_tracking(request):
            response = self.get_response(request)
            return response
        
        # Check if IP is blocked
        if self.is_ip_blocked(client_ip):
            from rest_framework.response import Response
            from rest_framework import status
            return Response({
                'detail': 'Access denied. Your IP address has been blocked.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Track IP access
        response = self.get_response(request)
        
        # Calculate response time
        response_time = time.time() - start_time
        
        # Log access and check for suspicious activity
        self.log_ip_access(request, response, client_ip, response_time)
        self.check_suspicious_activity(request, response, client_ip)
        
        return response
    
    def should_skip_tracking(self, request):
        """Skip IP tracking for certain paths."""
        skip_paths = [
            '/static/',
            '/media/',
            '/admin/jsi18n/',
            '/favicon.ico',
            '/robots.txt',
            '/health/',
        ]
        
        return any(request.path.startswith(path) for path in skip_paths)
    
    def get_client_ip(self, request):
        """Get the real client IP address considering proxies."""
        # Check various headers for the real IP
        headers_to_check = [
            'HTTP_X_FORWARDED_FOR',
            'HTTP_X_REAL_IP',
            'HTTP_CLIENT_IP',
            'REMOTE_ADDR'
        ]
        
        for header in headers_to_check:
            ip_header = request.META.get(header)
            if ip_header:
                # X-Forwarded-For can contain multiple IPs
                if ',' in ip_header:
                    ip_header = ip_header.split(',')[0].strip()
                
                try:
                    # Validate IP address
                    ipaddress.ip_address(ip_header)
                    return ip_header
                except ValueError:
                    continue
        
        return request.META.get('REMOTE_ADDR', '127.0.0.1')
    
    def is_ip_blocked(self, ip_address):
        """Check if IP address is blocked."""
        try:
            ip_obj, created = IPAddress.objects.get_or_create(ip_address=ip_address)
            return ip_obj.is_blocked()
        except Exception:
            return False
    
    def log_ip_access(self, request, response, client_ip, response_time):
        """Log IP access attempt."""
        import threading
        
        def log_access():
            try:
                # Get or create IP address record
                ip_obj, created = IPAddress.objects.get_or_create(
                    ip_address=client_ip
                )
                
                # Increment request count
                ip_obj.increment_request_count()
                
                # Log access
                IPAccessLog.objects.create(
                    ip_address=client_ip,
                    method=request.method,
                    path=request.path[:500],  # Truncate long paths
                    user_agent=request.META.get('HTTP_USER_AGENT', '')[:1000],
                    user=request.user if request.user.is_authenticated else None,
                    status_code=response.status_code,
                    response_time=response_time,
                    is_suspicious=response.status_code >= 400,
                )
                
                # Update IP geolocation (basic implementation)
                if not ip_obj.country:
                    self.update_ip_geolocation(ip_obj)
                    
            except Exception as e:
                # Log error but don't break the request
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Error logging IP access: {e}")
        
        # Log in background thread
        thread = threading.Thread(target=log_access)
        thread.daemon = True
        thread.start()
    
    def check_suspicious_activity(self, request, response, client_ip):
        """Check for suspicious activity patterns."""
        try:
            # Check for SQL injection
            if self.detect_sql_injection(request):
                self.create_suspicious_activity(
                    client_ip, 
                    'sql_injection',
                    'SQL injection attempt detected',
                    'high',
                    {'path': request.path, 'query': request.META.get('QUERY_STRING', '')}
                )
            
            # Check for XSS attempts
            if self.detect_xss_attempt(request):
                self.create_suspicious_activity(
                    client_ip,
                    'xss_attempt',
                    'XSS attempt detected',
                    'high',
                    {'path': request.path, 'data': str(request.POST)[:500]}
                )
            
            # Check for path traversal
            if self.detect_path_traversal(request):
                self.create_suspicious_activity(
                    client_ip,
                    'path_traversal',
                    'Path traversal attempt detected',
                    'medium',
                    {'path': request.path}
                )
            
            # Check for rapid requests
            self.check_rapid_requests(client_ip)
            
            # Check for failed login attempts
            if response.status_code == 401 and '/login' in request.path:
                self.check_failed_logins(client_ip)
                
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error checking suspicious activity: {e}")
    
    def detect_sql_injection(self, request):
        """Detect SQL injection patterns in request."""
        # Check query parameters, POST data, and path
        data_to_check = [
            request.META.get('QUERY_STRING', ''),
            str(request.POST),
            request.path.lower(),
        ]
        
        for data in data_to_check:
            for pattern in self.sql_injection_patterns:
                if re.search(pattern, data, re.IGNORECASE):
                    return True
        return False
    
    def detect_xss_attempt(self, request):
        """Detect XSS attempt patterns."""
        data_to_check = [
            str(request.GET),
            str(request.POST),
            request.path.lower(),
        ]
        
        for data in data_to_check:
            for pattern in self.xss_patterns:
                if re.search(pattern, data, re.IGNORECASE):
                    return True
        return False
    
    def detect_path_traversal(self, request):
        """Detect path traversal attempts."""
        data_to_check = [
            request.path.lower(),
            request.META.get('QUERY_STRING', ''),
        ]
        
        for data in data_to_check:
            for pattern in self.path_traversal_patterns:
                if re.search(pattern, data, re.IGNORECASE):
                    return True
        return False
    
    def check_rapid_requests(self, client_ip):
        """Check for rapid request patterns."""
        cache_key = f'rapid_requests_{client_ip}'
        current_count = cache.get(cache_key, 0)
        
        if current_count >= 50:  # More than 50 requests in short time
            self.create_suspicious_activity(
                client_ip,
                'rapid_requests',
                'Rapid requests detected',
                'medium',
                {'request_count': current_count}
            )
        
        # Increment counter
        cache.set(cache_key, current_count + 1, 300)  # 5 minutes window
    
    def check_failed_logins(self, client_ip):
        """Check for failed login attempts."""
        cache_key = f'failed_logins_{client_ip}'
        current_count = cache.get(cache_key, 0)
        
        if current_count >= 5:  # More than 5 failed logins
            self.create_suspicious_activity(
                client_ip,
                'failed_logins',
                'Multiple failed login attempts',
                'high',
                {'failed_attempts': current_count}
            )
            
            # Block IP temporarily
            self.block_ip(client_ip, duration_minutes=60)
        
        # Increment counter
        cache.set(cache_key, current_count + 1, 900)  # 15 minutes window
    
    def create_suspicious_activity(self, ip_address, activity_type, description, severity, metadata):
        """Create suspicious activity record."""
        SuspiciousActivity.objects.create(
            ip_address=ip_address,
            activity_type=activity_type,
            description=description,
            severity=severity,
            metadata=metadata
        )
        
        # Auto-block high severity threats
        if severity == 'critical':
            self.block_ip(ip_address, duration_minutes=1440)  # 24 hours
        elif severity == 'high':
            self.block_ip(ip_address, duration_minutes=120)  # 2 hours
    
    def block_ip(self, ip_address, duration_minutes=60):
        """Block IP address for specified duration."""
        try:
            ip_obj, created = IPAddress.objects.get_or_create(ip_address=ip_address)
            ip_obj.blocked_until = timezone.now() + timezone.timedelta(minutes=duration_minutes)
            ip_obj.save(update_fields=['blocked_until'])
        except Exception:
            pass
    
    def update_ip_geolocation(self, ip_obj):
        """Update IP geolocation information (basic implementation)."""
        # This is a simplified implementation
        # In production, you would use a service like MaxMind GeoIP2
        try:
            ip = ipaddress.ip_address(ip_obj.ip_address)
            
            if ip.is_private:
                ip_obj.country = 'Private'
                ip_obj.city = 'Local Network'
            elif ip.is_loopback:
                ip_obj.country = 'Local'
                ip_obj.city = 'Loopback'
            else:
                ip_obj.country = 'Unknown'
                ip_obj.city = 'Unknown'
            
            ip_obj.save(update_fields=['country', 'city'])
        except Exception:
            pass


class ActivityTrackingMiddleware:
    """
    Track user activity and sessions.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        response = self.get_response(request)
        
        # Track authenticated user activity
        if request.user.is_authenticated:
            self.track_user_activity(request, response)
        
        return response
    
    def track_user_activity(self, request, response):
        """Track user activity."""
        from users.models import UserActivity
        import threading
        
        # Log activity in background thread
        def log_activity():
            try:
                UserActivity.objects.create(
                    user=request.user,
                    action='http_request',
                    description=f'{request.method} {request.path}',
                    ip_address=self.get_client_ip(request),
                    user_agent=request.META.get('HTTP_USER_AGENT', ''),
                    metadata={
                        'method': request.method,
                        'path': request.path,
                        'status_code': getattr(response, 'status_code', None),
                    }
                )
            except Exception:
                pass  # Don't let logging errors break the request
        
        # Start background thread for logging
        thread = threading.Thread(target=log_activity)
        thread.daemon = True
        thread.start()
    
    def get_client_ip(self, request):
        """Get the client IP address."""
        return get_client_ip(request)


class ErrorHandlingMiddleware:
    """
    Comprehensive error handling and logging middleware.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        self.logger = logging.getLogger(__name__)
    
    def __call__(self, request):
        # Add request start time for performance tracking
        request._start_time = time.time()
        
        response = None
        exception = None
        
        try:
            response = self.get_response(request)
            
        except Exception as e:
            exception = e
            response = self.handle_exception(request, e)
        
        finally:
            # Log request completion
            self.log_request_completion(request, response, exception)
        
        return response
    
    def handle_exception(self, request, exception):
        """Handle exceptions and return appropriate response."""
        try:
            # Log the exception
            error_context = get_error_context(request, exception)
            self.logger.error(
                f"Unhandled exception: {str(exception)}",
                extra={'error_context': error_context},
                exc_info=True
            )
            
            # Log security event if it's a security-related exception
            if self.is_security_exception(exception):
                log_security_event(
                    request=request,
                    event_type='security_exception',
                    description=f"Security exception: {str(exception)}",
                    severity='ERROR',
                    extra_data={'exception_type': exception.__class__.__name__}
                )
            
            # Return appropriate error response
            from rest_framework.response import Response
            from rest_framework import status
            
            if hasattr(exception, 'status_code'):
                status_code = exception.status_code
            elif hasattr(exception, 'status'):
                status_code = exception.status
            else:
                status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
            
            # Create user-friendly error message
            if status_code >= 500:
                message = "Internal server error. Please try again later."
            elif status_code >= 400:
                message = str(exception)
            else:
                message = "An error occurred processing your request."
            
            error_response = {
                'error': True,
                'message': message,
                'timestamp': timezone.now().isoformat(),
                'exception_type': exception.__class__.__name__,
            }
            
            # Don't expose internal errors in production
            from django.conf import settings
            if not settings.DEBUG and status_code >= 500:
                error_response['message'] = "Internal server error. Please try again later."
            
            return Response(error_response, status=status_code)
            
        except Exception as logging_error:
            # Fallback error handling
            self.logger.error(f"Error in exception handling: {str(logging_error)}")
            from rest_framework.response import Response
            from rest_framework import status
            return Response({
                'error': True,
                'message': 'An unexpected error occurred.',
                'timestamp': timezone.now().isoformat(),
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def is_security_exception(self, exception):
        """Check if exception is security-related."""
        security_exceptions = [
            'PermissionDenied',
            'SecurityError',
            'SuspiciousOperation',
            'DisallowedHost',
            'DisallowedUserAgent',
        ]
        
        exception_name = exception.__class__.__name__
        return (exception_name in security_exceptions or 
                'security' in exception_name.lower() or
                'permission' in str(exception).lower())
    
    def log_request_completion(self, request, response, exception):
        """Log request completion with timing and error information."""
        try:
            # Calculate request duration
            duration = None
            if hasattr(request, '_start_time'):
                import time
                duration = time.time() - request._start_time
            
            # Prepare log data
            log_data = {
                'method': request.method,
                'path': request.path,
                'status_code': response.status_code if response else None,
                'duration': duration,
                'client_ip': get_client_ip(request),
                'user_agent': request.META.get('HTTP_USER_AGENT', ''),
                'user_id': request.user.id if request.user.is_authenticated else None,
            }
            
            # Add user info if authenticated
            if request.user.is_authenticated:
                log_data['username'] = request.user.username
            
            # Add exception info if there was an error
            if exception:
                log_data['exception'] = str(exception)
                log_data['exception_type'] = exception.__class__.__name__
            
            # Sanitize sensitive data
            log_data = sanitize_log_data(log_data)
            
            # Log at appropriate level
            if exception:
                self.logger.error(f"REQUEST ERROR: {json.dumps(log_data)}")
            elif response.status_code >= 500:
                self.logger.error(f"SERVER ERROR: {json.dumps(log_data)}")
            elif response.status_code >= 400:
                self.logger.warning(f"CLIENT ERROR: {json.dumps(log_data)}")
            else:
                self.logger.info(f"REQUEST: {json.dumps(log_data)}")
                
        except Exception as e:
            # Don't let logging errors break the request
            self.logger.error(f"Error logging request completion: {str(e)}")