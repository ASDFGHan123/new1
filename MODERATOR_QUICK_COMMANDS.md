# Moderator System - Quick Commands Reference

## 🚀 Setup (One-Time)

```bash
# 1. Run migrations
python manage.py makemigrations users
python manage.py migrate users

# 2. Initialize default roles
python manage.py shell
```

```python
from users.moderator_models import ModeratorPermissionHelper
ModeratorPermissionHelper.create_moderator_role('junior')
ModeratorPermissionHelper.create_moderator_role('senior')
ModeratorPermissionHelper.create_moderator_role('lead')
exit()
```

---

## 👤 Assign Moderator Roles

### Command Line (Easiest)

```bash
# Assign junior moderator
python manage.py assign_moderator john_doe junior

# Assign senior moderator
python manage.py assign_moderator jane_smith senior

# Assign lead moderator
python manage.py assign_moderator admin_user lead
```

### Django Shell

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

# Verify
print(f"Role: {user.role}")
print(f"Type: {user.moderator_profile.role.name}")
print(f"Permissions: {user.moderator_profile.get_permissions()}")

exit()
```

---

## 🧪 Run Tests

```bash
# All moderator tests
python manage.py test users.tests -v 2

# Model tests only
python manage.py test users.tests.ModeratorModelTests -v 2

# API tests only
python manage.py test users.tests.ModeratorAPITests -v 2

# Integration tests only
python manage.py test users.tests.ModeratorIntegrationTests -v 2

# Specific test
python manage.py test users.tests.ModeratorModelTests.test_assign_junior_moderator -v 2
```

---

## ✅ Verify Assignment

```bash
python manage.py shell
```

```python
from django.contrib.auth import get_user_model
from users.moderator_models import ModeratorPermissionHelper

User = get_user_model()
user = User.objects.get(username='john_doe')

# Check role
print(f"✓ User role: {user.role}")
print(f"✓ Moderator type: {user.moderator_profile.role.name}")
print(f"✓ Is active: {user.moderator_profile.is_active_moderator}")

# Check permissions
perms = user.moderator_profile.get_permissions()
print(f"✓ Permissions ({len(perms)}):")
for perm in perms:
    print(f"  - {perm}")

# Check if can perform actions
print(f"✓ Can warn: {ModeratorPermissionHelper.can_warn_user(user)}")
print(f"✓ Can suspend: {ModeratorPermissionHelper.can_suspend_user(user)}")
print(f"✓ Can ban: {ModeratorPermissionHelper.can_ban_user(user)}")

exit()
```

---

## 🔍 Check All Moderators

```bash
python manage.py shell
```

```python
from users.moderator_models import ModeratorProfile

# List all active moderators
moderators = ModeratorProfile.objects.filter(
    is_active_moderator=True
).select_related('user', 'role')

print(f"Total moderators: {moderators.count()}\n")

for mod in moderators:
    print(f"User: {mod.user.username}")
    print(f"  Role: {mod.role.name}")
    print(f"  Warnings: {mod.warnings_issued}")
    print(f"  Suspensions: {mod.suspensions_issued}")
    print(f"  Bans: {mod.bans_issued}")
    print()

exit()
```

---

## 🎯 Test Moderation Actions

```bash
python manage.py shell
```

```python
from django.contrib.auth import get_user_model
from users.moderator_models import ModerationAction
from datetime import timedelta
from django.utils import timezone

User = get_user_model()

moderator = User.objects.get(username='john_doe')
target_user = User.objects.get(username='regular_user')

# Test 1: Issue warning
print("Test 1: Issue warning")
warning = ModerationAction.objects.create(
    moderator=moderator,
    action_type='warning',
    target_user=target_user,
    reason='Spam messages'
)
print(f"✓ Warning created: {warning.id}")
print(f"✓ Moderator warnings: {moderator.moderator_profile.warnings_issued}\n")

# Test 2: Suspend user
print("Test 2: Suspend user")
expires_at = timezone.now() + timedelta(hours=24)
suspension = ModerationAction.objects.create(
    moderator=moderator,
    action_type='suspend',
    target_user=target_user,
    reason='Harassment',
    duration='24h',
    expires_at=expires_at
)
target_user.refresh_from_db()
print(f"✓ Suspension created: {suspension.id}")
print(f"✓ User status: {target_user.status}")
print(f"✓ Moderator suspensions: {moderator.moderator_profile.suspensions_issued}\n")

# Test 3: Check audit logs
print("Test 3: Check audit logs")
from admin_panel.models import AuditLog
logs = AuditLog.objects.filter(actor=moderator).order_by('-timestamp')[:5]
print(f"✓ Recent audit logs: {logs.count()}")
for log in logs:
    print(f"  - {log.action_type}: {log.description}")

exit()
```

---

## 📊 View Statistics

```bash
python manage.py shell
```

```python
from users.moderator_models import ModeratorProfile, ModerationAction

# Moderator stats
mods = ModeratorProfile.objects.filter(is_active_moderator=True)
print("=== Moderator Statistics ===")
print(f"Total moderators: {mods.count()}")
print(f"Junior: {mods.filter(role__role_type='junior').count()}")
print(f"Senior: {mods.filter(role__role_type='senior').count()}")
print(f"Lead: {mods.filter(role__role_type='lead').count()}")

# Action stats
actions = ModerationAction.objects.all()
print(f"\n=== Moderation Actions ===")
print(f"Total actions: {actions.count()}")
print(f"Warnings: {actions.filter(action_type='warning').count()}")
print(f"Suspensions: {actions.filter(action_type='suspend').count()}")
print(f"Bans: {actions.filter(action_type='ban').count()}")
print(f"Messages deleted: {actions.filter(action_type='delete_message').count()}")

# Top moderators
print(f"\n=== Top Moderators ===")
for mod in mods.order_by('-warnings_issued')[:5]:
    total = mod.warnings_issued + mod.suspensions_issued + mod.bans_issued
    print(f"{mod.user.username}: {total} actions")

exit()
```

---

## 🔐 Test Permissions

```bash
python manage.py shell
```

```python
from django.contrib.auth import get_user_model
from users.moderator_models import ModeratorPermissionHelper

User = get_user_model()

# Create test users
junior = User.objects.get(username='junior_mod')
senior = User.objects.get(username='senior_mod')
lead = User.objects.get(username='lead_mod')

print("=== Permission Matrix ===\n")

actions = ['warn', 'suspend', 'ban', 'delete_message']
moderators = {'Junior': junior, 'Senior': senior, 'Lead': lead}

for mod_name, mod_user in moderators.items():
    print(f"{mod_name}:")
    print(f"  Can warn: {ModeratorPermissionHelper.can_warn_user(mod_user)}")
    print(f"  Can suspend: {ModeratorPermissionHelper.can_suspend_user(mod_user)}")
    print(f"  Can ban: {ModeratorPermissionHelper.can_ban_user(mod_user)}")
    print(f"  Can delete: {ModeratorPermissionHelper.can_delete_message(mod_user)}")
    print()

exit()
```

---

## 🗑️ Remove Moderator Role

```bash
python manage.py shell
```

```python
from django.contrib.auth import get_user_model
from users.moderator_models import ModeratorPermissionHelper

User = get_user_model()
user = User.objects.get(username='john_doe')

# Remove role
ModeratorPermissionHelper.remove_moderator_role(user)

# Verify
user.refresh_from_db()
print(f"✓ User role: {user.role}")
print(f"✓ Is active moderator: {user.moderator_profile.is_active_moderator}")

exit()
```

---

## 📋 Database Queries

```bash
python manage.py dbshell
```

```sql
-- List all moderators
SELECT u.username, mr.name, mp.is_active_moderator 
FROM moderator_profiles mp
JOIN users u ON mp.user_id = u.id
JOIN moderator_roles mr ON mp.role_id = mr.id;

-- List recent moderation actions
SELECT u.username, ma.action_type, ma.reason, ma.created_at
FROM moderation_actions ma
JOIN users u ON ma.moderator_id = u.id
ORDER BY ma.created_at DESC LIMIT 10;

-- Moderator statistics
SELECT u.username, mp.warnings_issued, mp.suspensions_issued, mp.bans_issued
FROM moderator_profiles mp
JOIN users u ON mp.user_id = u.id
ORDER BY (mp.warnings_issued + mp.suspensions_issued + mp.bans_issued) DESC;
```

---

## 🐛 Troubleshooting

### Check if user exists
```bash
python manage.py shell
```
```python
from django.contrib.auth import get_user_model
User = get_user_model()
print([u.username for u in User.objects.all()])
exit()
```

### Check moderator profile
```bash
python manage.py shell
```
```python
from django.contrib.auth import get_user_model
User = get_user_model()
user = User.objects.get(username='john_doe')
print(f"Role: {user.role}")
print(f"Has profile: {hasattr(user, 'moderator_profile')}")
if hasattr(user, 'moderator_profile'):
    print(f"Profile role: {user.moderator_profile.role}")
exit()
```

### Check permissions
```bash
python manage.py shell
```
```python
from django.contrib.auth import get_user_model
User = get_user_model()
user = User.objects.get(username='john_doe')
if hasattr(user, 'moderator_profile'):
    perms = user.moderator_profile.get_permissions()
    print(f"Permissions: {perms}")
exit()
```

---

## 📝 Summary

| Task | Command |
|------|---------|
| Assign junior mod | `python manage.py assign_moderator username junior` |
| Assign senior mod | `python manage.py assign_moderator username senior` |
| Assign lead mod | `python manage.py assign_moderator username lead` |
| Run all tests | `python manage.py test users.tests -v 2` |
| Check moderators | `python manage.py shell` then list query |
| Remove moderator | `python manage.py shell` then remove function |

---

**Everything is ready to use! Start with the assignment command above.**
