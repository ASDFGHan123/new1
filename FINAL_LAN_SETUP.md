# ✅ LAN Signin Fix - Final Solution

## The Problem
Backend was running on `127.0.0.1:8000` (localhost only), not accessible from other devices.

## The Solution
Run backend on `0.0.0.0:8000` (all network interfaces).

## How to Start

### Option 1: Use Startup Scripts (Easiest)

**Terminal 1 - Start Backend:**
```bash
start-backend.bat
```

**Terminal 2 - Start Frontend:**
```bash
start-frontend.bat
```

### Option 2: Manual Commands

**Terminal 1 - Start Backend:**
```bash
python manage.py runserver 0.0.0.0:8000 --settings=offchat_backend.settings.development
```

**Terminal 2 - Start Frontend:**
```bash
npm run dev
```

## Access from Other Device

1. **Get your machine IP:**
   ```bash
   ipconfig
   ```
   Look for IPv4 Address (e.g., `192.168.2.33`)

2. **Open in browser on other device:**
   ```
   http://192.168.2.33:5173
   ```

3. **Login:**
   - Username: `admin`
   - Password: `12341234`

## Expected Output

### Backend
```
Starting development server at http://0.0.0.0:8000/
Quit the server with CONTROL-C.
```

### Frontend
```
VITE v5.x.x ready in xxx ms

➜  Local:   http://localhost:5173/
➜  press h to show help
```

## Verify It Works

From another device, test:
```bash
curl http://192.168.2.33:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"admin\",\"password\":\"12341234\"}"
```

Should return JSON with tokens.

## Files Created

- `start-backend.bat` - Start backend on all interfaces
- `start-frontend.bat` - Start frontend
- `.env.local` - API URL configuration

## Troubleshooting

### Still Getting Network Error?

1. **Check backend is running on 0.0.0.0:**
   ```bash
   netstat -ano | findstr :8000
   ```
   Should show listening on `0.0.0.0:8000`

2. **Check firewall allows port 8000:**
   - Windows Firewall → Allow an app
   - Add Python to allowed apps

3. **Verify IP is correct:**
   ```bash
   ipconfig
   ```

4. **Test from same machine first:**
   ```
   http://localhost:5173
   ```

### Backend Still on 127.0.0.1?

Make sure you're using the startup script or manual command with `0.0.0.0`:
```bash
# WRONG - only localhost
python manage.py runserver

# CORRECT - all interfaces
python manage.py runserver 0.0.0.0:8000 --settings=offchat_backend.settings.development
```

## Success Checklist

- [ ] Backend running on `0.0.0.0:8000`
- [ ] Frontend running on `0.0.0.0:5173`
- [ ] Can access `http://192.168.2.33:5173` from other device
- [ ] Can login with admin/12341234
- [ ] Admin dashboard loads
- [ ] No network errors

All checked? ✅ **Signin is working!**

## Quick Reference

| What | Command |
|------|---------|
| Start Backend | `start-backend.bat` |
| Start Frontend | `start-frontend.bat` |
| Get Your IP | `ipconfig` |
| Test API | `curl http://192.168.2.33:8000/api/auth/login/` |
| Access Frontend | `http://192.168.2.33:5173` |
| Login | admin / 12341234 |

---

**Key Point:** Always use `0.0.0.0:8000` for backend to allow LAN access!
