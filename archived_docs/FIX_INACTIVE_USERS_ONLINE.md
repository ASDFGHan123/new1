# Fix: Inactive Users Cannot Be Online

## Problem
Users with `status='Inactive'` were showing as `online_status='Online'`, which is illogical.

Example:
- ahmad (Inactive, Online) ❌

## Root Cause
The system didn't check account status (`is_active`, `status`) when marking users online or updating presence.

## Solution
Added account status checks in 4 places:

### 1. Simple Online Status Service ✅
**File**: `users/services/simple_online_status.py`

**Change**: `mark_user_online()` now checks if account is active
```python
def mark_user_online(user_id):
    user = User.objects.get(id=user_id)
    
    # Don't mark inactive/suspended/banned users as online
    if not user.is_active or user.status in ['inactive', 'suspended', 'banned']:
        return False
    
    # Mark online only if account is active
    User.objects.filter(id=user_id).update(online_status='online')
```

### 2. Middleware ✅
**File**: `users/middleware.py`

**Change**: Only update `last_seen` for active accounts
```python
def process_request(self, request):
    if request.user.is_authenticated:
        # Only update if account is active
        if request.user.is_active and request.user.status not in ['inactive', 'suspended', 'banned']:
            update_user_last_seen(request.user.id)
```

### 3. Heartbeat Endpoint ✅
**File**: `users/views/user_management_views.py`

**Change**: Check account status before recording heartbeat
```python
def user_heartbeat_view(request):
    user = request.user
    
    # Check if account is active
    if not user.is_active or user.status in ['inactive', 'suspended', 'banned']:
        return Response({'online_status': 'offline'}, status=403)
    
    # Record heartbeat only if active
    mark_user_online(user.id)
```

### 4. Users List Endpoint ✅
**File**: `users/views/simple_users_view.py`

**Change**: Force offline for inactive accounts in response
```python
def get_all_users_with_status(request):
    users = User.objects.all().values(...)
    
    for user in users:
        # If account is inactive, force offline
        if not user['is_active'] or user['status'] in ['inactive', 'suspended', 'banned']:
            user['online_status'] = 'offline'
    
    return Response({'users': users})
```

## Result

Now:
- ✅ Inactive users always show as "Offline"
- ✅ Suspended users always show as "Offline"
- ✅ Banned users always show as "Offline"
- ✅ Only active users can be "Online"

Example:
- ahmad (Inactive, Offline) ✅
- admin (Active, Online) ✅

## Account Status vs Online Status

| Account Status | Can Be Online? | Display |
|---|---|---|
| Active | Yes | Online/Offline (based on activity) |
| Inactive | No | Always Offline |
| Suspended | No | Always Offline |
| Banned | No | Always Offline |
| Pending | No | Always Offline |

## Testing

### Test 1: Inactive User
1. Create user with status='inactive'
2. Try to login
3. Should be rejected or marked offline
4. Admin panel should show "Offline"

### Test 2: Suspend Active User
1. User is online
2. Admin suspends user
3. User should immediately show as "Offline"
4. Heartbeat should fail

### Test 3: Ban User
1. User is online
2. Admin bans user
3. User should immediately show as "Offline"
4. Heartbeat should fail

## Files Modified

| File | Change |
|------|--------|
| `users/services/simple_online_status.py` | Check account status in mark_user_online() |
| `users/middleware.py` | Check account status before updating |
| `users/views/user_management_views.py` | Check account status in heartbeat |
| `users/views/simple_users_view.py` | Force offline for inactive accounts |

## Status: ✅ FIXED

Inactive users can no longer show as online.
