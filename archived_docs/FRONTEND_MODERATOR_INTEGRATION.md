# Frontend Moderator Assignment - Integration Guide

## 🚀 Quick Integration (5 minutes)

### Step 1: Add URL Configuration

**File: `offchat_backend/urls.py`**

Add this to your main URL configuration:

```python
from django.urls import path, include

urlpatterns = [
    # ... existing patterns
    path('api/admin/', include('admin_panel.moderator_urls')),
]
```

### Step 2: Use Component in Admin Dashboard

**File: `src/pages/AdminDashboard.tsx`**

```typescript
import ModeratorAssignmentPanel from '@/components/admin/ModeratorAssignmentPanel';

export function AdminDashboard() {
  return (
    <div>
      {/* ... other components */}
      <ModeratorAssignmentPanel />
    </div>
  );
}
```

### Step 3: Add to Navigation

**File: `src/components/admin/AdminNavigation.tsx`**

```typescript
<nav>
  <Link to="/admin/moderators">Moderators</Link>
</nav>
```

---

## 📋 API Endpoints

### Assign Moderator
```
POST /api/admin/moderators/assign_moderator/
{
    "user_id": "uuid",
    "role_type": "junior"  // or "senior", "lead"
}

Response:
{
    "success": true,
    "message": "User assigned as junior moderator",
    "moderator": { ... }
}
```

### Remove Moderator
```
POST /api/admin/moderators/remove_moderator/
{
    "user_id": "uuid"
}

Response:
{
    "success": true,
    "message": "Moderator role removed"
}
```

### List Moderators
```
GET /api/admin/moderators/list_moderators/

Response: [
    {
        "id": 1,
        "user": "john_doe",
        "role": { "name": "Junior Moderator", ... },
        "warnings_issued": 5,
        "suspensions_issued": 2,
        "bans_issued": 0,
        ...
    }
]
```

### Moderator Statistics
```
GET /api/admin/moderators/moderator_stats/

Response:
{
    "total_moderators": 5,
    "junior": 2,
    "senior": 2,
    "lead": 1,
    "total_warnings": 15,
    "total_suspensions": 8,
    "total_bans": 2
}
```

---

## 🎨 Component Features

### ModeratorAssignmentPanel Component

**Features:**
- Select user from dropdown
- Choose role type (junior, senior, lead)
- View permissions for each role
- Assign moderator with one click
- List all current moderators
- Remove moderator role
- Real-time updates
- Error handling with toast notifications

**Props:** None (uses API directly)

**Usage:**
```typescript
import ModeratorAssignmentPanel from '@/components/admin/ModeratorAssignmentPanel';

export function MyAdminPage() {
  return <ModeratorAssignmentPanel />;
}
```

---

## 🔧 Customization

### Change Component Styling

```typescript
// Modify className in ModeratorAssignmentPanel.tsx
<div className="bg-white p-6 rounded-lg shadow">
  {/* Your custom styling */}
</div>
```

### Add More Role Types

```typescript
// In ModeratorAssignmentPanel.tsx
<select value={roleType} onChange={(e) => setRoleType(e.target.value)}>
  <option value="junior">Junior Moderator</option>
  <option value="senior">Senior Moderator</option>
  <option value="lead">Lead Moderator</option>
  <option value="custom">Custom Role</option>
</select>
```

### Add Bulk Assignment

```typescript
const handleBulkAssign = async (userIds: string[], roleType: string) => {
  for (const userId of userIds) {
    await api.post('/api/admin/moderators/assign_moderator/', {
      user_id: userId,
      role_type: roleType
    });
  }
  fetchModerators();
};
```

---

## 📱 Mobile Responsive Version

```typescript
export function ModeratorAssignmentPanelMobile() {
  return (
    <div className="space-y-4 p-4">
      {/* Responsive layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          {/* Assign section */}
        </div>
        <div>
          {/* Moderators list */}
        </div>
      </div>
    </div>
  );
}
```

---

## 🧪 Testing the Frontend

### Test Assignment

1. Go to Admin Dashboard
2. Navigate to Moderators section
3. Select a user from dropdown
4. Choose role type
5. Click "Assign Moderator"
6. Verify success message
7. Check moderator appears in list

### Test Removal

1. Click "Remove" on any moderator
2. Confirm removal
3. Verify moderator removed from list

### Test API Directly

```bash
# Assign moderator
curl -X POST http://localhost:8000/api/admin/moderators/assign_moderator/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user-uuid",
    "role_type": "junior"
  }'

# List moderators
curl -X GET http://localhost:8000/api/admin/moderators/list_moderators/ \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get stats
curl -X GET http://localhost:8000/api/admin/moderators/moderator_stats/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🔐 Permissions

- Only admins can access moderator management
- Component checks user role automatically
- API enforces admin-only access

---

## 📊 Component State Management

```typescript
const [users, setUsers] = useState([]);           // All users
const [moderators, setModerators] = useState([]); // Current moderators
const [selectedUser, setSelectedUser] = useState(null); // Selected user
const [roleType, setRoleType] = useState('junior'); // Selected role
const [loading, setLoading] = useState(false);    // Loading state
```

---

## 🎯 Complete Integration Example

**File: `src/pages/AdminDashboard.tsx`**

```typescript
import React from 'react';
import ModeratorAssignmentPanel from '@/components/admin/ModeratorAssignmentPanel';

export function AdminDashboard() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Other admin panels */}
        <div>
          {/* User management */}
        </div>
        
        {/* Moderator assignment */}
        <div>
          <ModeratorAssignmentPanel />
        </div>
      </div>
    </div>
  );
}
```

---

## ✅ Verification Checklist

- [ ] URL configuration added
- [ ] Component imported in dashboard
- [ ] API endpoints working
- [ ] Can assign moderator from UI
- [ ] Can remove moderator from UI
- [ ] Moderators list updates
- [ ] Error messages display
- [ ] Success messages display
- [ ] Only admins can access
- [ ] Mobile responsive

---

## 🚀 Deployment

1. Ensure backend migrations are run
2. Ensure API endpoints are registered
3. Build frontend: `npm run build`
4. Deploy to production
5. Test moderator assignment in production

---

## 📞 Troubleshooting

### Component not showing
- Check if imported correctly
- Verify user is admin
- Check browser console for errors

### API returns 403
- Verify user is admin
- Check authentication token
- Verify API endpoint is registered

### Users not loading
- Check `/api/users/` endpoint
- Verify authentication
- Check network tab in browser

### Moderators not updating
- Check if API call succeeded
- Verify `fetchModerators()` is called
- Check browser console for errors

---

## 📚 Files Created

1. `admin_panel/moderator_management_views.py` - API endpoints
2. `admin_panel/moderator_urls.py` - URL configuration
3. `src/components/admin/ModeratorAssignmentPanel.tsx` - React component

---

**Status: ✅ READY TO USE**
