# Online/Offline Status Tracking - Quick Start Guide

## Prerequisites
- Python 3.9+
- Node.js 18+
- Redis (for Celery)
- PostgreSQL or SQLite (for development)

## Setup Instructions

### 1. Backend Setup

```bash
# Install Python dependencies
pip install -r requirements-dev.txt

# Run migrations
python manage.py migrate --settings=offchat_backend.settings.development

# Create superuser (if not exists)
python manage.py createsuperuser --settings=offchat_backend.settings.development
```

### 2. Start Redis (Required for Celery)

```bash
# On Windows (if using WSL or Docker)
redis-server

# Or using Docker
docker run -d -p 6379:6379 redis:latest
```

### 3. Start Django Backend

```bash
python manage.py runserver --settings=offchat_backend.settings.development
```

### 4. Start Celery Worker with Beat Scheduler

**In a new terminal:**

```bash
celery -A offchat_backend worker --beat -l info
```

This command:
- Starts Celery worker to process tasks
- Starts Beat scheduler to run periodic tasks
- Runs the `check_and_mark_offline_users` task every minute
- Logs at info level for visibility

### 5. Start Frontend

**In another new terminal:**

```bash
npm install
npm run dev
```

## Verification

### Check Backend is Running
- Open browser: http://localhost:8000/api/
- Should see Django REST Framework interface

### Check Frontend is Running
- Open browser: http://localhost:5173/
- Should see OffChat login page

### Check Celery is Running
- Look for output in Celery terminal showing:
  - "celery@<hostname> ready"
  - Periodic task schedule
  - Task execution logs

### Check Redis is Running
- Celery should connect without errors
- Look for "Connected to redis://" in Celery logs

## Testing the System

### Test 1: Login and Check Online Status

1. Login with admin credentials (admin / 12341234)
2. Open browser DevTools (F12)
3. Go to Network tab
4. Look for POST requests to `/api/users/heartbeat/` every 30 seconds
5. Go to admin panel
6. Your user should show as "online"

### Test 2: Check Heartbeat

1. Stay logged in and idle
2. Watch Network tab in DevTools
3. Every 30 seconds, you should see a POST to `/api/users/heartbeat/`
4. This keeps you online even without other activity

### Test 3: Check Inactivity Detection

1. Open browser DevTools
2. Go to Application > Storage > Local Storage
3. Find and delete the `access_token` (simulates logout)
4. Wait 2+ minutes
5. Check Celery logs - should see task execution
6. Check admin panel - your user should show as "offline"

### Test 4: Check Admin Panel Auto-Refresh

1. Login as admin
2. Open DevTools Network tab
3. Go to Users page
4. Every 10 seconds, you should see GET requests to `/api/users/admin/users/`
5. User statuses should update automatically

## Troubleshooting

### Celery Not Running
```
Error: Cannot connect to redis://localhost:6379/0
```
**Solution**: Start Redis first
```bash
redis-server
```

### Heartbeat Not Sending
**Check**:
1. Are you logged in? (Check localStorage for access_token)
2. Is frontend running? (Check console for errors)
3. Is backend running? (Check if requests reach backend)

**Solution**:
- Refresh page
- Check browser console for errors
- Check backend logs for 401 errors

### Users Not Going Offline
**Check**:
1. Is Celery running? (Look for "celery@" in terminal)
2. Is Beat scheduler running? (Look for "Scheduler" in logs)
3. Is Redis running? (Check Celery connection)

**Solution**:
```bash
# Restart Celery with beat
celery -A offchat_backend worker --beat -l info
```

### Admin Panel Showing Stale Data
**Check**:
1. Is auto-refresh working? (Look for GET requests every 10 seconds)
2. Is API returning fresh data? (Check response timestamps)

**Solution**:
- Hard refresh browser (Ctrl+Shift+R)
- Clear browser cache
- Check backend logs for errors

## Configuration

### Change Inactivity Timeout
**File**: `users/services/online_status_service.py`
```python
INACTIVITY_TIMEOUT_MINUTES = 2  # Change this value
```

### Change Heartbeat Interval
**File**: `src/App.tsx`
```typescript
heartbeatIntervalRef.current = setInterval(sendHeartbeat, 30000);  // Change 30000 to desired milliseconds
```

### Change Auto-Refresh Interval
**File**: `src/App.tsx`
```typescript
refreshIntervalRef.current = setInterval(loadUsers, 10000);  // Change 10000 to desired milliseconds
```

### Change Celery Task Schedule
**File**: `offchat_backend/celery.py`
```python
app.conf.beat_schedule = {
    'check-offline-users': {
        'task': 'users.tasks.check_and_mark_offline_users',
        'schedule': crontab(minute='*/1'),  # Change schedule here
    },
}
```

## API Endpoints

### Heartbeat
```
POST /api/users/heartbeat/
Authorization: Bearer <token>
```
Response:
```json
{
  "message": "Heartbeat recorded",
  "online_status": "online",
  "last_seen": "2024-01-15T10:30:45.123456Z"
}
```

### Get User Online Status
```
GET /api/users/admin/users/<user_id>/online-status/
Authorization: Bearer <token>
```

### Get All Online Users
```
GET /api/users/admin/users/online/
Authorization: Bearer <token>
```

### Get All Users (with status)
```
GET /api/users/admin/users/?per_page=1000
Authorization: Bearer <token>
```

## Logs to Monitor

### Backend Logs
- Look for "Heartbeat recorded" messages
- Look for "Marked X users offline" messages

### Celery Logs
- Look for "check_and_mark_offline_users" task execution
- Look for "Marked X users offline" messages

### Frontend Console
- Look for heartbeat POST requests
- Look for user list GET requests
- Look for any 401/403 errors

## Production Deployment

For production, ensure:
1. Redis is running on a dedicated server
2. Celery worker is running on a separate process/server
3. Beat scheduler is running (can be on same server as worker)
4. Database is PostgreSQL (not SQLite)
5. All environment variables are set correctly
6. CORS is configured properly
7. SSL/TLS is enabled

## Support

For issues or questions:
1. Check the ONLINE_STATUS_VERIFICATION.md file
2. Review logs in backend and Celery terminals
3. Check browser DevTools Network tab
4. Verify all services are running (Django, Celery, Redis)
