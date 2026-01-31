"""
Utility functions for users app.
"""
import logging
import traceback
import json
from datetime import datetime
from django.http import JsonResponse
from django.conf import settings
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler

# Configure logger
logger = logging.getLogger(__name__)


def get_client_ip(request):
    """
    Get the real client IP address considering proxies.
    
    Args:
        request: Django request object
        
    Returns:
        str: Client IP address
    """
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
            
            # Basic IP validation (could be enhanced with proper IP address validation)
            if ip_header and len(ip_header.split('.')) == 4:
                return ip_header
    
    return request.META.get('REMOTE_ADDR', '127.0.0.1')


def log_security_event(request, event_type, description, severity='INFO', user=None, extra_data=None):
    """
    Log security-related events.
    
    Args:
        request: Django request object
        event_type: Type of security event
        description: Event description
        severity: Log severity level
        user: User object (optional)
        extra_data: Additional data to log (optional)
    """
    try:
        client_ip = get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        
        log_data = {
            'event_type': event_type,
            'description': description,
            'client_ip': client_ip,
            'user_agent': user_agent,
            'path': request.path,
            'method': request.method,
            'timestamp': datetime.now().isoformat(),
            'user_id': user.id if user and hasattr(user, 'id') else None,
            'username': user.username if user and hasattr(user, 'username') else None,
            'extra_data': extra_data or {}
        }
        
        # Log at appropriate level
        if severity == 'CRITICAL':
            logger.critical(f"SECURITY EVENT: {json.dumps(log_data)}")
        elif severity == 'ERROR':
            logger.error(f"SECURITY EVENT: {json.dumps(log_data)}")
        elif severity == 'WARNING':
            logger.warning(f"SECURITY EVENT: {json.dumps(log_data)}")
        else:
            logger.info(f"SECURITY EVENT: {json.dumps(log_data)}")
            
        # Also log to database if available
        try:
            from users.models import SuspiciousActivity
            SuspiciousActivity.objects.create(
                ip_address=client_ip,
                user=user,
                activity_type=event_type,
                description=description,
                severity=severity.lower() if severity.lower() in ['low', 'medium', 'high', 'critical'] else 'medium',
                metadata=extra_data or {}
            )
        except Exception:
            # Don't let database logging errors break the function
            pass
            
    except Exception as e:
        # Fallback logging if something goes wrong
        logger.error(f"Error logging security event: {str(e)}")


def log_user_action(user, action, description, request=None, extra_data=None):
    """
    Log user actions for audit trail.
    
    Args:
        user: User object
        action: Action performed
        description: Action description
        request: Django request object (optional)
        extra_data: Additional data to log (optional)
    """
    try:
        log_data = {
            'action': action,
            'description': description,
            'user_id': user.id,
            'username': user.username,
            'timestamp': datetime.now().isoformat(),
            'extra_data': extra_data or {}
        }
        
        if request:
            log_data.update({
                'client_ip': get_client_ip(request),
                'user_agent': request.META.get('HTTP_USER_AGENT', ''),
                'path': request.path,
                'method': request.method,
            })
        
        logger.info(f"USER ACTION: {json.dumps(log_data)}")
        
        # Log to database
        try:
            from users.models import UserActivity
            UserActivity.objects.create(
                user=user,
                action=action,
                description=description,
                ip_address=get_client_ip(request) if request else None,
                user_agent=request.META.get('HTTP_USER_AGENT', '') if request else '',
                metadata=extra_data or {}
            )
        except Exception:
            # Don't let database logging errors break the function
            pass
            
    except Exception as e:
        logger.error(f"Error logging user action: {str(e)}")


def handle_api_exception(exc, context):
    """
    Custom exception handler for API responses.
    
    Args:
        exc: Exception instance
        context: Exception context
        
    Returns:
        Response: Formatted error response
    """
    # Call REST framework's default exception handler
    response = exception_handler(exc, context)
    
    if response is not None:
        # Get request object
        request = context.get('request')
        
        # Log the error
        if request:
            client_ip = get_client_ip(request)
            user_agent = request.META.get('HTTP_USER_AGENT', '')
            
            error_data = {
                'error_type': exc.__class__.__name__,
                'error_message': str(exc),
                'status_code': response.status_code,
                'client_ip': client_ip,
                'user_agent': user_agent,
                'path': request.path,
                'method': request.method,
                'timestamp': datetime.now().isoformat(),
            }
            
            # Log at appropriate level based on status code
            if response.status_code >= 500:
                logger.error(f"API ERROR: {json.dumps(error_data)}")
            elif response.status_code >= 400:
                logger.warning(f"API ERROR: {json.dumps(error_data)}")
            else:
                logger.info(f"API ERROR: {json.dumps(error_data)}")
        
        # Add additional error information
        response.data.update({
            'error_type': exc.__class__.__name__,
            'timestamp': datetime.now().isoformat(),
        })
    
    return response


def create_error_response(message, status_code=400, error_code=None, details=None):
    """
    Create a standardized error response.
    
    Args:
        message: Error message
        status_code: HTTP status code
        error_code: Optional error code
        details: Optional error details
        
    Returns:
        Response: Formatted error response
    """
    error_data = {
        'error': True,
        'message': message,
        'timestamp': datetime.now().isoformat(),
    }
    
    if error_code:
        error_data['error_code'] = error_code
    
    if details:
        error_data['details'] = details
    
    return Response(error_data, status=status_code)


def sanitize_log_data(data):
    """
    Sanitize sensitive data from log entries.
    
    Args:
        data: Data to sanitize
        
    Returns:
        dict: Sanitized data
    """
    if not isinstance(data, dict):
        return data
    
    # Fields to remove or mask
    sensitive_fields = [
        'password', 'token', 'secret', 'key', 'auth',
        'credit_card', 'ssn', 'email'
    ]
    
    sanitized = {}
    
    for key, value in data.items():
        key_lower = key.lower()
        
        # Remove sensitive fields
        if any(field in key_lower for field in sensitive_fields):
            sanitized[key] = '[REDACTED]'
        elif isinstance(value, dict):
            sanitized[key] = sanitize_log_data(value)
        elif isinstance(value, list):
            sanitized[key] = [sanitize_log_data(item) if isinstance(item, dict) else item for item in value]
        else:
            sanitized[key] = value
    
    return sanitized


def get_error_context(request, exception=None):
    """
    Get context information for error logging.
    
    Args:
        request: Django request object
        exception: Exception instance (optional)
        
    Returns:
        dict: Error context information
    """
    context = {
        'timestamp': datetime.now().isoformat(),
        'path': request.path,
        'method': request.method,
        'client_ip': get_client_ip(request),
        'user_agent': request.META.get('HTTP_USER_AGENT', ''),
        'user_id': request.user.id if request.user.is_authenticated else None,
        'username': request.user.username if request.user.is_authenticated else None,
    }
    
    if exception:
        context.update({
            'exception_type': exception.__class__.__name__,
            'exception_message': str(exception),
            'traceback': traceback.format_exc(),
        })
    
    # Add request data (sanitized)
    if hasattr(request, 'POST') and request.POST:
        context['post_data'] = sanitize_log_data(dict(request.POST))
    
    if hasattr(request, 'GET') and request.GET:
        context['get_data'] = sanitize_log_data(dict(request.GET))
    
    return context


def rate_limit_response(request, category=None, retry_after=None):
    """
    Create a rate limit response.
    
    Args:
        request: Django request object
        category: Rate limit category
        retry_after: Seconds to wait before retrying
        
    Returns:
        Response: Rate limit response
    """
    client_ip = get_client_ip(request)
    
    log_security_event(
        request=request,
        event_type='rate_limit_exceeded',
        description=f'Rate limit exceeded for {category or "unknown"} category',
        severity='WARNING',
        extra_data={
            'category': category,
            'retry_after': retry_after,
        }
    )
    
    response_data = {
        'error': True,
        'message': 'Rate limit exceeded. Please try again later.',
        'rate_limited': True,
        'category': category,
        'retry_after': retry_after or 60,
        'timestamp': datetime.now().isoformat(),
    }
    
    response = Response(response_data, status=status.HTTP_429_TOO_MANY_REQUESTS)
    response['Retry-After'] = str(retry_after or 60)
    
    return response