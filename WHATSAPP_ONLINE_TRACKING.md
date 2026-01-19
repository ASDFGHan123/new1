# Automatic Online/Offline Tracking - WhatsApp Style

## Overview
Complete automatic system that tracks ALL users' online/offline status in real-time, just like WhatsApp.

## How It Works

### 1. User Goes Online
- User logs in → `online_status = 'online'` (auth_views.py)
- User makes any request → Middleware updates `last_seen` timestamp (middleware.py)
- Frontend sends heartbeat every 30 seconds → Keeps `last_seen` updated

### 2. User Goes Offline - Automatic
**Celery Task** runs every minute:
- Checks all users with `online_status = 'online'`
- If `last_seen` is older than 5 minutes → Sets `online_status = 'offline'`
- No manual action needed!

### 3. User Logs Out
- User clicks logout → `online_status = 'offline'` immediately (auth_views.py)

## Files Created/Modified

### New Files
1. **users/services/offline_tracker.py** - Service to mark inactive users offline
2. **users/tasks.py** - Celery task for periodic checking
3. **offchat_backend/celery.py** - Celery configuration with beat schedule
4. **users/management/commands/check_offline_users.py** - Manual command

### Modified Files
1. **offchat_backend/settings/base.py** - Added Celery config
2. **offchat_backend/__init__.py** - Initialize Celery
3. **users/middleware.py** - Already updates last_seen on every request
4. **users/auth_views.py** - Already sets online/offline on login/logout

## Setup Instructions

### 1. Install Redis (Required for Celery)
```bash
# Windows - using WSL or Docker
docker run -d -p 6379:6379 redis:latest

# Or install Redis directly
```

### 2. Start Celery Worker
```bash
celery -A offchat_backend worker -l info
```

### 3. Start Celery Beat (Scheduler)
```bash
celery -A offchat_backend beat -l info
```

### 4. Or Run Both Together
```bash
celery -A offchat_backend worker --beat -l info
```

## How Users Appear Online/Offline

### Online Status Updates
1. **Login** → Immediately online
2. **Any API request** → Updates `last_seen` (middleware)
3. **Frontend heartbeat** → Keeps `last_seen` fresh (every 30 seconds)

### Offline Status Updates
1. **Logout** → Immediately offline
2. **Inactivity** → After 5 minutes without activity → Automatically offline
3. **Browser close** → After 5 minutes → Automatically offline

## Frontend Implementation

### 1. Send Heartbeat on App Load
```javascript
// On app initialization
fetch('/api/users/heartbeat/', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### 2. Send Periodic Heartbeats
```javascript
// Every 30 seconds
setInterval(() => {
  fetch('/api/users/heartbeat/', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  }).catch(err => console.log('Heartbeat sent'));
}, 30000);
```

### 3. Get Online Users List
```javascript
// Get all online users
const response = await fetch('/api/users/admin/users/online/');
const data = await response.json();
console.log(`${data.online_count} users online`);
data.online_users.forEach(user => {
  console.log(`${user.username}: ${user.online_status}`);
});
```

### 4. Get Specific User Status
```javascript
// Check if user is online
const response = await fetch('/api/users/admin/users/1/online-status/');
const data = await response.json();
console.log(`${data.username} is ${data.online_status}`);
```

## API Endpoints

### Get Online Users
**GET** `/api/users/admin/users/online/`
```json
{
  "online_users": [
    {
      "id": 1,
      "username": "ahmad",
      "online_status": "online",
      "last_seen": "2024-01-15T10:30:00Z",
      "is_online": true
    }
  ],
  "online_count": 5
}
```

### Get User Status
**GET** `/api/users/admin/users/<id>/online-status/`
```json
{
  "user_id": 1,
  "username": "ahmad",
  "online_status": "online",
  "last_seen": "2024-01-15T10:30:00Z",
  "is_online": true
}
```

### Send Heartbeat
**POST** `/api/users/heartbeat/`
```json
{
  "message": "Heartbeat recorded",
  "online_status": "online",
  "last_seen": "2024-01-15T10:30:00Z"
}
```

## Configuration

### Inactivity Timeout
Edit `users/services/offline_tracker.py`:
```python
INACTIVITY_TIMEOUT_MINUTES = 5  # Change this value
```

### Celery Beat Schedule
Edit `offchat_backend/celery.py`:
```python
'check-offline-users': {
    'task': 'users.tasks.check_and_mark_offline_users',
    'schedule': crontab(minute='*/1'),  # Run every minute
},
```

## Testing

### Manual Check
```bash
python manage.py check_offline_users
```

### View Online Users
```bash
curl -H "Authorization: Bearer <token>" http://localhost:8000/api/users/admin/users/online/
```

### Send Heartbeat
```bash
curl -X POST -H "Authorization: Bearer <token>" http://localhost:8000/api/users/heartbeat/
```

## Database Queries

### Find Online Users
```python
from users.models import User
online_users = User.objects.filter(online_status='online')
```

### Find Offline Users
```python
offline_users = User.objects.filter(online_status='offline')
```

### Find Inactive Users (not updated in 5 minutes)
```python
from django.utils import timezone
from datetime import timedelta

timeout = timezone.now() - timedelta(minutes=5)
inactive = User.objects.filter(
    online_status='online',
    last_seen__lt=timeout
)
```

## Summary

✅ **Automatic online tracking** - Middleware updates on every request
✅ **Automatic offline tracking** - Celery task checks every minute
✅ **Real-time status** - Frontend gets current status via API
✅ **WhatsApp-like behavior** - Users go offline after 5 minutes inactivity
✅ **No manual intervention** - Completely automatic
✅ **Scalable** - Uses Celery for background tasks
✅ **Efficient** - Only updates necessary fields

## Troubleshooting

### Users not going offline
- Check if Celery worker is running: `celery -A offchat_backend worker --beat -l info`
- Check if Redis is running: `redis-cli ping` (should return PONG)
- Check logs for errors

### Users showing offline when active
- Increase `INACTIVITY_TIMEOUT_MINUTES` in offline_tracker.py
- Ensure frontend is sending heartbeats every 30 seconds

### Celery not working
- Install Redis: `pip install redis`
- Start Redis server
- Start Celery worker with beat: `celery -A offchat_backend worker --beat -l info`
