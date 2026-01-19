"""
Middleware to track user online status on each request.
"""
from django.utils.deprecation import MiddlewareMixin
from users.services.simple_online_status import update_user_last_seen


class UserPresenceMiddleware(MiddlewareMixin):
    """Update user online status on each request."""
    
    def process_request(self, request):
        if request.user.is_authenticated:
            # Only update if account is active
            if request.user.is_active and request.user.status not in ['inactive', 'suspended', 'banned']:
                update_user_last_seen(request.user.id)
        return None
