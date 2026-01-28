# Moderator System - Testing & Assignment Guide

## Quick Assignment Methods

### Method 1: Django Management Command (Easiest)

```bash
# Assign junior moderator
python manage.py assign_moderator john_doe junior

# Assign senior moderator
python manage.py assign_moderator jane_smith senior

# Assign lead moderator
python manage.py assign_moderator admin_user lead
```

### Method 2: Django Admin Panel

1. Go to `/admin/users/moderatorprofile/`
2. Click "Add Moderator Profile"
3. Select user and role
4. Save

### Method 3: Django Shell

```bash
python manage.py shell
```

```python
from django.contrib.auth import get_user_model
from users.moderator_models import ModeratorPermissionHelper

User = get_user_model()

# Get user
user = User.objects.get(username='john_doe')

# Assign role
ModeratorPermissionHelper.assign_moderator_role(user, 'junior')
# or 'senior' or 'lead'

# Verify
print(f"Role: {user.role}")
print(f"Moderator Type: {user.moderator_profile.role.name}")
print(f"Permissions: {user.moderator_profile.get_permissions()}")
```

### Method 4: API Endpoint (For Admin Dashboard)

```bash
# Create endpoint in admin views
POST /api/admin/assign-moderator/
{
    "user_id": "uuid",
    "role_type": "junior"
}
```

## Running Tests

### Run All Moderator Tests

```bash
python manage.py test users.tests.ModeratorModelTests
python manage.py test users.tests.ModerationActionTests
python manage.py test users.tests.ModeratorAPITests
python manage.py test users.tests.ModeratorIntegrationTests
```

### Run Specific Test

```bash
# Test permission assignment
python manage.py test users.tests.ModeratorModelTests.test_assign_junior_moderator

# Test API endpoints
python manage.py test users.tests.ModeratorAPITests.test_warn_user_endpoint

# Test full workflow
python manage.py test users.tests.ModeratorIntegrationTests.test_full_moderation_workflow
```

### Run All Tests with Verbose Output

```bash
python manage.py test users.tests -v 2
```

## Test Coverage

### Model Tests (✓ Passing)
- ✓ Create default roles (junior, senior, lead)
- ✓ Assign junior moderator
- ✓ Assign senior moderator
- ✓ Assign lead moderator
- ✓ Junior permissions (warn, delete)
- ✓ Senior permissions (+ suspend)
- ✓ Lead permissions (+ ban)
- ✓ Cannot moderate admin
- ✓ Can moderate regular user
- ✓ Remove moderator role

### Moderation Action Tests (✓ Passing)
- ✓ Create warning action
- ✓ Create suspension action
- ✓ Create ban action
- ✓ Audit log created

### API Tests (✓ Passing)
- ✓ Warn user endpoint
- ✓ Suspend user endpoint
- ✓ Ban user endpoint
- ✓ Get my actions endpoint
- ✓ Get active actions endpoint
- ✓ Junior cannot ban
- ✓ Cannot moderate admin

### Integration Tests (✓ Passing)
- ✓ Full moderation workflow
- ✓ Moderator hierarchy

## Step-by-Step Assignment Example

### Scenario: Assign John as Junior Moderator

**Step 1: Verify User Exists**
```bash
python manage.py shell
```

```python
from django.contrib.auth import get_user_model
User = get_user_model()
user = User.objects.get(username='john_doe')
print(f"User: {user.username}, Role: {user.role}")
```

**Step 2: Assign Moderator Role**
```python
from users.moderator_models import ModeratorPermissionHelper

ModeratorPermissionHelper.assign_moderator_role(user, 'junior')
```

**Step 3: Verify Assignment**
```python
user.refresh_from_db()
print(f"New Role: {user.role}")
print(f"Moderator Profile: {user.moderator_profile}")
print(f"Moderator Type: {user.moderator_profile.role.name}")
print(f"Is Active: {user.moderator_profile.is_active_moderator}")
print(f"Permissions: {user.moderator_profile.get_permissions()}")
```

**Expected Output:**
```
New Role: moderator
Moderator Profile: Moderator: john_doe
Moderator Type: Junior Moderator
Is Active: True
Permissions: ['view_users', 'view_conversations', 'view_messages', 'delete_messages', 'warn_users', 'view_reports', 'moderate_content']
```

## Testing Moderation Actions

### Test Warning User

```python
from users.moderator_models import ModerationAction

# Create warning
action = ModerationAction.objects.create(
    moderator=moderator_user,
    action_type='warning',
    target_user=regular_user,
    reason='Spam messages'
)

# Verify
print(f"Action: {action.get_action_type_display()}")
print(f"Target: {action.target_user.username}")
print(f"Active: {action.is_active}")

# Check moderator stats
moderator_user.moderator_profile.refresh_from_db()
print(f"Warnings Issued: {moderator_user.moderator_profile.warnings_issued}")
```

### Test Suspending User

```python
from datetime import timedelta
from django.utils import timezone

# Create suspension
expires_at = timezone.now() + timedelta(hours=24)
action = ModerationAction.objects.create(
    moderator=moderator_user,
    action_type='suspend',
    target_user=regular_user,
    reason='Harassment',
    duration='24h',
    expires_at=expires_at
)

# Verify user suspended
regular_user.refresh_from_db()
print(f"User Status: {regular_user.status}")  # Should be 'suspended'
print(f"Expires At: {action.expires_at}")
```

### Test Banning User

```python
# Create ban (lead moderator only)
action = ModerationAction.objects.create(
    moderator=lead_moderator,
    action_type='ban',
    target_user=regular_user,
    reason='Repeated violations'
)

# Verify user banned
regular_user.refresh_from_db()
print(f"User Status: {regular_user.status}")  # Should be 'banned'
print(f"Is Active: {regular_user.is_active}")  # Should be False
```

## API Testing with cURL

### Test Warn User

```bash
curl -X POST http://localhost:8000/api/moderators/warn_user/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user-uuid",
    "reason": "Spam messages"
  }'
```

### Test Suspend User

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

### Test Ban User

```bash
curl -X POST http://localhost:8000/api/moderators/ban_user/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user-uuid",
    "reason": "Repeated violations"
  }'
```

### Get My Actions

```bash
curl -X GET http://localhost:8000/api/moderators/my_actions/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Verification Checklist

After assigning moderator role, verify:

- [ ] User role changed to 'moderator'
- [ ] ModeratorProfile created
- [ ] ModeratorRole assigned correctly
- [ ] Permissions loaded
- [ ] is_active_moderator = True
- [ ] Audit log created
- [ ] User can access moderator endpoints
- [ ] User cannot perform actions outside their role

## Troubleshooting

### Issue: "User does not exist"
```bash
# Check available users
python manage.py shell
from django.contrib.auth import get_user_model
User = get_user_model()
print([u.username for u in User.objects.all()])
```

### Issue: "ModeratorProfile already exists"
```python
# Check existing profile
from users.moderator_models import ModeratorProfile
profile = ModeratorProfile.objects.get(user=user)
print(f"Existing role: {profile.role.name}")
```

### Issue: Permissions not showing
```python
# Verify role has permissions
role = user.moderator_profile.role
print(f"Role: {role.name}")
print(f"Permissions: {list(role.permissions.values_list('permission', flat=True))}")
```

### Issue: Cannot perform moderation action
```python
# Check permission
from users.moderator_models import ModeratorPermissionHelper
can_warn = ModeratorPermissionHelper.can_warn_user(user)
print(f"Can warn: {can_warn}")

# Check if moderator
is_mod = ModeratorPermissionHelper.is_moderator(user)
print(f"Is moderator: {is_mod}")
```

## Database Verification

### Check Moderator Roles

```sql
SELECT * FROM moderator_roles;
```

### Check Moderator Profiles

```sql
SELECT u.username, mr.name, mp.is_active_moderator 
FROM moderator_profiles mp
JOIN users u ON mp.user_id = u.id
JOIN moderator_roles mr ON mp.role_id = mr.id;
```

### Check Moderation Actions

```sql
SELECT u1.username as moderator, u2.username as target, ma.action_type, ma.created_at
FROM moderation_actions ma
JOIN users u1 ON ma.moderator_id = u1.id
LEFT JOIN users u2 ON ma.target_user_id = u2.id
ORDER BY ma.created_at DESC;
```

## Performance Notes

- Moderator queries use select_related for optimization
- Permissions cached in ModeratorProfile
- Audit logs indexed by actor and timestamp
- Moderation actions indexed by moderator and target

## Next Steps

1. ✓ Assign moderators using management command
2. ✓ Test moderation actions via API
3. ✓ Monitor audit logs
4. ✓ Review moderator statistics
5. ✓ Handle appeals (future feature)
