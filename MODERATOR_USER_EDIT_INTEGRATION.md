# Moderator Assignment in User Edit Page

## 🎯 Integration (2 Steps)

### Step 1: Import Component

**File: `src/pages/UserManagement.tsx` or `src/components/admin/UserEditModal.tsx`**

```typescript
import ModeratorAssignment from '@/components/admin/ModeratorAssignment';
```

### Step 2: Add to User Edit Form

```typescript
<ModeratorAssignment 
  userId={user.id}
  currentRole={user.role}
  onUpdate={() => {
    // Refresh user data if needed
    fetchUser();
  }}
/>
```

---

## 📋 Component Props

```typescript
interface ModeratorAssignmentProps {
  userId: string;           // User ID to assign/manage
  currentRole: string;      // Current user role (admin/user/moderator)
  onUpdate?: () => void;    // Callback when role changes
}
```

---

## 🎨 Component Features

✅ **Assign Moderator**
- Select role type (junior, senior, lead)
- View permissions for each role
- One-click assignment

✅ **Manage Existing Moderator**
- View current role and stats
- Change role type
- Remove moderator role

✅ **Smart Display**
- Shows different UI for moderators vs non-moderators
- Prevents assigning to admins
- Shows moderator statistics

---

## 📱 Usage Examples

### In User Edit Modal

```typescript
export function UserEditModal({ user, onClose }) {
  return (
    <div className="space-y-6">
      {/* User basic info */}
      <div>
        <label>Username</label>
        <input value={user.username} />
      </div>

      {/* Moderator assignment */}
      <ModeratorAssignment 
        userId={user.id}
        currentRole={user.role}
        onUpdate={() => {
          // Refresh user
        }}
      />

      {/* Other fields */}
    </div>
  );
}
```

### In User Management Page

```typescript
export function UserManagementPage() {
  const [selectedUser, setSelectedUser] = useState(null);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Users list */}
      <div className="col-span-2">
        {/* User table */}
      </div>

      {/* User details */}
      {selectedUser && (
        <div className="bg-white p-4 rounded shadow">
          <h3>{selectedUser.username}</h3>
          
          <ModeratorAssignment 
            userId={selectedUser.id}
            currentRole={selectedUser.role}
            onUpdate={() => {
              // Refresh selected user
            }}
          />
        </div>
      )}
    </div>
  );
}
```

---

## 🎨 Component Preview

```
┌─────────────────────────────────────┐
│      Moderator Role                 │
├─────────────────────────────────────┤
│                                     │
│ Current Role: Junior Moderator      │
│ Warnings: 5                         │
│ Suspensions: 2                      │
│ Bans: 0                             │
│                                     │
│ Change Role:                        │
│ [Dropdown: Junior/Senior/Lead]      │
│                                     │
│ [Update Role] [Remove Role]         │
│                                     │
└─────────────────────────────────────┘
```

---

## 🔄 State Management

Component handles:
- Fetching moderator info
- Assigning moderator role
- Removing moderator role
- Updating role type
- Loading states
- Error handling

---

## 🧪 Testing

### Test Assignment
1. Open user edit page
2. Scroll to "Moderator Role" section
3. Select role type
4. Click "Assign Moderator"
5. See success message
6. Stats appear

### Test Update
1. Open moderator user
2. Change role type
3. Click "Update Role"
4. Role updates

### Test Removal
1. Open moderator user
2. Click "Remove Role"
3. Confirm removal
4. Role removed

---

## 🔐 Security

✅ Only admins can access user edit
✅ Cannot assign to other admins
✅ Backend permission checks
✅ All actions logged

---

## 📊 Complete Example

**File: `src/components/admin/UserEditForm.tsx`**

```typescript
import React, { useState, useEffect } from 'react';
import ModeratorAssignment from './ModeratorAssignment';
import { api } from '@/lib/api';

export function UserEditForm({ userId, onClose }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser();
  }, [userId]);

  const fetchUser = async () => {
    try {
      const response = await api.get(`/api/users/${userId}/`);
      setUser(response.data);
    } catch (error) {
      console.error('Failed to load user');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>User not found</div>;

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold">Edit User: {user.username}</h2>

      {/* Basic Info */}
      <div className="space-y-4">
        <div>
          <label className="block font-medium">Username</label>
          <input 
            type="text" 
            value={user.username} 
            disabled
            className="w-full border rounded px-3 py-2 bg-gray-100"
          />
        </div>

        <div>
          <label className="block font-medium">Email</label>
          <input 
            type="email" 
            value={user.email}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block font-medium">Role</label>
          <input 
            type="text" 
            value={user.role}
            disabled
            className="w-full border rounded px-3 py-2 bg-gray-100"
          />
        </div>
      </div>

      {/* Moderator Assignment */}
      <ModeratorAssignment 
        userId={user.id}
        currentRole={user.role}
        onUpdate={fetchUser}
      />

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button 
          onClick={onClose}
          className="flex-1 bg-gray-600 text-white py-2 rounded hover:bg-gray-700"
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default UserEditForm;
```

---

## ✅ Integration Checklist

- [ ] Component imported in user edit page
- [ ] Component added to edit form
- [ ] userId prop passed correctly
- [ ] currentRole prop passed correctly
- [ ] onUpdate callback set
- [ ] Tested assignment
- [ ] Tested role update
- [ ] Tested removal
- [ ] Error messages display
- [ ] Success messages display

---

## 🚀 Benefits

✅ Assign moderator directly from user edit
✅ View moderator stats inline
✅ Change role without leaving page
✅ Remove role easily
✅ Integrated user experience
✅ No separate page needed

---

## 📞 Support

### Component not showing
- Check if imported correctly
- Verify userId is passed
- Check browser console

### API returns 403
- Verify user is admin
- Check authentication token

### Stats not updating
- Check if onUpdate callback is set
- Verify fetchUser is called

---

**Status: ✅ READY TO USE**

Integrate into your user edit page and start assigning moderators!
