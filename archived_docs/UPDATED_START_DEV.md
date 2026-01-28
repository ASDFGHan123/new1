# ✅ Updated start-dev.bat - Complete LAN Setup

## What Changed

The `scripts/start-dev.bat` file now:
1. ✅ Automatically detects your machine IP
2. ✅ Starts backend on `0.0.0.0:8000` (all interfaces)
3. ✅ Starts frontend on `0.0.0.0:5173` (all interfaces)
4. ✅ Displays all access URLs (localhost + LAN IP)
5. ✅ Shows login credentials

## How to Use

### One Command to Start Everything

```bash
scripts\start-dev.bat
```

That's it! This will:
- Detect your machine IP automatically
- Start Django backend in new window
- Start Vite frontend in new window
- Display all access URLs

### What You'll See

```
========================================
   OffChat Development Servers
========================================

Your Machine IP: 192.168.2.33

Starting Django backend on 0.0.0.0:8000...
Starting React frontend on 0.0.0.0:5173...

========================================
   Access URLs
========================================

Local Machine:
   Frontend: http://localhost:5173
   Backend:  http://localhost:8000

Other Devices (LAN):
   Frontend: http://192.168.2.33:5173
   Backend:  http://192.168.2.33:8000

Login Credentials:
   Username: admin
   Password: 12341234

========================================
```

## Access from Different Devices

### From Same Machine
```
http://localhost:5173
```

### From Other Device on LAN
```
http://192.168.2.33:5173
```
(Use your actual IP shown in the script output)

## Login

1. Open frontend URL in browser
2. Click "Admin Login"
3. Enter:
   - Username: `admin`
   - Password: `12341234`
4. Click "Sign In"

## Expected Result

✅ Admin dashboard loads
✅ Can see user management
✅ Can access all admin features
✅ No network errors

## Troubleshooting

### Backend Not Starting?
- Check if port 8000 is already in use
- Kill existing process: `taskkill /F /IM python.exe`
- Run script again

### Frontend Not Starting?
- Check if port 5173 is already in use
- Kill existing process: `taskkill /F /IM node.exe`
- Run script again

### Still Getting Network Error?
- Check firewall allows ports 5173 and 8000
- Verify IP address is correct
- Try from same machine first: `http://localhost:5173`

## Files Modified

- `scripts/start-dev.bat` - Updated with IP detection and better output

## Files Already Configured

- `.env.local` - API URL set to `http://192.168.2.33:8000/api`
- `src/lib/api.ts` - Enhanced error logging
- `offchat_backend/settings/development.py` - CORS enabled

## Quick Reference

| Action | Command |
|--------|---------|
| Start all servers | `scripts\start-dev.bat` |
| Access locally | `http://localhost:5173` |
| Access from LAN | `http://192.168.2.33:5173` |
| Login | admin / 12341234 |

---

**That's it! Just run `scripts\start-dev.bat` and you're ready to go!** 🚀
