# User Online Status Tracking

## Overview
The system now tracks user online status in the user management module with comprehensive APIs for monitoring and updating user presence.

## Database Fields
The User model already includes:
- `online_status`: CharField with choices ('online', 'away', 'offline')
- `last_seen`: DateTimeField tracking the last activity timestamp

## Service Methods

### 1. Set User Online Status
```python
UserManagementService.set_user_online_status(user_id, status)
```
- Sets user online status to 'online', 'away', or 'offline'
- Updates `last_seen` timestamp when status changes
- Returns user status info

### 2. Get User Online Status
```python
UserManagementService.get_user_online_status(user_id)
```
- Retrieves current online status for a user
- Returns: user_id, username, online_status, last_seen, is_online

### 3. Get Online Users List
```python
UserManagementService.get_online_users(page=1, per_page=50)
```
- Retrieves paginated list of all online users
- Ordered by most recent last_seen
- Returns: online_users list, online_count, pagination info

## API Endpoints

### Set User Online Status
**POST** `/api/users/admin/users/<user_id>/set-online-status/`
```json
{
  "status": "online"  // or "away", "offline"
}
```
Response:
```json
{
  "message": "User online status updated to online",
  "user_id": 1,
  "online_status": "online",
  "last_seen": "2024-01-15T10:30:00Z"
}
```

### Get User Online Status
**GET** `/api/users/admin/users/<user_id>/online-status/`

Response:
```json
{
  "user_id": 1,
  "username": "john_doe",
  "online_status": "online",
  "last_seen": "2024-01-15T10:30:00Z",
  "is_online": true
}
```

### Get Online Users List
**GET** `/api/users/admin/users/online/?page=1&per_page=50`

Response:
```json
{
  "online_users": [
    {
      "id": 1,
      "username": "john_doe",
      "email": "john@example.com",
      "online_status": "online",
      "last_seen": "2024-01-15T10:30:00Z",
      "is_online": true,
      ...
    }
  ],
  "online_count": 15,
  "pagination": {
    "page": 1,
    "per_page": 50,
    "total_pages": 1,
    "total_count": 15,
    "has_next": false,
    "has_previous": false
  }
}
```

## User Model Methods

The User model provides convenience methods:
- `user.set_online()` - Set user as online and update last_seen
- `user.set_away()` - Set user as away
- `user.set_offline()` - Set user as offline and update last_seen
- `user.update_last_seen()` - Update last_seen timestamp
- `user.is_online` - Property to check if user is online

## Filtering in User List

The existing users list endpoint supports filtering by online_status:
**GET** `/api/users/management/list/?online_status=online`

## Integration Points

1. **User List View**: Already supports `online_status` filter parameter
2. **User Statistics**: Includes `online_users` count and `online_ratio` percentage
3. **User Serialization**: Includes `online_status` and `last_seen` in all user responses

## Usage Examples

### Frontend Integration
```javascript
// Get online users
const response = await fetch('/api/users/admin/users/online/');
const data = await response.json();

// Set user status
await fetch('/api/users/admin/users/1/set-online-status/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status: 'online' })
});

// Get specific user status
const status = await fetch('/api/users/admin/users/1/online-status/');
```

### Backend Integration
```python
from users.services.user_management_service import UserManagementService

# Set status
result = UserManagementService.set_user_online_status(user_id=1, status='online')

# Get status
status_info = UserManagementService.get_user_online_status(user_id=1)

# Get all online users
online_users = UserManagementService.get_online_users(page=1, per_page=50)
```

## Permissions
- `set_user_online_status_view`: Requires authentication
- `get_user_online_status_view`: Requires authentication
- `get_online_users_view`: Requires authentication

## Database Indexes
The User model includes indexes on:
- `online_status` - For fast filtering
- `last_seen` - For sorting by activity
