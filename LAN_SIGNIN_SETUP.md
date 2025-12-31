# LAN Access Setup Guide

## Problem
When accessing the application from another device on the LAN, you get a "Network Error" during signin.

## Root Cause
The frontend needs to know the correct backend API URL when accessed from a different device.

## Solution

### Option 1: Auto-Detection (Recommended)
The frontend automatically detects the API URL from the current hostname:
- If you access from `http://192.168.1.100:5173`, it will use `http://192.168.1.100:8000/api`
- This should work automatically without any configuration

**If this doesn't work, try Option 2:**

### Option 2: Manual Configuration
Create a `.env.local` file in the project root:

```bash
# Windows
copy .env.example .env.local

# Mac/Linux
cp .env.example .env.local
```

Edit `.env.local` and set your API URL:
```
VITE_API_URL=http://192.168.1.100:8000/api
```

Replace `192.168.1.100` with your actual machine IP.

Then restart the frontend:
```bash
npm run dev
```

### Option 3: Check Backend CORS Settings
Ensure Django allows requests from your LAN IP:

**offchat_backend/settings/development.py:**
```python
ALLOWED_HOSTS = ['*']  # Already set for development
CORS_ALLOW_ALL_ORIGINS = True  # Already set for development
```

If these aren't set, update them and restart Django.

## Troubleshooting

### 1. Still Getting Network Error?
Check the browser console (F12) for the exact error:
- Look for the API URL being used
- Verify it matches your machine IP

### 2. Test API Directly
From another device, test if the API is accessible:
```bash
curl http://192.168.1.100:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"12341234"}'
```

### 3. Check Firewall
Ensure Windows Firewall allows:
- Port 5173 (Frontend)
- Port 8000 (Backend)

### 4. Verify Both Servers Running
```bash
# Check if Django is running
curl http://192.168.1.100:8000/admin/

# Check if Vite is running
curl http://192.168.1.100:5173/
```

## Quick Start for LAN Access

1. **Get your machine IP:**
   ```bash
   ipconfig
   ```
   Look for IPv4 Address (e.g., `192.168.1.100`)

2. **Start backend:**
   ```bash
   python manage.py runserver --settings=offchat_backend.settings.development
   ```

3. **Start frontend:**
   ```bash
   npm run dev
   ```

4. **Access from another device:**
   ```
   http://192.168.1.100:5173
   ```

5. **If you get network error, create `.env.local`:**
   ```
   VITE_API_URL=http://192.168.1.100:8000/api
   ```

6. **Restart frontend and try again**

## Default Credentials
- Username: `admin`
- Password: `12341234`

## Still Not Working?

1. Check browser console for exact error message
2. Verify API URL in Network tab (F12 → Network)
3. Test API endpoint directly with curl
4. Ensure firewall allows both ports
5. Restart both frontend and backend services
