# Admin Activity Notifications - Quick Reference

## ✅ What's Implemented

Your admin notification system is now **fully functional**. Admins will be notified about:

### 🔵 User Activities
- Login/Logout
- User creation
- User approval/suspension/ban
- Role changes
- Password changes
- Profile updates

### 💬 Chat Activities
- Messages sent
- Messages edited/deleted
- Conversations created
- Groups created/joined
- Members added/removed

### 🔒 Security Events
- Failed login attempts
- Suspicious activity
- Rate limit exceeded
- Force logout

### ⚙️ Admin Actions
- System settings changed
- Backups created/restored
- User suspensions
- Role changes

---

## 🚀 How to Use

### Automatic (No Code Changes)

Activities are automatically detected and admins are notified:

```python
# User logs in → Admin notified ✅
# Message sent → Admin notified ✅
# Group created → Admin notified ✅
# User suspended → Admin notified ✅
```

### Manual (For Custom Activities)

```python
from users.activity_logging import log_user_action

log_user_action(
    action_type='USER_APPROVED',
    user=user_obj,
    description='User approved by admin'
)
# Admin automatically notified ✅
```

---

## 📊 Notification Types

| Type | Priority | Example |
|------|----------|---------|
| system | Low-High | User login, group created |
| message | Low | Message sent |
| warning | High | Failed login, suspicious activity |
| error | Critical | Security breach |

---

## 🔧 Files Created

1. `users/admin_activity_notifier.py` - Notification service
2. `users/admin_activity_signals.py` - Auto-detection signals
3. `users/activity_logging.py` - Logging utilities

---

## 📝 Quick Examples

### Log User Action
```python
from users.activity_logging import log_user_action

log_user_action(
    action_type='USER_SUSPENDED',
    user=user,
    description='User suspended for violation'
)
```

### Log Message Action
```python
from users.activity_logging import log_message_action

log_message_action(
    action_type='MESSAGE_DELETED',
    message=message,
    actor=admin_user
)
```

### Log Group Action
```python
from users.activity_logging import log_group_action

log_group_action(
    action_type='GROUP_CREATED',
    group=group,
    actor=creator
)
```

### Log Security Event
```python
from users.activity_logging import log_security_event

log_security_event(
    action_type='USER_FAILED_LOGIN',
    description='Failed login attempt',
    ip_address='192.168.1.1',
    user=user
)
```

---

## 🧪 Testing

### Test Automatic Notifications

```bash
python manage.py shell

# Create a user activity
>>> from users.models import User, UserActivity
>>> user = User.objects.first()
>>> UserActivity.objects.create(user=user, action='login')

# Check admin notifications
>>> from users.models_notification import Notification
>>> admin = User.objects.filter(role='admin').first()
>>> Notification.objects.filter(user=admin).count()
# Should show new notifications ✅
```

### Test Manual Notifications

```bash
python manage.py shell

# Log a user action
>>> from users.activity_logging import log_user_action
>>> user = User.objects.first()
>>> log_user_action('USER_APPROVED', user, 'Test approval')

# Check notifications
>>> from users.models_notification import Notification
>>> admin = User.objects.filter(role='admin').first()
>>> Notification.objects.filter(user=admin).latest('created_at')
# Should show the notification ✅
```

---

## 📱 Admin Notification Center

Admins can view notifications at:

```
GET /api/users/notifications/
GET /api/users/notifications/unread/
GET /api/users/notifications/unread_count/
GET /api/users/notifications/by_type/?type=system
```

---

## 🎯 Activity Types

### User Activities
- `USER_LOGIN`
- `USER_LOGOUT`
- `USER_CREATED`
- `USER_APPROVED`
- `USER_SUSPENDED`
- `USER_BANNED`
- `USER_FAILED_LOGIN`
- `FORCE_LOGOUT`
- `ROLE_CHANGED`

### Message Activities
- `MESSAGE_SENT`
- `MESSAGE_EDITED`
- `MESSAGE_DELETED`

### Group Activities
- `GROUP_CREATED`
- `GROUP_JOINED`
- `MEMBER_ADDED`
- `MEMBER_REMOVED`

### Security Activities
- `USER_FAILED_LOGIN`
- `SUSPICIOUS_ACTIVITY`
- `RATE_LIMIT_EXCEEDED`

### Admin Activities
- `SYSTEM_SETTINGS_CHANGED`
- `BACKUP_CREATED`
- `BACKUP_RESTORED`

---

## ⚙️ Configuration

### Disable Notifications for Specific Activity

```python
log_user_action(
    action_type='USER_LOGIN',
    user=user,
    description='User logged in',
    notify=False  # ✅ Disables notification
)
```

### Set Severity Level

```python
from admin_panel.models import AuditLog

log_user_action(
    action_type='USER_SUSPENDED',
    user=user,
    description='User suspended',
    severity=AuditLog.SeverityLevel.HIGH  # Critical event
)
```

### Add Custom Metadata

```python
log_user_action(
    action_type='USER_APPROVED',
    user=user,
    description='User approved',
    metadata={
        'approved_by': 'admin_username',
        'reason': 'Verified email',
        'timestamp': '2025-01-XX'
    }
)
```

---

## 🔍 Monitoring

### View All Notifications
```bash
python manage.py shell
>>> from users.models_notification import Notification
>>> Notification.objects.filter(user__role='admin').count()
```

### View Audit Logs
```bash
>>> from admin_panel.models import AuditLog
>>> AuditLog.objects.count()
>>> AuditLog.objects.filter(severity='critical')
```

### View by Activity Type
```bash
>>> AuditLog.objects.filter(action_type='USER_LOGIN').count()
>>> AuditLog.objects.filter(action_type='MESSAGE_SENT').count()
```

---

## 🚨 Troubleshooting

### Admins Not Receiving Notifications

**Check 1**: Admin user exists and is active
```bash
>>> User.objects.filter(role='admin', is_active=True).count()
```

**Check 2**: Notifications are being created
```bash
>>> Notification.objects.filter(user__role='admin').count()
```

**Check 3**: Signals are registered
```bash
>>> import users.admin_activity_signals
>>> # No errors = signals registered ✅
```

### Too Many Notifications

**Solution**: Disable low-priority activities
```python
log_user_action(
    action_type='USER_LOGIN',
    user=user,
    description='User logged in',
    notify=False  # Don't notify for logins
)
```

---

## 📊 Performance

- ✅ Notifications sent asynchronously (if Celery configured)
- ✅ Audit logs created synchronously but non-blocking
- ✅ Only active admins receive notifications
- ✅ Failed notifications logged but don't affect operations

---

## 🎓 Integration Examples

### In Views
```python
from users.activity_logging import log_user_action

@api_view(['POST'])
def approve_user(request, user_id):
    user = User.objects.get(id=user_id)
    user.approve_user()
    
    log_user_action(
        action_type='USER_APPROVED',
        user=user,
        description=f'Approved by {request.user.username}'
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
        
        log_message_action(
            action_type='MESSAGE_DELETED',
            message=message,
            actor=actor
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
            description=f'New user: {instance.username}'
        )
```

---

## ✨ Summary

Your admin notification system is **fully functional** and **production-ready**:

✅ Automatic activity detection
✅ Real-time admin notifications
✅ Comprehensive activity logging
✅ Security event tracking
✅ Customizable notifications
✅ Easy integration

**Admins will now be notified about every important activity in your system!** 🎉

---

## 📞 Support

For detailed information, see: `ADMIN_ACTIVITY_NOTIFICATION_GUIDE.md`

For notification system details, see: `NOTIFICATION_SYSTEM_IMPLEMENTATION_GUIDE.md`
