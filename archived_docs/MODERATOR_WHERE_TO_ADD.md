# Where to Add Moderator Assignment - Visual Guide

## 📍 Location in Your Form

Your current form:
```
Edit User
Update user information and settings.

Username: mahmood
Email: mahmood@offchat.local
Role: User
Profile Image: [Upload]

[Save Changes] [Cancel]
```

---

## ➕ Add Component Here

```
Edit User
Update user information and settings.

Username: mahmood
Email: mahmood@offchat.local
Role: User

┌─────────────────────────────────────────┐
│  ← ADD MODERATOR COMPONENT HERE         │
│                                         │
│  Moderator Role                         │
│  ─────────────────────────────────────  │
│  Assign a moderator role:               │
│  [Junior | Senior | Lead]               │
│  [Assign as Moderator]                  │
│                                         │
└─────────────────────────────────────────┘

Profile Image: [Upload]

[Save Changes] [Cancel]
```

---

## 🔧 Code Location

Find your user edit component file (e.g., `UserEditModal.tsx`):

```typescript
export function UserEditModal({ user }) {
  return (
    <div className="space-y-6">
      
      {/* Username field */}
      <div>
        <label>Username</label>
        <input value={user.username} disabled />
      </div>

      {/* Email field */}
      <div>
        <label>Email</label>
        <input value={user.email} />
      </div>

      {/* Role field */}
      <div>
        <label>Role</label>
        <input value={user.role} disabled />
      </div>

      {/* ← ADD MODERATOR COMPONENT HERE */}
      {user.role !== 'admin' && (
        <ModeratorAssignment 
          userId={user.id}
          currentRole={user.role}
          onUpdate={() => fetchUser(user.id)}
        />
      )}

      {/* Profile Image field */}
      <div>
        <label>Profile Image</label>
        <input type="file" />
      </div>

      {/* Buttons */}
      <div>
        <button>Save Changes</button>
        <button>Cancel</button>
      </div>

    </div>
  );
}
```

---

## 📋 3 Simple Steps

### Step 1: Import
```typescript
import ModeratorAssignment from '@/components/admin/ModeratorAssignment';
```

### Step 2: Add After Role Field
```typescript
{user.role !== 'admin' && (
  <ModeratorAssignment 
    userId={user.id}
    currentRole={user.role}
    onUpdate={() => fetchUser(user.id)}
  />
)}
```

### Step 3: Done! ✅

---

## 🎯 Result

When you open a user edit form, you'll see:

```
Edit User
Username: mahmood
Email: mahmood@offchat.local
Role: User

┌──────────────────────────────────┐
│ Moderator Role                   │
├──────────────────────────────────┤
│ This user is not a moderator.    │
│ Assign a moderator role:         │
│                                  │
│ Select Moderator Role Type       │
│ [Choose role...]                 │
│ ├─ Junior Moderator              │
│ ├─ Senior Moderator              │
│ └─ Lead Moderator                │
│                                  │
│ [Assign as Moderator]            │
└──────────────────────────────────┘

Profile Image: [Upload]

[Save Changes] [Cancel]
```

---

## ✨ Features

✅ Shows only for non-admin users
✅ Displays moderator role options
✅ Shows permissions preview
✅ One-click assignment
✅ Updates in real-time
✅ Error handling

---

**That's it! Add the component and you're done! 🚀**
