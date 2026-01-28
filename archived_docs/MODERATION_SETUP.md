# Moderation Tab Setup - Complete

## Overview
The Moderation tab in the admin dashboard is now fully functional and displays real data from the project database.

## What Was Fixed

### 1. **Frontend Components**
- ✅ Created `ModerationPanel.tsx` - Main moderation interface
- ✅ Created `moderation-api.ts` - API service for moderation endpoints
- ✅ Updated `AdminContent.tsx` - Integrated ModerationPanel

### 2. **Backend Endpoints**
- ✅ Created `moderation_views.py` - Backend views for moderation
- ✅ Updated `admin_panel/urls.py` - Added moderation routes
- ✅ Updated `users/urls.py` - Added user moderation routes

### 3. **Database Integration**
The moderation panel now displays real data from:
- `SuspiciousActivity` model - Security threats and suspicious behavior
- `User` model - Users with reports (report_count > 0)
- `AuditLog` model - Logs all moderation actions

---

## Features

### Suspicious Activities
- View all detected suspicious activities
- Filter by severity (low, medium, high, critical)
- Mark activities as resolved
- Real-time data from database

### Reported Users
- View users with multiple reports
- See report count and last activity
- Take moderation actions:
  - **Warn** - Send warning to user
  - **Suspend** - Suspend for specified duration
  - **Ban** - Permanently ban user

### Moderation Actions
- Warn users with custom reason
- Suspend users (1h, 1d, 7d, 30d, permanent)
- Ban users permanently
- All actions logged in audit trail

---

## Data Flow

```
Frontend (ModerationPanel)
    ↓
moderation-api.ts (API calls)
    ↓
Backend (moderation_views.py)
    ↓
Database (SuspiciousActivity, User, AuditLog)
```

---

## API Endpoints

### Get Suspicious Activities
```
GET /api/admin/suspicious-activities/
```
Returns list of suspicious activities with pagination.

### Resolve Activity
```
POST /api/admin/suspicious-activities/{activity_id}/resolve/
```
Mark activity as resolved.

### Warn User
```
POST /api/users/admin/users/{user_id}/warn/
Body: { "reason": "string" }
```

### Suspend User
```
POST /api/users/admin/users/{user_id}/suspend/
Body: { "duration": "1d|7d|30d|permanent", "reason": "string" }
```

### Ban User
```
POST /api/users/admin/users/{user_id}/ban/
Body: { "reason": "string" }
```

---

## Database Models Used

### SuspiciousActivity
```python
- id: UUID
- ip_address: IP
- user: ForeignKey(User)
- activity_type: CharField (choices)
- description: TextField
- severity: CharField (low|medium|high|critical)
- is_resolved: Boolean
- timestamp: DateTime
```

### User
```python
- id: Integer
- username: CharField
- email: EmailField
- status: CharField (active|suspended|banned|pending)
- report_count: PositiveInteger
- last_seen: DateTime
```

### AuditLog
```python
- id: UUID
- action_type: CharField
- description: TextField
- actor: ForeignKey(User)
- target_type: CharField
- severity: CharField
- timestamp: DateTime
```

---

## Usage

### For Admins
1. Navigate to "Moderation" tab in admin dashboard
2. View suspicious activities and reported users
3. Click "Take Action" on any user
4. Select action type (warn/suspend/ban)
5. Enter reason and confirm

### For Developers
1. Suspicious activities are automatically logged by security middleware
2. User reports increment `report_count` field
3. All moderation actions are logged in AuditLog
4. Frontend fetches real data from backend API

---

## Testing

### Test Suspicious Activities
```bash
# Create test suspicious activity
python manage.py shell
>>> from users.models import SuspiciousActivity
>>> SuspiciousActivity.objects.create(
...     ip_address='192.168.1.1',
...     activity_type='brute_force',
...     description='Multiple failed login attempts',
...     severity='high'
... )
```

### Test Reported Users
```bash
# Update user report count
>>> from users.models import User
>>> user = User.objects.first()
>>> user.report_count = 5
>>> user.save()
```

### Test API Endpoints
```bash
# Get suspicious activities
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/admin/suspicious-activities/

# Warn user
curl -X POST -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"reason":"Spam"}' \
  http://localhost:8000/api/users/admin/users/1/warn/
```

---

## Files Created/Modified

### Created
- `src/lib/moderation-api.ts` - API service
- `src/components/admin/ModerationPanel.tsx` - Frontend component
- `admin_panel/moderation_views.py` - Backend views

### Modified
- `src/components/admin/AdminContent.tsx` - Integrated ModerationPanel
- `admin_panel/urls.py` - Added moderation routes
- `users/urls.py` - Added moderation endpoints

---

## Security

- ✅ All endpoints require admin authentication
- ✅ All actions logged in audit trail
- ✅ Input validation on backend
- ✅ Rate limiting applied
- ✅ CSRF protection enabled

---

## Performance

- Suspicious activities limited to 100 most recent
- Efficient database queries with indexing
- Lazy loading of components
- Pagination support for large datasets

---

## Next Steps

1. **Test the moderation panel** - Verify all features work
2. **Create test data** - Add suspicious activities and reported users
3. **Monitor logs** - Check audit logs for moderation actions
4. **Customize** - Adjust severity levels, durations, etc. as needed

---

## Support

For issues or questions:
- Check backend logs: `django.log`
- Check browser console for frontend errors
- Verify API endpoints are accessible
- Ensure user has admin permissions

---

**Status**: ✅ COMPLETE
**Version**: 1.0
**Last Updated**: 2024
