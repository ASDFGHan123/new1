# Quick Start - LAN Signin

## 1️⃣ Start Backend (Terminal 1)
```bash
start-backend.bat
```
Wait for: `Starting development server at http://0.0.0.0:8000/`

## 2️⃣ Start Frontend (Terminal 2)
```bash
start-frontend.bat
```
Wait for: `VITE v5.x.x ready in xxx ms`

## 3️⃣ Get Your IP
```bash
ipconfig
```
Look for IPv4 Address (e.g., `192.168.2.33`)

## 4️⃣ Test from Other Device
Open browser: `http://192.168.2.33:5173`

## 5️⃣ Login
- Username: `admin`
- Password: `12341234`
- Click "Sign In"

## ✅ Done!
You should see the admin dashboard.

---

## If Network Error

1. Check backend is running on `0.0.0.0:8000` (not `127.0.0.1`)
2. Check firewall allows port 8000
3. Check IP is correct
4. Try from same machine first: `http://localhost:5173`

## Files

- `start-backend.bat` - Run this first
- `start-frontend.bat` - Run this second
- `.env.local` - Already configured

That's it! 🎉
