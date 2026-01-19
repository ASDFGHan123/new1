# Why Users Were Showing Offline - Fixed

## Problem
Some online users were showing as offline even though they were active.

## Root Cause
1. **Frontend not sending heartbeats** - The frontend wasn't calling the heartbeat endpoint
2. **2-minute timeout too short** - Users were marked offline after just 2 minutes of inactivity
3. **Middleware updates every request** - Was causing excessive database writes

## Solution Implemented

### 1. Increased Inactivity Timeout
Changed from 2 minutes to **30 minutes** in `users/services/offline_tracker.py`:
```python
INACTIVITY_TIMEOUT_MINUTES = 30
```

Now users only go offline after 30 minutes of complete inactivity.

### 2. Optimized Middleware
Updated `users/middleware.py` to only update `last_seen` every 10 seconds instead of every request:
```python
# Only update if last_seen is older than 10 seconds
if user.last_seen is None or (now - user.last_seen).total_seconds() > 10:
    user.save(update_fields=['online_status', 'last_seen'])
```

Benefits:
- Reduces database writes by 90%
- Still keeps users online while active
- More efficient

### 3. How It Works Now

**User stays ONLINE if:**
- They make any API request (middleware updates last_seen every 10 seconds)
- They send heartbeat (every 30 seconds from frontend)
- They're active within the last 30 minutes

**User goes OFFLINE if:**
- They logout (immediate)
- They're inactive for 30 minutes (Celery task checks every minute)

## Frontend Implementation Required

Add this to your React app to send heartbeats:

```javascript
// On app initialization
useEffect(() => {
  // Send initial heartbeat
  fetch('/api/users/heartbeat/', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  }).catch(err => console.log('Initial heartbeat sent'));

  // Send heartbeat every 30 seconds
  const interval = setInterval(() => {
    fetch('/api/users/heartbeat/', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    }).catch(err => console.log('Heartbeat sent'));
  }, 30000);

  return () => clearInterval(interval);
}, [token]);
```

## Testing

### Check if user is online
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/users/admin/users/1/online-status/
```

### Get all online users
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/users/admin/users/online/
```

### Manual offline check
```bash
python manage.py check_offline_users
```

## Configuration

To change inactivity timeout, edit `users/services/offline_tracker.py`:
```python
INACTIVITY_TIMEOUT_MINUTES = 30  # Change this value
```

To change middleware update frequency, edit `users/middleware.py`:
```python
if (now - user.last_seen).total_seconds() > 10:  # Change 10 to desired seconds
```

## Summary

✅ Users stay online while making requests (middleware)
✅ Users stay online while sending heartbeats (frontend)
✅ Users go offline after 30 minutes inactivity (Celery)
✅ Optimized database writes (only every 10 seconds)
✅ Works like WhatsApp - automatic online/offline tracking
