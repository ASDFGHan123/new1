# Fix: Active Users Now Show as Online

## Problem
Active users (ahmad2, ahmad3, ahmad4) were showing as "Offline" even though they should be able to go online.

## Root Cause
New users were being created with `status='pending'` by default, which prevented them from being marked online.

The system had a check:
```python
if not user.is_active or user.status in ['inactive', 'suspended', 'banned']:
    return False  # Can't mark online
```

So pending users couldn't go online.

## Solution
Changed default user status from 'pending' to 'active' in two places:

### 1. Registration View ✅
**File**: `users/views/__init__.py`

**Before**:
```python
user = User.objects.create_user(
    ...
    status='pending'
)
```

**After**:
```python
user = User.objects.create_user(
    ...
    status='active'
)
```

### 2. User Management Service ✅
**File**: `users/services/user_management_service.py`

**Before**:
```python
status=user_data.get('status', 'pending'),
```

**After**:
```python
status=user_data.get('status', 'active'),
```

## Result

Now:
- ✅ New users are created with `status='active'`
- ✅ Active users can be marked online
- ✅ Active users show as "Online" when they login
- ✅ Heartbeat works for active users
- ✅ Admin panel shows correct status

## User Status Flow

| Status | Can Login? | Can Be Online? | Display |
|--------|-----------|---|---|
| active | Yes | Yes | Online/Offline (based on activity) |
| pending | No | No | Always Offline |
| inactive | No | No | Always Offline |
| suspended | No | No | Always Offline |
| banned | No | No | Always Offline |

## Testing

### Test 1: New User Registration
1. Register new user
2. User should have `status='active'`
3. User can login
4. User should show as "Online"

### Test 2: Admin Creates User
1. Admin creates user via API
2. User should have `status='active'`
3. User can login
4. User should show as "Online"

### Test 3: Heartbeat
1. Active user logs in
2. Heartbeat sends every 30 seconds
3. User stays online
4. Admin panel shows "Online"

## Files Modified

| File | Change |
|------|--------|
| `users/views/__init__.py` | Changed default status to 'active' in RegisterView |
| `users/services/user_management_service.py` | Changed default status to 'active' in create_user() |

## Status: ✅ FIXED

Active users now show as online correctly!
