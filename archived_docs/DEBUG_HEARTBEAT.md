# Debug: Check if ahmad1 is Sending Heartbeats

## Quick Check via API

### 1. Check ahmad1's Heartbeat Status
```bash
curl -H "Authorization: Bearer <admin_token>" \
  http://localhost:8000/api/users/debug/heartbeat/ahmad1/
```

Response will show:
```json
{
  "username": "ahmad1",
  "online_status": "online",
  "last_seen": "2024-01-15T10:30:00Z",
  "time_since_last_seen_seconds": 5,
  "is_sending_heartbeats": true,
  "will_go_offline_in_seconds": 115,
  "debug_info": {
    "current_time": "2024-01-15T10:30:05Z",
    "last_seen": "2024-01-15T10:30:00Z",
    "status": "active",
    "is_active": true
  }
}
```

### 2. Interpret the Response

**If `is_sending_heartbeats: true`:**
- ✅ ahmad1 IS sending heartbeats
- `time_since_last_seen_seconds` < 60 means heartbeat sent within last minute
- User will stay online

**If `is_sending_heartbeats: false`:**
- ❌ ahmad1 is NOT sending heartbeats
- `time_since_last_seen_seconds` > 60 means no heartbeat in last minute
- User will go offline in `will_go_offline_in_seconds`

## Check via Database

```bash
sqlite3 db.sqlite3
SELECT username, online_status, last_seen, datetime('now') as current_time FROM users WHERE username='ahmad1';
```

Compare `last_seen` with `current_time`:
- If difference < 1 minute → Sending heartbeats ✅
- If difference > 1 minute → Not sending heartbeats ❌

## Check Browser Console

Open browser DevTools (F12) → Console tab

Add this code:
```javascript
// Check if heartbeat is being sent
setInterval(() => {
  fetch('/api/users/heartbeat/', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
  }).then(r => console.log('Heartbeat sent:', r.status))
    .catch(e => console.log('Heartbeat error:', e));
}, 30000);
```

Watch console - should see "Heartbeat sent: 200" every 30 seconds.

## Why ahmad1 Might Not Be Sending Heartbeats

### 1. **Heartbeat Hook Not in App.tsx**
- Check if `useOnlineStatusTracking` is imported
- Check if `useOnlineStatusTracking(token)` is called
- Check if `setToken(userData.access)` is set on login

### 2. **Token Not Being Set**
- Check if `token` state is being updated on login
- Check localStorage for `access_token`

### 3. **Browser Tab Closed**
- If ahmad1's browser tab is closed, no heartbeats sent
- User will go offline after 2 minutes

### 4. **Network Issues**
- Check browser Network tab
- Look for failed heartbeat requests
- Check if `/api/users/heartbeat/` returns 200

### 5. **Frontend Not Running**
- Check if React app is running
- Check if there are JavaScript errors

## Fix: Enable Heartbeats for ahmad1

### Option 1: Add Hook to App.tsx
```typescript
import { useOnlineStatusTracking } from "@/hooks/useOnlineStatusTracking";

const AppContent = () => {
  const [token, setToken] = useState<string | null>(null);
  useOnlineStatusTracking(token);  // Add this
  
  // In handleLogin:
  setToken(userData.access);  // Add this
};
```

### Option 2: Increase Timeout
Edit `users/services/online_status_service.py`:
```python
INACTIVITY_TIMEOUT_MINUTES = 30  # Increased from 2
```

### Option 3: Manual Refresh
```bash
curl -X POST -H "Authorization: Bearer <ahmad1_token>" \
  http://localhost:8000/api/users/refresh-status/
```

## Test It

1. **Login as ahmad1**
2. **Run debug check:**
   ```bash
   curl -H "Authorization: Bearer <admin_token>" \
     http://localhost:8000/api/users/debug/heartbeat/ahmad1/
   ```
3. **Check `is_sending_heartbeats`:**
   - If `true` → Heartbeats working ✅
   - If `false` → Heartbeats not working ❌
4. **Wait 30 seconds**
5. **Run debug check again**
6. **`time_since_last_seen_seconds` should be ~30**

If it's increasing (60, 90, 120...), ahmad1 is NOT sending heartbeats.

## Summary

Use this endpoint to debug:
```
GET /api/users/debug/heartbeat/<username>/
```

It will tell you:
- ✅ Is user sending heartbeats?
- ⏱️ How long since last heartbeat?
- ⏰ When will user go offline?
- 🔍 Current status and activity
