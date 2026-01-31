"""
Service for tracking user activity status and online presence.
"""
from datetime import timedelta
from django.utils import timezone
from django.db.models import Q
from users.models import User, UserActivity, UserSession


class UserActivityTracker:
    """Track and manage user activity status."""
    
    INACTIVE_THRESHOLD = timedelta(hours=24)  # User inactive after 24 hours
    
    @staticmethod
    def log_activity(user, action, description='', ip_address=None, user_agent=None):
        """Log user activity."""
        UserActivity.objects.create(
            user=user,
            action=action,
            description=description,
            ip_address=ip_address,
            user_agent=user_agent
        )
    
    @staticmethod
    def get_active_users():
        """Get all active users (is_active=True and status='active')."""
        return User.objects.filter(is_active=True, status='active')
    
    @staticmethod
    def get_inactive_users():
        """Get all inactive users (is_active=False or status != 'active')."""
        return User.objects.filter(Q(is_active=False) | ~Q(status='active'))
    
    @staticmethod
    def get_online_users():
        """Get users currently online."""
        return User.objects.filter(online_status='online')
    
    @staticmethod
    def get_offline_users():
        """Get users currently offline."""
        return User.objects.filter(online_status='offline')
    
    @staticmethod
    def get_recently_inactive_users(hours=24):
        """Get users inactive for specified hours."""
        threshold = timezone.now() - timedelta(hours=hours)
        return User.objects.filter(
            is_active=True,
            last_seen__lt=threshold,
            online_status='offline'
        )
    
    @staticmethod
    def get_user_activity_summary(user):
        """Get activity summary for a user."""
        return {
            'is_account_active': user.is_active and user.status == 'active',
            'is_online': user.online_status == 'online',
            'last_seen': user.last_seen,
            'join_date': user.join_date,
            'message_count': user.message_count,
            'report_count': user.report_count,
            'status': user.status,
            'online_status': user.online_status,
        }
    
    @staticmethod
    def get_activity_stats():
        """Get overall activity statistics."""
        total_users = User.objects.count()
        active_users = UserActivityTracker.get_active_users().count()
        inactive_users = UserActivityTracker.get_inactive_users().count()
        online_users = UserActivityTracker.get_online_users().count()
        offline_users = UserActivityTracker.get_offline_users().count()
        
        return {
            'total_users': total_users,
            'active_users': active_users,
            'inactive_users': inactive_users,
            'online_users': online_users,
            'offline_users': offline_users,
            'active_percentage': (active_users / total_users * 100) if total_users > 0 else 0,
            'online_percentage': (online_users / total_users * 100) if total_users > 0 else 0,
        }
    
    @staticmethod
    def deactivate_inactive_users(hours=24):
        """Deactivate users inactive for specified hours (optional auto-deactivation)."""
        inactive_users = UserActivityTracker.get_recently_inactive_users(hours)
        count = 0
        for user in inactive_users:
            user.is_active = False
            user.save(update_fields=['is_active'])
            UserActivityTracker.log_activity(
                user,
                'status_changed',
                f'Auto-deactivated due to inactivity for {hours} hours'
            )
            count += 1
        return count
