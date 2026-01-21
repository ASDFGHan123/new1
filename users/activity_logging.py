"""
Activity Logging and Admin Notification Utilities
"""
from admin_panel.models import AuditLog
from users.admin_activity_notifier import AdminActivityNotifier
import logging

logger = logging.getLogger(__name__)


def log_and_notify_activity(
    action_type,
    description,
    actor=None,
    target_type=None,
    target_id=None,
    severity=AuditLog.SeverityLevel.INFO,
    category=None,
    ip_address=None,
    user_agent=None,
    session_id=None,
    metadata=None,
    notify_admins=True
):
    """
    Log an activity and optionally notify admins
    
    Args:
        action_type: Type of action (from AuditLog.ActionType)
        description: Description of the action
        actor: User who performed the action
        target_type: Type of target (from AuditLog.TargetType)
        target_id: ID of the target
        severity: Severity level
        category: Category of the action
        ip_address: IP address of the actor
        user_agent: User agent string
        session_id: Session ID
        metadata: Additional metadata
        notify_admins: Whether to notify admins
    """
    try:
        # Create audit log
        audit_log = AuditLog.log_action(
            action_type=action_type,
            description=description,
            actor=actor,
            target_type=target_type,
            target_id=target_id,
            severity=severity,
            category=category,
            ip_address=ip_address,
            user_agent=user_agent,
            session_id=session_id,
            metadata=metadata or {}
        )
        
        # Notify admins if enabled
        if notify_admins:
            AdminActivityNotifier.notify_admins(
                activity_type=action_type,
                actor=actor,
                target_type=target_type,
                target_id=target_id,
                metadata=metadata or {},
                severity=severity
            )
        
        return audit_log
    
    except Exception as e:
        logger.error(f"Error logging and notifying activity: {str(e)}")
        return None


def log_user_action(action_type, user, description, severity=AuditLog.SeverityLevel.INFO, 
                   metadata=None, notify=True):
    """Log and notify about user actions"""
    return log_and_notify_activity(
        action_type=action_type,
        description=description,
        actor=user,
        target_type=AuditLog.TargetType.USER,
        target_id=user.id,
        severity=severity,
        metadata=metadata or {'username': user.username},
        notify_admins=notify
    )


def log_message_action(action_type, message, actor=None, description=None, 
                      severity=AuditLog.SeverityLevel.INFO, notify=True):
    """Log and notify about message actions"""
    return log_and_notify_activity(
        action_type=action_type,
        description=description or f"Message {action_type.lower()}",
        actor=actor or message.sender,
        target_type=AuditLog.TargetType.MESSAGE,
        target_id=message.id,
        severity=severity,
        metadata={
            'username': (actor or message.sender).username,
            'conversation': str(message.conversation)
        },
        notify_admins=notify
    )


def log_group_action(action_type, group, actor=None, description=None, 
                    severity=AuditLog.SeverityLevel.INFO, notify=True):
    """Log and notify about group actions"""
    return log_and_notify_activity(
        action_type=action_type,
        description=description or f"Group {action_type.lower()}",
        actor=actor or group.created_by,
        target_type=AuditLog.TargetType.GROUP,
        target_id=group.id,
        severity=severity,
        metadata={
            'group_name': group.name,
            'username': (actor or group.created_by).username
        },
        notify_admins=notify
    )


def log_security_event(action_type, description, ip_address=None, user=None, 
                      severity=AuditLog.SeverityLevel.WARNING, metadata=None, notify=True):
    """Log and notify about security events"""
    return log_and_notify_activity(
        action_type=action_type,
        description=description,
        actor=user,
        target_type=AuditLog.TargetType.SYSTEM,
        severity=severity,
        ip_address=ip_address,
        metadata=metadata or {'ip_address': ip_address},
        notify_admins=notify
    )
