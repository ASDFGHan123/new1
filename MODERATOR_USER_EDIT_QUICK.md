# Moderator Assignment in User Edit - Quick Reference

## ⚡ 2-Minute Setup

### Step 1: Import Component

```typescript
import ModeratorAssignment from '@/components/admin/ModeratorAssignment';
```

### Step 2: Add to User Edit Form

```typescript
<ModeratorAssignment 
  userId={user.id}
  currentRole={user.role}
  onUpdate={() => fetchUser()}
/>
```

**Done! 🎉**

---

## 📋 Component Props

```typescript
userId: string           // User ID
currentRole: string      // Current role (admin/user/moderator)
onUpdate?: () => void    // Refresh callback
```

---

## 🎨 Features

✅ Assign moderator role
✅ View moderator stats
✅ Change role type
✅ Remove moderator role
✅ Show permissions
✅ Error handling
✅ Loading states

---

## 📱 Usage

```typescript
// In user edit modal/page
<ModeratorAssignment 
  userId={user.id}
  currentRole={user.role}
  onUpdate={() => {
    // Refresh user data
    fetchUser();
  }}
/>
```

---

## 🎯 What It Shows

### For Non-Moderators
- Dropdown to select role
- Permission preview
- Assign button

### For Moderators
- Current role and stats
- Dropdown to change role
- Update and Remove buttons

---

## 🔐 Security

✅ Only admins can access
✅ Cannot assign to admins
✅ Backend permission checks
✅ All actions logged

---

## ✅ Checklist

- [ ] Component imported
- [ ] Added to user edit form
- [ ] userId passed
- [ ] currentRole passed
- [ ] onUpdate callback set
- [ ] Tested in browser

---

## 📁 Files

- `src/components/admin/ModeratorAssignment.tsx` - Component
- `MODERATOR_USER_EDIT_INTEGRATION.md` - Full guide

---

**Ready to use! 🚀**
