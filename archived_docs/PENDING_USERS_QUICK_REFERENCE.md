# Quick Reference - Pending Users System

## What Changed?

### For Users
- **Signup**: Now requires email address
- **After Signup**: Account is pending admin approval
- **Login**: Cannot login until admin approves
- **Error Message**: "Your account is pending admin approval"

### For Admins
- **New Section**: Pending Users in Moderation Panel
- **Actions**: Approve or Reject pending users
- **Approve**: User can now login
- **Reject**: User is banned and cannot login

## How to Test

### Step 1: Create a Pending User
```
URL: http://localhost:5173/signup
Username: testuser
Email: test@example.com
Password: password123
Result: Account created with status='pending'
```

### Step 2: Try to Login (Should Fail)
```
URL: http://localhost:5173/login
Username: testuser
Password: password123
Result: Error - "Your account is pending admin approval"
```

### Step 3: Admin Approves User
```
URL: http://localhost:8000/admin
Go to: Moderation Panel → Pending Users
Action: Click "Approve" on testuser
Result: User status changes to 'active'
```

### Step 4: Login Now Works
```
URL: http://localhost:5173/login
Username: testuser
Password: password123
Result: Login successful, user can access chat
```

## Database Status Values

| Status | Meaning | Can Login? |
|--------|---------|-----------|
| pending | Waiting for admin approval | ❌ No |
| active | Approved by admin | ✅ Yes |
| suspended | Temporarily blocked | ❌ No |
| banned | Permanently blocked | ❌ No |

## API Endpoints

### User Signup
```
POST /api/auth/register/
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123"
}
Response: 201 Created (user with status='pending')
```

### User Login
```
POST /api/auth/login/
{
  "username": "testuser",
  "password": "password123"
}
Response: 200 OK (if status='active')
Response: 403 Forbidden (if status='pending')
```

### Admin: Get Pending Users
```
GET /admin/pending-users/
Response: List of all pending users
```

### Admin: Approve User
```
POST /admin/pending-users/{user_id}/approve/
Response: 200 OK (user status changed to 'active')
```

### Admin: Reject User
```
POST /admin/pending-users/{user_id}/reject/
Response: 200 OK (user status changed to 'banned')
```

## Files to Check

### Backend
- `users/auth_views.py` - Login validation
- `admin_panel/moderation_views.py` - Pending users management
- `admin_panel/urls.py` - API routes

### Frontend
- `src/components/auth/SignupForm.tsx` - Email field
- `src/components/auth/LoginForm.tsx` - Error messages
- `src/App.tsx` - API calls
- `src/lib/moderation-api.ts` - API methods

### Database
- `users/models.py` - User model with status field

## Troubleshooting

### Issue: User can login without approval
**Solution**: Check that backend login view has status checks

### Issue: Signup doesn't ask for email
**Solution**: Check SignupForm.tsx has email input field

### Issue: Pending users endpoint returns 404
**Solution**: Check admin_panel/urls.py has pending-users routes

### Issue: Database doesn't have pending users
**Solution**: Check users/models.py has status='pending' as default

## Summary

✅ **Signup**: Creates user with status='pending'
✅ **Login**: Checks status before allowing login
✅ **Admin**: Can approve/reject pending users
✅ **Database**: SQLite stores user status
✅ **Frontend**: Shows appropriate error messages
✅ **Backend**: Validates user status on login
