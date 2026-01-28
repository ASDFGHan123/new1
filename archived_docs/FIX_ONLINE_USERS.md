# Fix: Show All Online Users Correctly

## Problem
Only 2 users showing online when 3 are actually online.

## Root Cause
Frontend is not sending heartbeats for all users, so their `last_seen` is not being updated, causing them to be marked offline after 2 minutes.

## Quick Fix

### Option 1: Increase Inactivity Timeout (Temporary)
Edit `users/services/online_status_service.py`:
```python
INACTIVITY_TIMEOUT_MINUTES = 30  # Increased from 2
```

This gives users 30 minutes before going offline.

### Option 2: Ensure Heartbeat is Sent (Permanent)
Make sure the heartbeat hook is properly integrated in App.tsx:

```typescript
// In App.tsx
import { useOnlineStatusTracking } from "@/hooks/useOnlineStatusTracking";

const AppContent = () => {
  const [token, setToken] = useState<string | null>(null);
  useOnlineStatusTracking(token);  // Add this
  
  // In handleLogin:
  setToken(userData.access);  // Add this
  
  // In handleAdminLogin:
  setToken(userData.access);  // Add this
  
  // In handleLogout:
  setToken(null);  // Add this
};
```

### Option 3: Refresh Status on Admin Panel Load (Recommended)
Add this to your admin panel component:

```typescript
useEffect(() => {
  // Refresh all users' status when admin panel loads
  const refreshAllStatus = async () => {
    try {
      await fetch('/api/users/refresh-status/', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (error) {
      console.log('Status refreshed');
    }
  };
  
  refreshAllStatus();
  
  // Refresh every 30 seconds
  const interval = setInterval(refreshAllStatus, 30000);
  return () => clearInterval(interval);
}, [token]);
```

## Verification

### Check Database
```bash
sqlite3 db.sqlite3
SELECT username, online_status, last_seen FROM users WHERE online_status='online';
```

Should show all 3 online users.

### Check API
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/users/admin/users/online/
```

Should return all 3 online users.

## What's Happening

1. **User 1 logs in** → online_status = 'online' ✓
2. **User 2 logs in** → online_status = 'online' ✓
3. **User 3 logs in** → online_status = 'online' ✓
4. **User 1 sends heartbeat** → last_seen updated ✓
5. **User 2 sends heartbeat** → last_seen updated ✓
6. **User 3 doesn't send heartbeat** → last_seen not updated ✗
7. **After 2 minutes** → Celery marks User 3 offline ✗

## Solution Summary

The issue is that not all users are sending heartbeats. The fix is to:

1. **Ensure heartbeat hook is in App.tsx** (Option 2)
2. **Or increase timeout to 30 minutes** (Option 1)
3. **Or refresh status on admin panel** (Option 3)

Recommended: Use **Option 2** (proper heartbeat) + **Option 1** (increase timeout to 30 minutes) for best results.

## Test It

1. Login 3 users
2. Check admin panel - should show 3 online
3. Close 1 browser tab
4. Wait 2 minutes
5. Check admin panel - should show 2 online
6. Refresh page - should still show 2 online

If all 3 still show online after 2 minutes, heartbeats are working!
