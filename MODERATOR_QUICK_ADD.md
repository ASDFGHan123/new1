# Quick: Add Moderator to User Edit Form

## 📍 Find Your User Edit Component

Look for file like:
- `UserEditModal.tsx`
- `UserEditForm.tsx`
- `EditUserPage.tsx`

---

## 🔧 Add 2 Things

### 1️⃣ Import at Top
```typescript
import ModeratorAssignment from '@/components/admin/ModeratorAssignment';
```

### 2️⃣ Add After Role Field
```typescript
{user.role !== 'admin' && (
  <ModeratorAssignment 
    userId={user.id}
    currentRole={user.role}
    onUpdate={() => fetchUser(user.id)}
  />
)}
```

---

## ✅ Done!

The moderator section will appear in your user edit form!

---

## 📋 Example Location

```typescript
<div>
  <label>Role</label>
  <input value={user.role} disabled />
</div>

{/* ← ADD HERE */}
{user.role !== 'admin' && (
  <ModeratorAssignment 
    userId={user.id}
    currentRole={user.role}
    onUpdate={() => fetchUser(user.id)}
  />
)}

<div>
  <label>Profile Image</label>
  <input type="file" />
</div>
```

---

## 🎯 Result

```
Edit User

Username: mahmood
Email: mahmood@offchat.local
Role: User

┌─────────────────────────────┐
│ Moderator Role              │
│ [Junior | Senior | Lead]    │
│ [Assign as Moderator]       │
└─────────────────────────────┘

Profile Image: [Upload]

[Save Changes] [Cancel]
```

---

**That's it! 🚀**
