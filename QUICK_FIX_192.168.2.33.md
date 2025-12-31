# Quick Fix for Signin Errors on 192.168.2.33:5173

## What Was Done

1. ✅ Created `.env.local` with correct API URL
2. ✅ Enhanced API error logging
3. ✅ Added CORS headers for LAN IP
4. ✅ Improved error messages

## Steps to Fix

### Step 1: Restart Backend
```bash
# Stop current backend (Ctrl+C)
# Then restart:
python manage.py runserver --settings=offchat_backend.settings.development
```

### Step 2: Restart Frontend
```bash
# Stop current frontend (Ctrl+C)
# Then restart:
npm run dev
```

### Step 3: Clear Browser Cache
- Press Ctrl+Shift+Delete
- Clear all cache and cookies
- Close and reopen browser

### Step 4: Test Signin
- Go to: http://192.168.2.33:5173
- Click "Admin Login"
- Username: `admin`
- Password: `12341234`
- Click "Sign In"

## If Still Getting Errors

### Check 1: Browser Console (F12)
Look for these errors and solutions:

**Error: "Network error"**
- Backend not running on port 8000
- Firewall blocking port 8000
- Wrong IP address

**Error: "CORS policy"**
- Backend CORS not configured
- Restart backend after changes

**Error: "Invalid credentials"**
- Wrong username/password
- Use: admin / 12341234

**Error: "401 Unauthorized"**
- Token not being sent
- Clear browser cache
- Restart frontend

### Check 2: Verify Backend is Running
```bash
# From another device, test:
curl http://192.168.2.33:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"admin\",\"password\":\"12341234\"}"
```

Should return JSON with tokens.

### Check 3: Check Firewall
Windows Firewall must allow:
- Port 5173 (Frontend)
- Port 8000 (Backend)

### Check 4: Verify .env.local
File should contain:
```
VITE_API_URL=http://192.168.2.33:8000/api
VITE_DEBUG=true
```

## Files Modified

1. `.env.local` - Created with correct API URL
2. `src/lib/api.ts` - Enhanced error logging
3. `offchat_backend/settings/development.py` - Added CORS for LAN IP

## Expected Behavior

1. Frontend loads at http://192.168.2.33:5173 ✅
2. Admin Login page displays ✅
3. Enter credentials and click Sign In ✅
4. Admin dashboard loads ✅
5. No errors in browser console ✅

## Debug Mode

With `VITE_DEBUG=true` in `.env.local`, you'll see:
- API requests in console: `[API] Request: POST http://192.168.2.33:8000/api/auth/login/`
- API responses: `[API] Response: 200`
- Errors: `[API] Error 401: ...`

## Still Not Working?

1. Run diagnostic: `test-lan-signin.bat`
2. Check backend logs for errors
3. Verify both servers running: `netstat -ano | findstr :8000` and `:5173`
4. Try from localhost first: `http://localhost:5173`
5. Check firewall settings

## Success Indicators

✅ Frontend loads
✅ Admin Login page shows
✅ Can enter credentials
✅ No network errors in console
✅ Admin dashboard loads after signin
✅ Can see user list and admin features

If all above are true, signin is working!
