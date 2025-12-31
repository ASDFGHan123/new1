# LAN Signin Fix - Summary

## What Was Fixed

The signin error on other devices was caused by the frontend not correctly determining the backend API URL when accessed from a different IP address.

## Changes Made

### 1. **API URL Detection** (`src/lib/api.ts`)
- Fixed `getApiBaseUrl()` to properly use the current hostname
- Now correctly constructs API URL for both localhost and LAN IPs
- Maintains protocol (http/https) from current request

### 2. **Better Error Logging** (`src/pages/AdminLogin.tsx`)
- Added console logging to show which API URL is being used
- Better error messages for debugging

### 3. **Configuration Files**
- Created `.env.example` for manual API URL configuration
- Created `LAN_SIGNIN_SETUP.md` with detailed setup instructions
- Created `scripts/diagnose-lan-signin.bat` for quick diagnostics

## How to Fix Signin Issues

### Quick Fix (Try First)
Just access from the other device - it should auto-detect:
```
http://192.168.1.100:5173
```

### If Still Getting Network Error

**Step 1:** Create `.env.local` file in project root:
```bash
copy .env.example .env.local
```

**Step 2:** Edit `.env.local` and set your IP:
```
VITE_API_URL=http://192.168.1.100:8000/api
```
(Replace `192.168.1.100` with your actual IP)

**Step 3:** Restart frontend:
```bash
npm run dev
```

### Verify Setup

Run the diagnostic script:
```bash
scripts\diagnose-lan-signin.bat
```

This will:
- Show your machine IP
- Check if backend is running
- Check if frontend is running
- Test API connectivity

## Files Created/Modified

**Created:**
- `.env.example` - Environment variable template
- `LAN_SIGNIN_SETUP.md` - Detailed setup guide
- `scripts/diagnose-lan-signin.bat` - Diagnostic tool

**Modified:**
- `src/lib/api.ts` - Fixed API URL detection
- `src/pages/AdminLogin.tsx` - Added error logging

## Testing

1. **From same machine (localhost):**
   ```
   http://localhost:5173
   ```

2. **From another device on LAN:**
   ```
   http://192.168.1.100:5173
   ```
   (Use your actual machine IP)

3. **Default credentials:**
   - Username: `admin`
   - Password: `12341234`

## Troubleshooting

If signin still fails:

1. **Check browser console (F12)** for exact error
2. **Run diagnostic script:** `scripts\diagnose-lan-signin.bat`
3. **Verify both servers running:**
   - Backend: `python manage.py runserver --settings=offchat_backend.settings.development`
   - Frontend: `npm run dev`
4. **Check firewall** allows ports 5173 and 8000
5. **Create `.env.local`** with explicit API URL

## Next Steps

- Test signin from another device
- If it works, you're done!
- If not, follow the "If Still Getting Network Error" section above
