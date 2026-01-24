"""
Admin Activity Notification Service
Sends notifications to admins for all system activities
"""
from users.notification_utils import send_notification
from users.models import User
from utils.json_utils import prepare_metadata
import logging

logger = logging.getLogger(__name__)


class AdminActivityNotifier:
    """Service to notify admins about system activities"""
    
    # Activity type to notification mapping
    ACTIVITY_NOTIFICATIONS = {
        # User activities
        'USER_LOGIN': {
            'type': 'system',
            'title': 'User Login',
            'message': '{username} logged in',
            'priority': 'low'
        },
        'USER_LOGOUT': {
            'type': 'system',
            'title': 'User Logout',
            'message': '{username} logged out',
            'priority': 'low'
        },
        'USER_CREATED': {
            'type': 'system',
            'title': 'New User Created',
            'message': 'New user {username} created',
            'priority': 'medium'
        },
        'USER_APPROVED': {
            'type': 'system',
            'title': 'User Approved',
            'message': 'User {username} has been approved',
            'priority': 'medium'
        },
        'USER_SUSPENDED': {
            'type': 'system',
            'title': 'User Suspended',
            'message': 'User {username} has been suspended',
            'priority': 'high'
        },
        'USER_BANNED': {
            'type': 'system',
            'title': 'User Banned',
            'message': 'User {username} has been banned',
            'priority': 'high'
        },
        
        # Chat activities
        'MESSAGE_SENT': {
            'type': 'message',
            'title': 'New Message',
            'message': '{username} sent a message in {conversation}',
            'priority': 'low'
        },
        'MESSAGE_DELETED': {
            'type': 'message',
            'title': 'Message Deleted',
            'message': 'Message deleted in {conversation}',
            'priority': 'medium'
        },
        'CONVERSATION_CREATED': {
            'type': 'system',
            'title': 'Conversation Created',
            'message': 'New conversation created: {conversation}',
            'priority': 'low'
        },
        'GROUP_CREATED': {
            'type': 'system',
            'title': 'Group Created',
            'message': 'New group created: {group_name}',
            'priority': 'medium'
        },
        'GROUP_JOINED': {
            'type': 'system',
            'title': 'Group Joined',
            'message': '{username} joined group {group_name}',
            'priority': 'low'
        },
        'MEMBER_ADDED': {
            'type': 'system',
            'title': 'Member Added',
            'message': '{username} added to {group_name}',
            'priority': 'low'
        },
        
        # Security activities
        'USER_FAILED_LOGIN': {
            'type': 'warning',
            'title': 'Failed Login Attempt',
            'message': 'Failed login attempt for {username}',
            'priority': 'high'
        },
        'SUSPICIOUS_ACTIVITY': {
            'type': 'warning',
            'title': 'Suspicious Activity Detected',
            'message': 'Suspicious activity detected from {ip_address}',
            'priority': 'high'
        },
        'RATE_LIMIT_EXCEEDED': {
            'type': 'warning',
            'title': 'Rate Limit Exceeded',
            'message': 'Rate limit exceeded from {ip_address}',
            'priority': 'medium'
        },
        
        # Admin actions
        'FORCE_LOGOUT': {
            'type': 'system',
            'title': 'Force Logout',
            'message': 'User {username} force logged out',
            'priority': 'high'
        },
        'ROLE_CHANGED': {
            'type': 'system',
            'title': 'Role Changed',
            'message': 'User {username} role changed to {new_role}',
            'priority': 'medium'
        },
        'SYSTEM_SETTINGS_CHANGED': {
            'type': 'system',
            'title': 'System Settings Changed',
            'message': 'System settings updated',
            'priority': 'medium'
        },
    }
    
    @classmethod
    def notify_admins(cls, activity_type, actor=None, target_type=None, 
                     target_id=None, metadata=None, severity=None):
        """
        Send notification to all admins about an activity (synchronous)
        
        Args:
            activity_type: Type of activity (e.g., 'USER_LOGIN')
            actor: User who performed the action
            target_type: Type of target (USER, MESSAGE, etc.)
            target_id: ID of the target
            metadata: Additional data for the notification
            severity: Severity level of the activity
        """
        try:
            # Get notification config
            config = cls.ACTIVITY_NOTIFICATIONS.get(activity_type)
            if not config:
                return
            
            # Build notification message
            message_data = metadata or {}
            if actor:
                message_data['username'] = actor.username
            
            try:
                title = config['title']
                message = config['message'].format(**message_data)
            except (KeyError, ValueError) as e:
                logger.warning(f"Failed to format notification message for {activity_type}: {str(e)}")
                return
            
            # Get all admin users
            admins = User.objects.filter(role='admin', is_active=True).only('id', 'username')
            
            if not admins.exists():
                return
            
            # Send notifications synchronously (no Celery/Redis needed)
            for admin in admins:
                try:
                    send_notification(
                        user=admin,
                        notification_type=config['type'],
                        title=title,
                        message=message,
                        data=prepare_metadata({
                            'activity_type': activity_type,
                            'actor_id': actor.id if actor else None,
                            'target_type': target_type,
                            'target_id': target_id,
                            'severity': severity,
                            'metadata': metadata or {}
                        })
                    )
                except Exception as e:
                    logger.error(f"Failed to notify admin {admin.id}: {str(e)}", exc_info=False)
        
        except Exception as e:
            logger.error(f"Error in notify_admins: {str(e)}", exc_info=False)
    
    @classmethod
    def notify_on_user_activity(cls, user, activity_type, metadata=None):
        """Notify admins about user activities"""
        if not user:
            return
        cls.notify_admins(
            activity_type=activity_type,
            actor=user,
            target_type='USER',
            target_id=user.id,
            metadata=metadata or {'username': user.username}
        )
    
    @classmethod
    def notify_on_message_activity(cls, message, activity_type, actor=None):
        """Notify admins about message activities"""
        if not message or not hasattr(message, 'conversation'):
            return
        try:
            conversation_name = str(message.conversation)
            sender = actor or message.sender
            if not sender:
                return
            cls.notify_admins(
                activity_type=activity_type,
                actor=sender,
                target_type='MESSAGE',
                target_id=message.id,
                metadata={
                    'username': sender.username,
                    'conversation': conversation_name
                }
            )
        except AttributeError as e:
            logger.warning(f"Missing required message attributes: {str(e)}")
    
    @classmethod
    def notify_on_group_activity(cls, group, activity_type, actor=None, metadata=None):
        """Notify admins about group activities"""
        if not group or not hasattr(group, 'name'):
            return
        try:
            data = metadata or {}
            data['group_name'] = group.name
            if actor:
                data['username'] = actor.username
            
            creator = actor or getattr(group, 'created_by', None)
            if not creator:
                return
            
            cls.notify_admins(
                activity_type=activity_type,
                actor=creator,
                target_type='GROUP',
                target_id=group.id,
                metadata=data
            )
        except AttributeError as e:
            logger.warning(f"Missing required group attributes: {str(e)}")
    
    @classmethod
    def notify_on_security_event(cls, activity_type, ip_address=None, 
                                user=None, metadata=None):
        """Notify admins about security events"""
        data = metadata or {}
        if ip_address:
            data['ip_address'] = str(ip_address)
        
        cls.notify_admins(
            activity_type=activity_type,
            actor=user,
            target_type='SYSTEM',
            metadata=data,
            severity='high'
        )
