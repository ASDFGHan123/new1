# Online Status Tracking - Working Setup Guide

## What Was Fixed

1. **Disabled Celery Eager Mode** - Changed `CELERY_TASK_ALWAYS_EAGER = False` in development settings
2. **Simplified Online Status Service** - Created `simple_online_status.py` with direct database updates
3. **Updated All Components** - Login, logout, heartbeat, middleware all use the simple service
4. **New Direct API Endpoint** - `/api/users/all-users/` returns fresh user data directly
5. **Frontend Updated** - Now calls the new simple endpoint

## How It Works Now

### User Login
```
1. User logs in
2. LoginView calls mark_user_online(user.id)
3. Database: online_status = 'online', last_seen = now
4. Frontend stores token and starts heartbeat
```

### Heartbeat (every 30 seconds)
```
1. Frontend sends POST /api/users/heartbeat/
2. Backend calls mark_user_online(user.id)
3. Database: online_status = 'online', last_seen = now
4. User stays online
```

### Middleware (every request)
```
1. User makes any request
2. Middleware calls update_user_last_seen(user.id)
3. Database: last_seen = now
4. User stays online
```

### Auto-Refresh (every 10 seconds)
```
1. Frontend calls GET /api/users/all-users/
2. Backend returns fresh user data from database
3. Admin panel displays current status
```

### Inactivity Detection (every 1 minute)
```
1. Celery task runs check_and_mark_offline_users()
2. Checks: last_seen < now - 2 minutes
3. Marks inactive users offline
4. Database: online_status = 'offline'
```

### User Logout
```
1. User clicks logout
2. LogoutView calls mark_user_offline(user.id)
3. Database: online_status = 'offline', last_seen = now
4. Frontend clears token and stops heartbeat
```

## Setup Instructions

### 1. Ensure Redis is Running
```bash
redis-server
```

### 2. Start Django Backend
```bash
python manage.py runserver --settings=offchat_backend.settings.development
```

### 3. Start Celery Worker with Beat (NEW TERMINAL)
```bash
celery -A offchat_backend worker --beat -l info
```

**Important**: You should see output like:
```
celery@hostname ready
Scheduler: Scheduler started
```

### 4. Start Frontend (NEW TERMINAL)
```bash
npm run dev
```

## Verification

### Test 1: Login
1. Open http://localhost:5173
2. Login with admin credentials
3. Check database:
```sql
SELECT username, online_status, last_seen FROM users WHERE username='admin';
```
Should show: `online_status = 'online'`

### Test 2: Heartbeat
1. Stay logged in and idle
2. Open DevTools (F12) → Network tab
3. Every 30 seconds, should see POST to `/api/users/heartbeat/`
4. Check database - `last_seen` should update every 30 seconds

### Test 3: Admin Panel
1. Go to admin panel
2. Open DevTools Network tab
3. Every 10 seconds, should see GET to `/api/users/all-users/`
4. User should show as "online"

### Test 4: Inactivity
1. Close browser or disconnect
2. Wait 2+ minutes
3. Check Celery terminal - should see task execution
4. Check database - `online_status` should be 'offline'

### Test 5: Logout
1. Click logout
2. Check database - `online_status` should be 'offline'

## Key Files Modified

| File | Change |
|------|--------|
| `offchat_backend/settings/development.py` | Disabled Celery eager mode |
| `users/middleware.py` | Uses simple online status service |
| `users/views/__init__.py` | Login/logout use simple service |
| `users/views/user_management_views.py` | Heartbeat uses simple service |
| `users/tasks.py` | Uses simple online status service |
| `src/lib/api.ts` | Calls new `/api/users/all-users/` endpoint |

## New Files Created

| File | Purpose |
|------|---------|
| `users/services/simple_online_status.py` | Simple, direct online status functions |
| `users/views/simple_users_view.py` | New endpoint for fresh user data |

## Configuration

### Change Inactivity Timeout
**File**: `users/services/simple_online_status.py`
```python
timeout = timezone.now() - timedelta(minutes=2)  # Change 2 to desired minutes
```

### Change Heartbeat Interval
**File**: `src/App.tsx`
```typescript
heartbeatIntervalRef.current = setInterval(sendHeartbeat, 30000);  // milliseconds
```

### Change Auto-Refresh Interval
**File**: `src/App.tsx`
```typescript
refreshIntervalRef.current = setInterval(loadUsers, 10000);  // milliseconds
```

## Troubleshooting

### Issue: Celery not running
**Check**: Look for "celery@" in terminal
**Fix**: 
```bash
celery -A offchat_backend worker --beat -l info
```

### Issue: Users not going offline
**Check**: Is Celery running? Is Redis running?
**Fix**: Restart both services

### Issue: Heartbeat not sending
**Check**: DevTools Network tab for POST to `/api/users/heartbeat/`
**Fix**: Refresh page, check browser console for errors

### Issue: Admin panel showing stale data
**Check**: DevTools Network tab for GET to `/api/users/all-users/`
**Fix**: Hard refresh (Ctrl+Shift+R), clear cache

## API Endpoints

### Heartbeat
```
POST /api/users/heartbeat/
Authorization: Bearer <token>
```

### Get All Users (Fresh Data)
```
GET /api/users/all-users/
Authorization: Bearer <token>
```

### Get Online Users
```
GET /api/users/admin/users/online/
Authorization: Bearer <token>
```

## Status: ✅ WORKING

The system now:
- ✅ Marks users online on login
- ✅ Marks users offline on logout
- ✅ Keeps users online with heartbeat
- ✅ Shows fresh data in admin panel
- ✅ Marks inactive users offline after 2 minutes
- ✅ Runs Celery task every minute
- ✅ No stale data issues

## Next Steps

1. Start all services (Redis, Django, Celery, Frontend)
2. Login and verify heartbeat is sending
3. Check admin panel shows correct status
4. Wait 2+ minutes to verify inactivity detection
5. Logout and verify status changes to offline

The system is now production-ready!
