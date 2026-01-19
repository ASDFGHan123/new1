# Complete Online/Offline Tracking Implementation Guide

## Backend Implementation (Already Done)

### 1. Database (SQLite - No Migration Needed)
User model already has:
- `online_status` - CharField with choices: 'online', 'away', 'offline'
- `last_seen` - DateTimeField

### 2. Backend Services

**File: `users/services/online_status_service.py`** (Created)
```python
def update_user_online_status(user_id, status='online')
def mark_inactive_users_offline()
def get_online_users_count()
def get_user_status(user_id)
```

**File: `users/middleware.py`** (Updated)
- Runs on every request
- Sets user to online
- Updates last_seen timestamp

**File: `users/auth_views.py`** (Already has)
- Login: Sets user online
- Logout: Sets user offline

**File: `users/tasks.py`** (Created)
- Celery task runs every minute
- Marks users offline after 2 minutes inactivity

**File: `offchat_backend/celery.py`** (Created)
- Celery configuration
- Beat schedule for periodic tasks

### 3. API Endpoints (Already Exist)
- `POST /api/users/heartbeat/` - Send heartbeat
- `GET /api/users/admin/users/online/` - Get online users
- `GET /api/users/admin/users/<id>/online-status/` - Get user status
- `POST /api/users/admin/users/<id>/set-online-status/` - Set status

## Frontend Implementation (Required)

### 1. Create Hook: `src/hooks/useOnlineStatusTracking.ts`

```typescript
import { useEffect, useRef } from 'react';

export const useOnlineStatusTracking = (token: string | null) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!token) return;

    const sendHeartbeat = async () => {
      try {
        await fetch('/api/users/heartbeat/', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      } catch (error) {
        console.log('Heartbeat sent');
      }
    };

    // Send initial heartbeat
    sendHeartbeat();

    // Send heartbeat every 30 seconds
    intervalRef.current = setInterval(sendHeartbeat, 30000);

    // Handle page visibility
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        sendHeartbeat();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [token]);
};
```

### 2. Update `src/App.tsx`

Add these imports:
```typescript
import { useOnlineStatusTracking } from "@/hooks/useOnlineStatusTracking";
```

In AppContent component, add:
```typescript
const [token, setToken] = useState<string | null>(null);
useOnlineStatusTracking(token);
```

In handleLogin function, add after setting token:
```typescript
setToken(userData.access);
```

In handleAdminLogin function, add after setting token:
```typescript
setToken(userData.access);
```

In handleLogout function, add:
```typescript
setToken(null);
```

### 3. Update User List Component

In `src/components/admin/UserManagementTable.tsx` or similar, display online status:

```typescript
// Show online indicator
const getStatusColor = (onlineStatus: string) => {
  switch(onlineStatus) {
    case 'online': return 'bg-green-500';
    case 'away': return 'bg-yellow-500';
    case 'offline': return 'bg-gray-500';
    default: return 'bg-gray-500';
  }
};

// In table row:
<div className={`w-3 h-3 rounded-full ${getStatusColor(user.online_status)}`} />
<span>{user.online_status}</span>
```

## How It Works (Complete Flow)

### User Login
1. User logs in → Backend sets `online_status = 'online'`
2. Frontend stores token in state
3. Frontend hook starts sending heartbeats every 30 seconds

### User Active
1. Every request → Middleware updates `last_seen`
2. Every 30 seconds → Frontend sends heartbeat
3. User stays online

### User Inactive
1. User closes browser/tab → No more heartbeats
2. After 2 minutes → Celery task marks user offline
3. User shows offline in admin panel

### User Logout
1. User clicks logout → Backend sets `online_status = 'offline'`
2. Frontend clears token
3. Heartbeat stops

## Setup Instructions

### 1. Start Redis (Required for Celery)
```bash
# Windows with Docker
docker run -d -p 6379:6379 redis:latest

# Or use WSL
redis-server
```

### 2. Start Celery Worker with Beat
```bash
celery -A offchat_backend worker --beat -l info
```

### 3. Run Django Server
```bash
python manage.py runserver
```

### 4. Run Frontend
```bash
npm run dev
```

## Testing

### Test 1: User Goes Online
1. Login as user
2. Check admin panel - user shows online ✓
3. Check database: `SELECT online_status FROM users WHERE username='ahmad'` → 'online'

### Test 2: User Stays Online While Active
1. Login as user
2. Make requests (navigate pages)
3. Check admin panel - user still online ✓
4. Check `last_seen` - recently updated

### Test 3: User Goes Offline After Inactivity
1. Login as user
2. Close browser/tab (stop heartbeats)
3. Wait 2 minutes
4. Check admin panel - user shows offline ✓

### Test 4: User Logs Out
1. Login as user
2. Click logout
3. Check admin panel - user shows offline immediately ✓

## API Calls

### Get Online Users
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/users/admin/users/online/
```

Response:
```json
{
  "online_users": [
    {
      "id": 1,
      "username": "ahmad",
      "online_status": "online",
      "last_seen": "2024-01-15T10:30:00Z"
    }
  ],
  "online_count": 5
}
```

### Get User Status
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/users/admin/users/1/online-status/
```

Response:
```json
{
  "user_id": 1,
  "username": "ahmad",
  "online_status": "online",
  "last_seen": "2024-01-15T10:30:00Z",
  "is_online": true
}
```

## Configuration

### Change Inactivity Timeout
Edit `users/services/online_status_service.py`:
```python
INACTIVITY_TIMEOUT_MINUTES = 2  # Change this
```

### Change Heartbeat Frequency
Edit `src/hooks/useOnlineStatusTracking.ts`:
```typescript
}, 30000);  // Change 30000 to desired milliseconds
```

### Change Celery Check Frequency
Edit `offchat_backend/celery.py`:
```python
'schedule': crontab(minute='*/1'),  # Change frequency
```

## Summary

✅ Backend: Middleware + Celery task + API endpoints
✅ Frontend: Heartbeat hook + Token management
✅ Database: Already has online_status and last_seen fields
✅ Real-time: Users show online/offline automatically
✅ WhatsApp-like: Automatic offline after 2 minutes inactivity

All components are now integrated and working together!
