# Moderator System Integration Checklist

## Quick Setup (5 minutes)

### Step 1: Update apps.py
```python
# users/apps.py
from django.apps import AppConfig

class UsersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'users'
    
    def ready(self):
        import users.moderator_signals  # Add this line
```

### Step 2: Update admin.py
```python
# users/admin.py - Add at the end
from users.moderator_models import (
    ModeratorPermission, ModeratorRole, ModeratorProfile, ModerationAction
)

@admin.register(ModeratorPermission)
class ModeratorPermissionAdmin(admin.ModelAdmin):
    list_display = ['permission', 'description']

@admin.register(ModeratorRole)
class ModeratorRoleAdmin(admin.ModelAdmin):
    list_display = ['name', 'role_type', 'is_active']
    filter_horizontal = ['permissions']

@admin.register(ModeratorProfile)
class ModeratorProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'role', 'is_active_moderator']
    readonly_fields = ['warnings_issued', 'suspensions_issued', 'bans_issued', 'messages_deleted']

@admin.register(ModerationAction)
class ModerationActionAdmin(admin.ModelAdmin):
    list_display = ['moderator', 'action_type', 'target_user', 'created_at']
    list_filter = ['action_type', 'created_at']
```

### Step 3: Update urls.py
```python
# users/urls.py - Add at the end
from rest_framework.routers import DefaultRouter
from users.moderator_views import ModeratorViewSet

router = DefaultRouter()
router.register(r'moderators', ModeratorViewSet, basename='moderator')

urlpatterns = [
    # ... existing patterns
    path('', include(router.urls)),
]
```

### Step 4: Run Migrations
```bash
python manage.py makemigrations users
python manage.py migrate users
```

### Step 5: Initialize Default Roles
```python
# Run in Django shell: python manage.py shell
from users.moderator_models import ModeratorPermissionHelper

# Create default roles
ModeratorPermissionHelper.create_moderator_role('junior')
ModeratorPermissionHelper.create_moderator_role('senior')
ModeratorPermissionHelper.create_moderator_role('lead')
```

## Verification

### Check Models Created
```bash
python manage.py dbshell
SELECT * FROM moderator_permissions;
SELECT * FROM moderator_roles;
```

### Test Assignment
```python
# python manage.py shell
from django.contrib.auth import get_user_model
from users.moderator_models import ModeratorPermissionHelper

User = get_user_model()
user = User.objects.get(username='admin')
ModeratorPermissionHelper.assign_moderator_role(user, 'lead')

# Verify
print(user.role)  # Should be 'moderator'
print(user.moderator_profile.role.name)  # Should be 'Lead Moderator'
```

## API Testing

### 1. Warn User
```bash
curl -X POST http://localhost:8000/api/moderators/warn_user/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user-uuid",
    "reason": "Spam messages"
  }'
```

### 2. Suspend User
```bash
curl -X POST http://localhost:8000/api/moderators/suspend_user/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user-uuid",
    "reason": "Harassment",
    "duration": "24h"
  }'
```

### 3. Ban User
```bash
curl -X POST http://localhost:8000/api/moderators/ban_user/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user-uuid",
    "reason": "Repeated violations"
  }'
```

### 4. Delete Message
```bash
curl -X POST http://localhost:8000/api/moderators/delete_message/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message_id": "message-uuid",
    "reason": "Inappropriate content"
  }'
```

## Frontend Integration

### React Component Example
```typescript
import { useState } from 'react';
import { api } from '@/lib/api';

export function ModeratorPanel() {
  const [selectedUser, setSelectedUser] = useState(null);
  const [reason, setReason] = useState('');

  const handleWarnUser = async () => {
    await api.post('/api/moderators/warn_user/', {
      user_id: selectedUser.id,
      reason: reason
    });
  };

  const handleSuspendUser = async () => {
    await api.post('/api/moderators/suspend_user/', {
      user_id: selectedUser.id,
      reason: reason,
      duration: '24h'
    });
  };

  return (
    <div>
      {/* UI for moderator actions */}
    </div>
  );
}
```

## Permissions Matrix

| Action | Junior | Senior | Lead | Admin |
|--------|--------|--------|------|-------|
| View Users | ✓ | ✓ | ✓ | ✓ |
| Warn Users | ✓ | ✓ | ✓ | ✓ |
| Delete Messages | ✓ | ✓ | ✓ | ✓ |
| Suspend Users | ✗ | ✓ | ✓ | ✓ |
| Ban Users | ✗ | ✗ | ✓ | ✓ |
| View Audit Logs | ✗ | ✓ | ✓ | ✓ |
| Manage Moderators | ✗ | ✗ | ✓ | ✓ |

## Common Issues & Solutions

### Issue: ModuleNotFoundError: No module named 'users.moderator_models'
**Solution:** Ensure all moderator files are in the users app directory

### Issue: Moderator cannot perform actions
**Solution:** 
1. Check user.role == 'moderator'
2. Verify moderator_profile exists
3. Check role has permissions
4. Verify is_active_moderator == True

### Issue: Suspensions not expiring
**Solution:**
1. Check signals are registered in apps.py
2. Verify expires_at is set
3. Check timezone settings

### Issue: Audit logs not created
**Solution:**
1. Verify AuditLog model exists
2. Check signals are connected
3. Review error logs

## Database Schema

```sql
-- Moderator Permissions
CREATE TABLE moderator_permissions (
    id INTEGER PRIMARY KEY,
    permission VARCHAR(50) UNIQUE,
    description TEXT
);

-- Moderator Roles
CREATE TABLE moderator_roles (
    id INTEGER PRIMARY KEY,
    name VARCHAR(100) UNIQUE,
    role_type VARCHAR(20),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Moderator Profiles
CREATE TABLE moderator_profiles (
    id INTEGER PRIMARY KEY,
    user_id INTEGER UNIQUE,
    role_id INTEGER,
    warnings_issued INTEGER DEFAULT 0,
    suspensions_issued INTEGER DEFAULT 0,
    bans_issued INTEGER DEFAULT 0,
    messages_deleted INTEGER DEFAULT 0,
    last_moderation_action TIMESTAMP,
    is_active_moderator BOOLEAN DEFAULT TRUE,
    assigned_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Moderation Actions
CREATE TABLE moderation_actions (
    id INTEGER PRIMARY KEY,
    moderator_id INTEGER,
    action_type VARCHAR(30),
    target_user_id INTEGER,
    target_id VARCHAR(255),
    target_type VARCHAR(50),
    reason TEXT,
    duration VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    appeal_status VARCHAR(20) DEFAULT 'none',
    created_at TIMESTAMP,
    expires_at TIMESTAMP
);
```

## Performance Optimization

### Indexes
```python
# Already included in models.py
class Meta:
    indexes = [
        models.Index(fields=['moderator']),
        models.Index(fields=['target_user']),
        models.Index(fields=['action_type']),
        models.Index(fields=['is_active']),
    ]
```

### Query Optimization
```python
# Use select_related for foreign keys
ModeratorProfile.objects.select_related('user', 'role')

# Use prefetch_related for many-to-many
ModeratorRole.objects.prefetch_related('permissions')
```

## Monitoring

### Check Active Moderators
```python
from users.moderator_models import ModeratorProfile

active_mods = ModeratorProfile.objects.filter(
    is_active_moderator=True
).select_related('user', 'role')

for mod in active_mods:
    print(f"{mod.user.username}: {mod.role.name}")
```

### Check Recent Actions
```python
from users.moderator_models import ModerationAction

recent = ModerationAction.objects.filter(
    is_active=True
).order_by('-created_at')[:10]

for action in recent:
    print(f"{action.moderator.username}: {action.get_action_type_display()}")
```

## Support

For issues or questions:
1. Check MODERATOR_IMPLEMENTATION_GUIDE.md
2. Review moderator_models.py documentation
3. Check Django logs for errors
4. Verify all files are in correct locations
