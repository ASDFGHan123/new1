# Admin Activity Notification System - Integration Guide

## Overview

The admin activity notification system automatically sends notifications to all admin users whenever activities occur in the chat app and dashboard. This includes:

- User activities (login, logout, profile updates)
- Message activities (sent, edited, deleted)
- Group activities (created, joined, members added)
- Security events (failed logins, suspicious activity)
- Admin actions (user suspension, role changes)

## How It Works

### Automatic Notifications (No Code Changes Needed)

The system uses Django signals to automatically detect and notify admins about activities:

1. **User Activities** - Triggered when UserActivity records are created
2. **Message Activities** - Triggered when Message objects are saved/deleted
3. **Group Activities** - Triggered when Group/GroupMember objects are saved
4. **Audit Logs** - Triggered for critical/error severity events

### Manual Notifications (For Custom Activities)

For custom activities, use the activity logging utilities:

```python
from users.activity_logging import log_user_action, log_message_action, log_group_action

# Log user action
log_user_action(
    action_type='USER_APPROVED',
    user=user_obj,
    description='User approved by admin',
    severity='medium'
)

# Log message action
log_message_action(
    action_type='MESSAGE_DELETED',
    message=message_obj,
    actor=admin_user,
    description='Message deleted by admin'
)

# Log group action
log_group_action(
    action_type='GROUP_CREATED',
    group=group_obj,
    actor=creator_user,
    description='New group created'
)
```

## Files Created

1. **users/admin_activity_notifier.py** - Main notification service
2. **users/admin_activity_signals.py** - Signal handlers for automatic notifications
3. **users/activity_logging.py** - Utility functions for logging and notifying

## Setup

### Step 1: Verify Installation

The signals are automatically registered in `users/apps.py`:

```python
def ready(self):
    import users.signals
    import users.admin_activity_signals  # ✅ Already added
```

### Step 2: Test the System

```bash
# Create a test user activity
python manage.py shell
>>> from users.models import User, UserActivity
>>> user = User.objects.first()
>>> UserActivity.objects.create(user=user, action='login')

# Check if admin received notification
>>> from users.models_notification import Notification
>>> admin = User.objects.filter(role='admin').first()
>>> Notification.objects.filter(user=admin).count()
# Should show new notifications ✅
```

## Activity Types Supported

### User Activities
- `USER_LOGIN` - User logged in
- `USER_LOGOUT` - User logged out
- `USER_CREATED` - New user created
- `USER_APPROVED` - User approved
- `USER_SUSPENDED` - User suspended
- `USER_BANNED` - User banned
- `USER_FAILED_LOGIN` - Failed login attempt
- `FORCE_LOGOUT` - User force logged out
- `ROLE_CHANGED` - User role changed

### Message Activities
- `MESSAGE_SENT` - New message sent
- `MESSAGE_EDITED` - Message edited
- `MESSAGE_DELETED` - Message deleted

### Group Activities
- `GROUP_CREATED` - New group created
- `GROUP_JOINED` - User joined group
- `MEMBER_ADDED` - Member added to group
- `MEMBER_REMOVED` - Member removed from group

### Security Activities
- `USER_FAILED_LOGIN` - Failed login attempt
- `SUSPICIOUS_ACTIVITY` - Suspicious activity detected
- `RATE_LIMIT_EXCEEDED` - Rate limit exceeded

### Admin Activities
- `SYSTEM_SETTINGS_CHANGED` - System settings changed
- `BACKUP_CREATED` - Backup created
- `BACKUP_RESTORED` - Backup restored

## Notification Priority Levels

- **Low** - Regular activities (login, logout, messages)
- **Medium** - Important activities (user created, group created)
- **High** - Critical activities (user suspended, failed login)

## Customization

### Add Custom Activity Type

Edit `users/admin_activity_notifier.py`:

```python
ACTIVITY_NOTIFICATIONS = {
    'YOUR_ACTIVITY': {
        'type': 'system',  # or 'message', 'warning', 'error'
        'title': 'Your Activity Title',
        'message': 'Your activity message with {placeholders}',
        'priority': 'medium'  # low, medium, high
    },
    # ... other activities
}
```

### Customize Notification Message

Use placeholders in the message:

```python
'message': '{username} performed action in {conversation}'
```

Available placeholders:
- `{username}` - Actor's username
- `{conversation}` - Conversation name
- `{group_name}` - Group name
- `{ip_address}` - IP address
- `{new_role}` - New role
- Any custom metadata key

## Integration with Existing Code

### In Views

```python
from users.activity_logging import log_user_action

@api_view(['POST'])
def approve_user_view(request, user_id):
    user = User.objects.get(id=user_id)
    user.approve_user()
    
    # Automatically logs and notifies admins
    log_user_action(
        action_type='USER_APPROVED',
        user=user,
        description=f'User {user.username} approved by {request.user.username}'
    )
    
    return Response({'status': 'approved'})
```

### In Services

```python
from users.activity_logging import log_message_action

class MessageService:
    @staticmethod
    def delete_message(message, actor):
        message.delete_message()
        
        # Automatically logs and notifies admins
        log_message_action(
            action_type='MESSAGE_DELETED',
            message=message,
            actor=actor,
            description=f'Message deleted by {actor.username}'
        )
```

### In Signals

```python
from django.db.models.signals import post_save
from django.dispatch import receiver
from users.activity_logging import log_user_action

@receiver(post_save, sender=User)
def on_user_created(sender, instance, created, **kwargs):
    if created:
        log_user_action(
            action_type='USER_CREATED',
            user=instance,
            description=f'New user created: {instance.username}'
        )
```

## Notification Flow

```
Activity Occurs
    ↓
Signal Triggered
    ↓
Activity Logged (AuditLog)
    ↓
Admin Notified (Notification)
    ↓
Admin Sees in Notification Center
```

## Filtering Notifications

Admins can filter notifications by type:

```bash
GET /api/users/notifications/by_type/?type=system
GET /api/users/notifications/by_type/?type=message
GET /api/users/notifications/by_type/?type=warning
```

## Disabling Notifications

To disable notifications for specific activities:

```python
log_user_action(
    action_type='USER_LOGIN',
    user=user,
    description='User logged in',
    notify=False  # ✅ Disables admin notification
)
```

## Monitoring

### Check Notification Logs

```bash
# View all notifications
python manage.py shell
>>> from users.models_notification import Notification
>>> Notification.objects.filter(user__role='admin').count()

# View by type
>>> Notification.objects.filter(notification_type='system').count()

# View unread
>>> Notification.objects.filter(is_read=False).count()
```

### Check Audit Logs

```bash
# View all audit logs
>>> from admin_panel.models import AuditLog
>>> AuditLog.objects.count()

# View by action type
>>> AuditLog.objects.filter(action_type='USER_LOGIN').count()

# View by severity
>>> AuditLog.objects.filter(severity='critical').count()
```

## Performance Considerations

- Notifications are sent asynchronously via Celery (if configured)
- Audit logs are created synchronously but don't block main operations
- Notifications are only sent to active admin users
- Failed notifications are logged but don't affect main operations

## Troubleshooting

### Admins Not Receiving Notifications

1. Check if user has `role='admin'` and `is_active=True`
2. Check notification logs: `Notification.objects.filter(user__role='admin')`
3. Check for errors in Django logs
4. Verify signals are registered: `python manage.py shell` → `import users.admin_activity_signals`

### Too Many Notifications

1. Adjust priority levels in `ACTIVITY_NOTIFICATIONS`
2. Disable notifications for low-priority activities
3. Use notification filtering in the UI

### Missing Activities

1. Check if activity type is in `ACTIVITY_NOTIFICATIONS`
2. Verify signal is connected to the model
3. Check Django logs for signal errors

## Best Practices

1. **Always log important activities** - Use `log_and_notify_activity()` for custom actions
2. **Set appropriate severity levels** - Use HIGH for security events, MEDIUM for important actions
3. **Include context in metadata** - Help admins understand what happened
4. **Test notifications** - Verify admins receive notifications for critical activities
5. **Monitor audit logs** - Regularly review audit logs for security issues

## API Endpoints

### Get Notifications
```
GET /api/users/notifications/
```

### Get Unread Count
```
GET /api/users/notifications/unread_count/
```

### Mark as Read
```
POST /api/users/notifications/{id}/mark_as_read/
```

### Filter by Type
```
GET /api/users/notifications/by_type/?type=system
```

## Example: Complete Integration

```python
# In your view
from users.activity_logging import log_user_action
from admin_panel.models import AuditLog

@api_view(['POST'])
@permission_classes([IsAdminUser])
def suspend_user_view(request, user_id):
    user = User.objects.get(id=user_id)
    user.suspend_user()
    
    # Log and notify
    log_user_action(
        action_type='USER_SUSPENDED',
        user=user,
        description=f'User suspended by {request.user.username}',
        severity=AuditLog.SeverityLevel.HIGH,
        metadata={
            'suspended_by': request.user.username,
            'reason': request.data.get('reason', 'No reason provided')
        }
    )
    
    return Response({'status': 'user suspended'})
```

## Summary

The admin activity notification system is now fully integrated and working. Admins will automatically receive notifications for:

✅ All user activities
✅ All message activities
✅ All group activities
✅ All security events
✅ All admin actions

No additional setup required - it works automatically!
