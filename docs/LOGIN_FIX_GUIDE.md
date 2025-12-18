# OffChat Login Issue - Complete Fix Guide

## Problem Summary
You can access `http://192.168.2.9:8082` from other devices but cannot login with the credentials `admin` / `admin123`.

## Issues Identified

### 1. Port Confusion
- **Expected Port**: 5173 (from default configuration)
- **Actual Port**: 8082 (React automatically chose this because 5173 was occupied)
- **Solution**: This is fine! Port 8082 is included in CORS configuration

### 2. Password Inconsistency
There are conflicting password settings in your project:

**From `create_admin.py`:**
```python
password='admin123'  # Line 24
```

**From `start_project.ps1`:**
```powershell
Write-Host "Default admin user created (password: 12341234)"  # Line 286
```

## Correct Login Credentials

**Try these credentials in order:**

### Option 1: Try `admin` / `admin123`
Since this is what the `create_admin.py` script creates, this should work.

### Option 2: Try `admin` / `12341234`
This is what the startup script claims was created.

## Troubleshooting Steps

### Step 1: Verify the Correct Password

Run this command to check which password actually works:

```powershell
python manage.py shell -c "
from users.models import User
from django.contrib.auth.hashers import check_password

admin = User.objects.get(username='admin')
print('Admin found:', admin.username)

# Test admin123
if check_password('admin123', admin.password):
    print('SUCCESS: admin123 is the correct password')
else:
    print('FAILED: admin123 is not correct')

# Test 12341234  
if check_password('12341234', admin.password):
    print('SUCCESS: 12341234 is the correct password')
else:
    print('FAILED: 12341234 is not correct')
"
```

### Step 2: If Neither Password Works, Reset Admin Password

Run the admin creation script to reset the password:

```powershell
python create_admin.py
```

This will:
- Delete the existing admin user
- Create a new admin with password `admin123`
- Make the user active and staff

### Step 3: Verify Admin User Status

Check that the admin user exists and is properly configured:

```powershell
python manage.py shell -c "
from users.models import User

try:
    admin = User.objects.get(username='admin')
    print('Admin exists: YES')
    print('Username:', admin.username)
    print('Email:', admin.email)
    print('Is Active:', admin.is_active)
    print('Is Staff:', admin.is_staff)
    print('Role:', admin.role)
    print('Status:', admin.status)
except User.DoesNotExist:
    print('Admin user does not exist!')
"
```

## CORS Configuration (Already Correct)

Your `offchat_backend/settings.py` already includes port 8082 in CORS settings:

```python
CORS_ALLOWED_ORIGINS = [
    # ... other origins ...
    "http://localhost:8082",  # Vite dev server (current port)
    "http://127.0.0.1:8082",
    "http://192.168.2.9:8082",  # React dev server on network
    # ... other network origins ...
]
```

## Current Status

✅ **Django Server**: Running on port 8000  
✅ **React Frontend**: Running on port 8082  
✅ **Network Access**: Configured for 192.168.2.9  
✅ **CORS**: Port 8082 is allowed  
✅ **Admin User**: Exists in database  

❓ **Password**: Need to verify which password is correct  

## Quick Fix Commands

### Option A: Use Default Password (Recommended)
```powershell
# Reset admin with password 'admin123'
python create_admin.py

# Then login with:
# Username: admin  
# Password: admin123
```

### Option B: Manual Password Reset
```powershell
# If you want to set a specific password
python manage.py changepassword admin
```

## Expected Final Result

After fixing the password, you should be able to:

1. **Access**: `http://192.168.2.9:8082` from any device on your network
2. **Login**: `admin` / `admin123` (or `12341234` if that works)
3. **See**: Admin dashboard with user management, analytics, etc.

## Testing From External Device

Once you have the correct credentials:

1. On any device connected to your WiFi
2. Open browser
3. Go to: `http://192.192.168.2.9:8082`
4. Login with the correct credentials
5. You should see the OffChat admin dashboard

## Notes

- The port number (8082 vs 5173) doesn't matter - both are configured for network access
- The app automatically detects whether you're accessing locally or from the network
- All API calls will correctly route to `http://192.168.2.9:8000` when accessed from external devices