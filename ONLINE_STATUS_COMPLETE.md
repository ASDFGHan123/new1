# User Online Status Tracking - Complete Implementation

## Overview
Complete automatic user online status tracking system that updates user presence on every request and provides APIs for real-time status monitoring.

## How It Works

### 1. Automatic Status Updates (Middleware)
**File**: `users/middleware.py` - `UserPresenceMiddleware`

On every authenticated request:
- Sets `online_status = 'online'`
- Updates `last_seen` timestamp to current time
- Saves only these two fields (optimized)

This ensures any active user is always marked as online.

### 2. Login/Logout Handling
**File**: `users/auth_views.py`

- **Login**: Sets `online_status = 'online'` immediately
- **Logout**: Sets `online_status = 'offline'` immediately

### 3. Heartbeat Endpoint
**Endpoint**: `POST /api/users/heartbeat/`
**File**: `users/views/user_management_views.py` - `user_heartbeat_view`

For frontend to send periodic heartbeats:
```javascript
// Send heartbeat every 30 seconds
setInterval(() => {
  fetch('/api/users/heartbeat/', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
}, 30000);
```

Response:
```json
{
  "message": "Heartbeat recorded",
  "online_status": "online",
  "last_seen": "2024-01-15T10:30:00Z"
}
```

## API Endpoints

### 1. Set User Online Status
**POST** `/api/users/admin/users/<user_id>/set-online-status/`
```json
{ "status": "online" }  // or "away", "offline"
```

### 2. Get User Online Status
**GET** `/api/users/admin/users/<user_id>/online-status/`

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

### 3. Get All Online Users
**GET** `/api/users/admin/users/online/?page=1&per_page=50`

Response:
```json
{
  "online_users": [...],
  "online_count": 15,
  "pagination": {...}
}
```

### 4. User Heartbeat
**POST** `/api/users/heartbeat/`

Keeps current user online and updates last_seen.

## Database Fields

User model includes:
- `online_status`: CharField('online', 'away', 'offline') - Current status
- `last_seen`: DateTimeField - Last activity timestamp

Database indexes on both fields for fast queries.

## User Model Methods

```python
user.set_online()           # Set online and update last_seen
user.set_away()             # Set away status
user.set_offline()          # Set offline and update last_seen
user.update_last_seen()     # Update last_seen timestamp
user.is_online              # Property: returns True if online
```

## Frontend Integration

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
  });
}, 30000);
```

### 3. Set Offline on Logout
```javascript
// On logout
await fetch('/api/users/logout/', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({ refresh: refreshToken })
});
```

### 4. Get Online Users List
```javascript
const response = await fetch('/api/users/admin/users/online/');
const data = await response.json();
console.log(`${data.online_count} users online`);
```

## Why Ahmad Shows Offline

**Before this implementation:**
- User status was only updated on login/logout
- No automatic updates during active sessions
- No heartbeat mechanism

**After this implementation:**
- Middleware updates status on every request
- Heartbeat endpoint for periodic updates
- Automatic logout sets offline status
- Frontend should send heartbeats every 30 seconds

## Configuration

The middleware is already configured in `offchat_backend/settings/base.py`:
```python
MIDDLEWARE = [
    ...
    'users.middleware.UserPresenceMiddleware',
    ...
]
```

## Performance Optimization

- Only updates `online_status` and `last_seen` fields (not full user save)
- Database indexes on both fields
- Efficient queries for online users list
- Minimal database overhead

## Testing

```bash
# Check online users
curl -H "Authorization: Bearer <token>" http://localhost:8000/api/users/admin/users/online/

# Send heartbeat
curl -X POST -H "Authorization: Bearer <token>" http://localhost:8000/api/users/heartbeat/

# Get specific user status
curl -H "Authorization: Bearer <token>" http://localhost:8000/api/users/admin/users/1/online-status/
```

## Summary

The system now:
1. ✅ Automatically sets users online on every request (middleware)
2. ✅ Updates last_seen timestamp on every request
3. ✅ Sets offline on logout
4. ✅ Provides heartbeat endpoint for frontend
5. ✅ Provides APIs to check online status
6. ✅ Lists all online users
7. ✅ Optimized with database indexes
