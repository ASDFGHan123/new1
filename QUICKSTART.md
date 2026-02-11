# Quick Start - New Device Setup

## Step 1: Install Prerequisites (5 minutes)

### Install Python
1. Go to https://www.python.org/downloads/
2. Download Python 3.8 or higher
3. Run installer
4. ✅ **IMPORTANT**: Check "Add Python to PATH"
5. Click Install

### Install Node.js
1. Go to https://nodejs.org/
2. Download LTS version (18+)
3. Run installer
4. ✅ **IMPORTANT**: Check "Add to PATH"
5. Click Install

## Step 2: Run Setup (10 minutes)

1. Extract project folder
2. Open Command Prompt (CMD) - **NOT PowerShell**
3. Run:
```cmd
cd path\to\offchat-admin-nexus-main
scripts\setup-simple.bat
```

4. Follow prompts:
   - Press Enter for default admin username: `admin`
   - Press Enter for default password: `12341234`

5. Wait for servers to start in new windows

## Step 3: Access Application

- Open browser: http://localhost:5173
- Login: `admin` / `12341234`

---

## If Errors Occur

### "Python not found"
- Reinstall Python with "Add to PATH" checked
- Restart Command Prompt

### "Node not found"
- Reinstall Node.js with "Add to PATH" checked
- Restart Command Prompt

### "Failed to resolve import @/lib/api"
```cmd
cd frontend
for /r src %f in (*.js *.jsx) do del /f /q "%f"
rmdir /s /q node_modules
npm install
npm run dev
```

### Port already in use
```cmd
netstat -ano | findstr :8000
taskkill /PID <number> /F
```

---

## Daily Use

Start servers:
```cmd
cd offchat-admin-nexus-main

REM Backend
cd backend
..\venv\Scripts\activate
python manage.py runserver

REM Frontend (new terminal)
cd frontend
npm run dev
```

---

## That's It!

✅ Backend: http://localhost:8000
✅ Frontend: http://localhost:5173
✅ Login: admin / 12341234
