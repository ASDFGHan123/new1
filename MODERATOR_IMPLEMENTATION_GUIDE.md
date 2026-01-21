# Moderator Role Implementation Guide

## Overview

This guide explains how to set up and use the fully implemented moderator role system in OffChat Admin Dashboard.

## Files Added

1. **`users/moderator_models.py`** - Core moderator models
   - `ModeratorPermission` - Define individual permissions
   - `ModeratorRole` - Group permissions into roles
   - `ModeratorProfile` - Extended moderator profile
   - `ModerationAction` - Track all moderation actions
   - `ModeratorPermissionHelper` - Permission checking utilities

2. **`users/moderator_views.py`** - API endpoints
   - `ModeratorViewSet` - REST API for moderation actions
   - Endpoints for warn, suspend, ban, delete message

3. **`users/moderator_serializers.py`** - Data serializers
   - Serializers for all moderator models

4. **`users/moderator_signals.py`** - Signal handlers
   - Auto-update moderator stats
   - Expire temporary suspensions
   - Audit logging

## Setup Instructions

### 1. Update Django Settings

Add to `offchat_backend/settings/base.py`:

```python
INSTALLED_APPS = [
    # ... existing apps
    'users',
    'admin_panel',
]

# Moderator settings
MODERATOR_SETTINGS = {
    'AUTO_EXPIRE_SUSPENSIONS': True,
    'SUSPENSION_CHECK_INTERVAL': 3600,  # 1 hour
}
```

### 2. Register Models in Admin

Add to `users/admin.py`:

```python
from django.contrib import admin
from users.moderator_models import (
    ModeratorPermission, ModeratorRole, ModeratorProfile, ModerationAction
)

@admin.register(ModeratorPermission)
class ModeratorPermissionAdmin(admin.ModelAdmin):
    list_display = ['permission', 'description']
    search_fields = ['permission']

@admin.register(ModeratorRole)
class ModeratorRoleAdmin(admin.ModelAdmin):
    list_display = ['name', 'role_type', 'is_active']
    filter_horizontal = ['permissions']

@admin.register(ModeratorProfile)
class ModeratorProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'role', 'is_active_moderator', 'warnings_issued']
    readonly_fields = ['warnings_issued', 'suspensions_issued', 'bans_issued', 'messages_deleted']

@admin.register(ModerationAction)
class ModerationActionAdmin(admin.ModelAdmin):
    list_display = ['moderator', 'action_type', 'target_user', 'created_at']
    list_filter = ['action_type', 'created_at']
    search_fields = ['moderator__username', 'target_user__username']
```

### 3. Register URLs

Add to `users/urls.py`:

```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from users.moderator_views import ModeratorViewSet

router = DefaultRouter()
router.register(r'moderators', ModeratorViewSet, basename='moderator')

urlpatterns = [
    path('', include(router.urls)),
]
```

### 4. Initialize Signals

Add to `users/apps.py`:

```python
from django.apps import AppConfig

class UsersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'users'
    
    def ready(self):
        import users.moderator_signals
```

### 5. Create Migrations

```bash
python manage.py makemigrations users
python manage.py migrate users
```

## Usage Examples

### Assign Moderator Role

```python
from users.moderator_models import ModeratorPermissionHelper
from django.contrib.auth import get_user_model

User = get_user_model()

# Get user
user = User.objects.get(username='john_doe')

# Assign as junior moderator
ModeratorPermissionHelper.assign_moderator_role(user, role_type='junior')

# Assign as senior moderator
ModeratorPermissionHelper.assign_moderator_role(user, role_type='senior')

# Assign as lead moderator
ModeratorPermissionHelper.assign_moderator_role(user, role_type='lead')
```

### Check Permissions

```python
from users.moderator_models import ModeratorPermissionHelper

moderator = User.objects.get(username='moderator_user')

# Check specific permissions
can_warn = ModeratorPermissionHelper.can_warn_user(moderator)
can_suspend = ModeratorPermissionHelper.can_suspend_user(moderator)
can_ban = ModeratorPermissionHelper.can_ban_user(moderator)
can_delete = ModeratorPermissionHelper.can_delete_message(moderator)

# Check if can moderate specific user
target_user = User.objects.get(username='target_user')
can_moderate = ModeratorPermissionHelper.can_moderate_user(moderator, target_user)
```

### API Endpoints

#### Warn User
```bash
POST /api/moderators/warn_user/
{
    "user_id": "user-uuid",
    "reason": "Spam messages"
}
```

#### Suspend User
```bash
POST /api/moderators/suspend_user/
{
    "user_id": "user-uuid",
    "reason": "Harassment",
    "duration": "24h"  # or "7d", "2w"
}
```

#### Ban User (Lead Moderators Only)
```bash
POST /api/moderators/ban_user/
{
    "user_id": "user-uuid",
    "reason": "Repeated violations"
}
```

#### Delete Message
```bash
POST /api/moderators/delete_message/
{
    "message_id": "message-uuid",
    "reason": "Inappropriate content"
}
```

#### Get My Actions
```bash
GET /api/moderators/my_actions/
```

#### Get Active Actions
```bash
GET /api/moderators/active_actions/
```

## Moderator Role Types

### Junior Moderator
Permissions:
- View users
- View conversations
- View messages
- Delete messages
- Warn users
- View reports
- Moderate content

### Senior Moderator
All junior permissions plus:
- Suspend users
- View audit logs
- Manage groups
- Manage trash

### Lead Moderator
All senior permissions plus:
- Ban users
- Moderate other moderators

## Permission Hierarchy

```
Admin (Full Access)
├── Lead Moderator (Ban, Suspend, Warn, Delete)
├── Senior Moderator (Suspend, Warn, Delete)
└── Junior Moderator (Warn, Delete)
```

## Moderation Actions

### Warning
- Non-permanent action
- Notifies user
- Tracked in profile

### Suspension
- Temporary (24h, 7d, 2w, etc.)
- User cannot access system
- Auto-expires after duration
- Can be appealed

### Ban
- Permanent action
- User account deactivated
- Lead moderators only
- Can be appealed

### Delete Message
- Removes inappropriate content
- Tracked in audit logs
- Notifies user

## Automatic Features

### Expiration Handling
Suspensions automatically expire after their duration:
- Runs via signal on moderation action creation
- Can be scheduled as Celery task for large scale

### Audit Logging
All moderation actions are logged:
- Action type
- Moderator
- Target user
- Reason
- Timestamp

### Statistics Tracking
Moderator profiles track:
- Warnings issued
- Suspensions issued
- Bans issued
- Messages deleted
- Last moderation action

## Security Features

### Permission Checks
- Moderators cannot moderate admins
- Moderators cannot moderate other moderators (except leads)
- All actions require specific permissions

### Audit Trail
- Complete history of all moderation actions
- IP address and user agent tracking
- Severity levels for actions

### Appeal System
- Users can appeal suspensions/bans
- Appeal status tracked
- Moderators can review appeals

## Celery Tasks (Optional)

Add to `users/tasks.py`:

```python
from celery import shared_task
from users.moderator_models import check_expired_moderation_actions

@shared_task
def check_expired_suspensions():
    """Check and expire moderation actions."""
    check_expired_moderation_actions()
```

Add to `offchat_backend/celery.py`:

```python
app.conf.beat_schedule = {
    'check-expired-suspensions': {
        'task': 'users.tasks.check_expired_suspensions',
        'schedule': crontab(minute=0),  # Every hour
    },
}
```

## Testing

```python
from django.test import TestCase
from django.contrib.auth import get_user_model
from users.moderator_models import ModeratorPermissionHelper

User = get_user_model()

class ModeratorTestCase(TestCase):
    def setUp(self):
        self.moderator = User.objects.create_user(
            username='mod',
            email='mod@test.com',
            password='test123'
        )
        self.user = User.objects.create_user(
            username='user',
            email='user@test.com',
            password='test123'
        )
    
    def test_assign_moderator(self):
        ModeratorPermissionHelper.assign_moderator_role(self.moderator, 'junior')
        self.assertEqual(self.moderator.role, 'moderator')
        self.assertTrue(self.moderator.moderator_profile.is_active_moderator)
    
    def test_can_warn_user(self):
        ModeratorPermissionHelper.assign_moderator_role(self.moderator, 'junior')
        self.assertTrue(ModeratorPermissionHelper.can_warn_user(self.moderator))
    
    def test_cannot_ban_as_junior(self):
        ModeratorPermissionHelper.assign_moderator_role(self.moderator, 'junior')
        self.assertFalse(ModeratorPermissionHelper.can_ban_user(self.moderator))
```

## Troubleshooting

### Moderator cannot perform actions
- Check if user role is 'moderator'
- Verify moderator_profile exists
- Check if role has required permissions
- Verify is_active_moderator is True

### Suspensions not expiring
- Ensure signals are registered
- Check timezone settings
- Verify expires_at is set correctly

### Audit logs not created
- Check AuditLog model is registered
- Verify signals are connected
- Check for exceptions in logs

## Future Enhancements

1. **Appeal System** - Users can appeal actions
2. **Moderation Queue** - Pending content for review
3. **Automated Rules** - Auto-moderate based on patterns
4. **Team Management** - Assign moderators to teams
5. **Performance Analytics** - Moderator effectiveness metrics
