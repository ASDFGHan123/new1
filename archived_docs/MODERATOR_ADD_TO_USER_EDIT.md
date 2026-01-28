# Integration: Add Moderator Assignment to User Edit Form

## 📍 Where to Add It

Find your user edit form component (likely in `src/components/admin/UserEditModal.tsx` or similar).

---

## 🔧 Step 1: Import Component

Add this import at the top:

```typescript
import ModeratorAssignment from '@/components/admin/ModeratorAssignment';
```

---

## 🔧 Step 2: Add After Role Field

Find this section in your form:

```typescript
<div>
  <label>Role</label>
  <input value={user.role} disabled />
</div>
```

Add the component right after it:

```typescript
<div>
  <label>Role</label>
  <input value={user.role} disabled />
</div>

{/* ADD THIS SECTION */}
{user.role !== 'admin' && (
  <ModeratorAssignment 
    userId={user.id}
    currentRole={user.role}
    onUpdate={() => {
      // Refresh user data
      fetchUser(user.id);
    }}
  />
)}
```

---

## 📋 Complete Example

```typescript
export function UserEditModal({ user, onClose, onSave }) {
  const [formData, setFormData] = useState(user);

  return (
    <div className="space-y-6 p-6">
      <h2>Edit User: {user.username}</h2>

      {/* Username */}
      <div>
        <label className="block font-medium">Username</label>
        <input 
          value={formData.username} 
          disabled
          className="w-full border rounded px-3 py-2 bg-gray-100"
        />
      </div>

      {/* Email */}
      <div>
        <label className="block font-medium">Email</label>
        <input 
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          className="w-full border rounded px-3 py-2"
        />
      </div>

      {/* Role */}
      <div>
        <label className="block font-medium">Role</label>
        <input 
          value={formData.role}
          disabled
          className="w-full border rounded px-3 py-2 bg-gray-100"
        />
      </div>

      {/* MODERATOR ASSIGNMENT - ADD HERE */}
      {user.role !== 'admin' && (
        <ModeratorAssignment 
          userId={user.id}
          currentRole={user.role}
          onUpdate={() => {
            // Refresh user
            fetchUser(user.id);
          }}
        />
      )}

      {/* Profile Image */}
      <div>
        <label className="block font-medium">Profile Image</label>
        <input type="file" />
      </div>

      {/* Buttons */}
      <div className="flex gap-2">
        <button onClick={onSave} className="bg-blue-600 text-white px-4 py-2 rounded">
          Save Changes
        </button>
        <button onClick={onClose} className="bg-gray-600 text-white px-4 py-2 rounded">
          Cancel
        </button>
      </div>
    </div>
  );
}
```

---

## ✅ Result

Your form will now show:

```
Edit User
Username: mahmood
Email: mahmood@offchat.local
Role: User

┌─────────────────────────────────┐
│    Moderator Role               │
├─────────────────────────────────┤
│ Assign a moderator role:        │
│ [Junior | Senior | Lead]        │
│ [Assign as Moderator]           │
└─────────────────────────────────┘

Profile Image: [Upload]

[Save Changes] [Cancel]
```

---

## 🎯 That's It!

The moderator assignment section will appear right in your user edit form!
