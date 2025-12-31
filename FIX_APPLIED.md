# Signin Fix Applied for 192.168.2.33

## Changes Made

### 1. Created `.env.local`
```
VITE_API_URL=http://192.168.2.33:8000/api
VITE_DEBUG=true
```
This tells frontend exactly where backend is located.

### 2. Enhanced API Error Logging (`src/lib/api.ts`)
- Added `[API]` prefix to all logs
- Shows request method and URL
- Shows response status
- Better error messages with backend URL

### 3. Updated Django CORS (`offchat_backend/settings/development.py`)
- Added `192.168.2.33:5173` to CSRF_TRUSTED_ORIGINS
- CORS already allows all origins in development

### 4. Improved Error Messages
- Network errors now show backend URL
- Better debugging information
- Clearer error descriptions

## What to Do Now

### Step 1: Restart Backend
```bash
python manage.py runserver --settings=offchat_backend.settings.development
```

### Step 2: Restart Frontend
```bash
npm run dev
```

### Step 3: Clear Browser Cache
- Ctrl+Shift+Delete
- Clear all cache
- Close browser

### Step 4: Test
- Go to: http://192.168.2.33:5173
- Login with: admin / 12341234

## Expected Result

✅ Frontend loads
✅ Admin Login page displays
✅ Can signin successfully
✅ Admin dashboard loads
✅ No errors in browser console

## If Still Getting Errors

### Check Browser Console (F12)
Look for `[API]` logs showing:
- Request URL: `http://192.168.2.33:8000/api/auth/login/`
- Response status: `200` (success) or error code

### Common Errors & Fixes

| Error | Fix |
|-------|-----|
| Network error | Restart backend, check firewall |
| CORS error | Restart backend |
| 401 Unauthorized | Clear cache, restart frontend |
| Invalid credentials | Use admin / 12341234 |
| Cannot reach API | Check IP is correct, backend running |

### Test API Directly
```bash
curl -X POST http://192.168.2.33:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"admin\",\"password\":\"12341234\"}"
```

Should return JSON with tokens.

## Files Changed

1. ✅ `.env.local` - Created
2. ✅ `src/lib/api.ts` - Enhanced logging
3. ✅ `offchat_backend/settings/development.py` - Added CORS

## Next Steps

1. Restart both servers
2. Clear browser cache
3. Test signin from 192.168.2.33:5173
4. Check browser console for `[API]` logs
5. If errors, follow troubleshooting above

---

**Status:** Ready to test
**IP:** 192.168.2.33:5173
**Backend:** 192.168.2.33:8000
**Credentials:** admin / 12341234
