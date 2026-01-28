# Pending Users Implementation - Complete Solution

## Overview
Implemented a complete pending user approval system across frontend, backend, and database. New users are created with `status='pending'` and must be approved by admins before they can login.

## Changes Made

### 1. Backend (Django)

#### users/auth_views.py
- **Updated `login_view`**: Added status checks to prevent pending, suspended, or banned users from logging in
  - Pending users get error: "Your account is pending admin approval"
  - Suspended users get error: "Your account is suspended"
  - Banned users get error: "Your account is banned"
- **Signup already creates pending users**: `status='pending'` is set by default in `signup_view`

#### admin_panel/moderation_views.py
- **Added `PendingUsersViewSet`**: New viewset to manage pending user approvals
  - `list()`: Get all pending users
  - `approve(pk)`: Approve a pending user (sets status to 'active')
  - `reject(pk)`: Reject a pending user (sets status to 'banned')
  - `stats()`: Get count of pending users

#### admin_panel/urls.py
- Added pending users endpoints:
  - `GET /admin/pending-users/` - List all pending users
  - `POST /admin/pending-users/<id>/approve/` - Approve user
  - `POST /admin/pending-users/<id>/reject/` - Reject user
  - `GET /admin/pending-users/stats/` - Get pending users count

### 2. Frontend (React/TypeScript)

#### src/components/auth/SignupForm.tsx
- Added email input field to signup form
- Updated form to collect username, email, and password

#### src/components/auth/LoginForm.tsx
- Enhanced error handling for pending, suspended, and banned accounts
- Shows user-friendly error messages

#### src/App.tsx
- **Updated `handleLogin`**: Now uses API service instead of local state
  - Properly handles pending user errors from backend
- **Updated `handleSignup`**: Now uses API service
  - Creates pending users via backend
  - Shows message: "Account created! Please wait for admin approval before logging in."

#### src/contexts/AuthContext.tsx
- Signup already properly handles email field

#### src/lib/moderation-api.ts
- Added pending users API methods:
  - `getPendingUsers()` - Fetch all pending users
  - `approvePendingUser(id)` - Approve a user
  - `rejectPendingUser(id)` - Reject a user
  - `getPendingUsersStats()` - Get pending count

### 3. Database (SQLite)

#### users/models.py
- User model already has:
  - `status` field with choices: 'active', 'pending', 'suspended', 'banned'
  - Default status is 'pending'
  - Methods: `approve_user()`, `ban_user()`, `suspend_user()`

No database migrations needed - the model already supports pending status.

## User Flow

### Signup Flow
1. User fills signup form with username, email, password
2. Frontend sends to `/api/auth/register/`
3. Backend creates user with `status='pending'`
4. User sees: "Account created! Please wait for admin approval before logging in."
5. User is redirected to login page

### Login Flow (Pending User)
1. User tries to login with username/email and password
2. Backend authenticates user
3. Backend checks status:
   - If `status='pending'`: Returns error "Your account is pending admin approval"
   - If `status='suspended'`: Returns error "Your account is suspended"
   - If `status='banned'`: Returns error "Your account is banned"
   - If `status='active'`: Login succeeds
4. Frontend shows appropriate error message

### Admin Approval Flow
1. Admin goes to Moderation Panel
2. Admin sees "Pending Users" section (or new tab)
3. Admin can:
   - **Approve**: User status changes to 'active', user can now login
   - **Reject**: User status changes to 'banned', user cannot login

## Testing

### Test Case 1: Signup with Email
```
1. Go to /signup
2. Enter: username="ahmad zia", email="ahmad@example.com", password="password123"
3. Click "Create Account"
4. Should see: "Account created! Please wait for admin approval before logging in."
5. User created in database with status='pending'
```

### Test Case 2: Login as Pending User
```
1. Go to /login
2. Enter: username="ahmad zia", password="password123"
3. Click "Sign In"
4. Should see error: "Your account is pending admin approval"
5. Login fails
```

### Test Case 3: Admin Approves User
```
1. Admin logs in to admin dashboard
2. Go to Moderation Panel → Pending Users
3. Find "ahmad zia" in pending list
4. Click "Approve"
5. User status changes to 'active'
```

### Test Case 4: Login After Approval
```
1. Go to /login
2. Enter: username="ahmad zia", password="password123"
3. Click "Sign In"
4. Login succeeds, user can access chat
```

## API Endpoints Summary

### Authentication
- `POST /api/auth/register/` - Signup (creates pending user)
- `POST /api/auth/login/` - Login (checks status)

### Admin Moderation
- `GET /admin/pending-users/` - List pending users
- `POST /admin/pending-users/<id>/approve/` - Approve user
- `POST /admin/pending-users/<id>/reject/` - Reject user
- `GET /admin/pending-users/stats/` - Get pending count

## Files Modified

### Backend
- `users/auth_views.py` - Login status checks
- `admin_panel/moderation_views.py` - PendingUsersViewSet
- `admin_panel/urls.py` - Pending users endpoints

### Frontend
- `src/components/auth/SignupForm.tsx` - Email field
- `src/components/auth/LoginForm.tsx` - Error handling
- `src/App.tsx` - API integration
- `src/lib/moderation-api.ts` - Pending users API

### Database
- No changes needed (model already supports pending status)

## Status Codes

- `201 Created` - User signup successful (pending status)
- `200 OK` - Login successful (active status)
- `403 Forbidden` - Login failed (pending/suspended/banned status)
- `400 Bad Request` - Invalid input

## Error Messages

| Scenario | Error Message |
|----------|---------------|
| Pending user tries to login | "Your account is pending admin approval" |
| Suspended user tries to login | "Your account is suspended" |
| Banned user tries to login | "Your account is banned" |
| Invalid credentials | "Invalid credentials" |
| Inactive account | "Account is inactive" |

## Next Steps (Optional)

1. Add email verification before approval
2. Add admin notification when new user signs up
3. Add user notification when approved/rejected
4. Add expiration for pending status (auto-reject after X days)
5. Add bulk approve/reject functionality
