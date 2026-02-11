# Complete Setup Guide for New Device

## Project Overview
**OffChat Admin Nexus** - Full-stack admin dashboard with:
- **Backend**: Django 4.2.7 + REST API + WebSocket
- **Frontend**: React 18 + Vite + TypeScript
- **Database**: SQLite (development)
- **Features**: User management, chat system, analytics, real-time messaging

---

## Prerequisites Installation

### 1. Install Python 3.8-3.13
1. Download from https://www.python.org/downloads/
2. During installation:
   - ✅ Check "Add Python to PATH"
   - ✅ Check "Install pip"
3. Verify: Open CMD and run `python --version`

### 2. Install Node.js 18+
1. Download from https://nodejs.org/
2. During installation:
   - ✅ Check "Add to PATH"
   - ✅ Install npm package manager
3. Verify: Open CMD and run `node --version`

---

## Setup Steps (Automated)

### Method 1: One-Click Setup (Recommended)

1. **Extract/Clone Project**
   ```cmd
   cd C:\path\to\offchat-admin-nexus-main
   ```

2. **Run Setup Script**
   ```cmd
   scripts\setup-dev.bat
   ```

3. **Wait for Completion**
   - Creates Python virtual environment
   - Installs all dependencies (correct versions)
   - Sets up database
   - Creates superuser (follow prompts)
   - Starts both servers automatically

4. **Access Application**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:8000/api
   - Admin: http://localhost:8000/admin
   - Default login: `admin` / `12341234`

---

## Setup Steps (Manual)

### If Automated Setup Fails

#### Backend Setup

1. **Create Virtual Environment**
   ```cmd
   cd offchat-admin-nexus-main
   python -m venv venv
   ```

2. **Activate Virtual Environment**
   ```cmd
   venv\Scripts\activate.bat
   ```

3. **Install Dependencies**
   ```cmd
   pip install setuptools==69.0.0
   cd backend
   pip install -r requirements.txt
   ```

4. **Setup Database**
   ```cmd
   python manage.py migrate
   ```

5. **Create Superuser**
   ```cmd
   python manage.py createsuperuser
   ```
   Enter username, email, and password when prompted.

6. **Start Backend Server**
   ```cmd
   python manage.py runserver
   ```
   Backend runs on: http://localhost:8000

#### Frontend Setup (New Terminal)

1. **Navigate to Frontend**
   ```cmd
   cd offchat-admin-nexus-main\frontend
   ```

2. **Clean Previous Builds**
   ```cmd
   rmdir /s /q node_modules
   rmdir /s /q .vite
   rmdir /s /q dist
   del package-lock.json
   ```

3. **Remove Compiled JS Files**
   ```cmd
   for /r "src" %f in (*.js) do del /f /q "%f"
   for /r "src" %f in (*.jsx) do del /f /q "%f"
   ```

4. **Install Dependencies**
   ```cmd
   npm install
   ```

5. **Start Frontend Server**
   ```cmd
   npm run dev
   ```
   Frontend runs on: http://localhost:5173

---

## Common Issues & Fixes

### Issue 1: "Failed to resolve import @/lib/api"

**Quick Fix:**
```cmd
scripts\fix-frontend.bat
```

**Manual Fix:**
```cmd
cd frontend
for /r "src" %f in (*.js) do del /f /q "%f"
for /r "src" %f in (*.jsx) do del /f /q "%f"
rmdir /s /q node_modules
rmdir /s /q .vite
npm install
npm run dev
```

### Issue 2: "No module named 'pkg_resources'"

**Fix:**
```cmd
venv\Scripts\activate.bat
pip install setuptools==69.0.0
```

### Issue 3: "Pillow build failed"

**Fix:**
```cmd
venv\Scripts\activate.bat
pip install Pillow>=11.1.0
```

### Issue 4: Port Already in Use

**Fix:**
```cmd
REM Kill backend (port 8000)
netstat -ano | findstr :8000
taskkill /PID <PID_NUMBER> /F

REM Kill frontend (port 5173)
netstat -ano | findstr :5173
taskkill /PID <PID_NUMBER> /F
```

---

## Project Structure

```
offchat-admin-nexus-main/
├── backend/              # Django backend
│   ├── manage.py
│   ├── requirements.txt
│   ├── offchat_backend/  # Settings
│   ├── users/            # User management
│   ├── chat/             # Chat system
│   ├── admin_panel/      # Admin features
│   └── analytics/        # Analytics
├── frontend/             # React frontend
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── pages/        # Page components
│   │   ├── lib/          # API & utilities
│   │   └── contexts/     # React contexts
│   ├── package.json
│   └── vite.config.ts
├── scripts/              # Setup scripts
│   ├── setup-dev.bat     # Main setup
│   └── fix-frontend.bat  # Frontend fix
├── media/                # Uploaded files
├── static/               # Static files
├── db.sqlite3            # Database
└── venv/                 # Python environment
```

---

## Daily Development Workflow

### Starting Servers

**Option 1: Automated**
```cmd
start-dev.bat
```

**Option 2: Manual**

Terminal 1 (Backend):
```cmd
cd backend
..\venv\Scripts\activate.bat
python manage.py runserver
```

Terminal 2 (Frontend):
```cmd
cd frontend
npm run dev
```

### Stopping Servers
- Press `Ctrl+C` in each terminal
- Or close terminal windows

---

## Database Operations

### Create Migrations
```cmd
cd backend
..\venv\Scripts\activate.bat
python manage.py makemigrations
```

### Apply Migrations
```cmd
python manage.py migrate
```

### Create New Admin User
```cmd
python manage.py createsuperuser
```

### Reset Database
```cmd
del db.sqlite3
python manage.py migrate
python manage.py createsuperuser
```

---

## Network Access (LAN)

### Access from Other Devices

1. **Find Your IP**
   ```cmd
   ipconfig
   ```
   Look for "IPv4 Address" (e.g., 192.168.1.100)

2. **Start Servers on 0.0.0.0**
   
   Backend:
   ```cmd
   python manage.py runserver 0.0.0.0:8000
   ```
   
   Frontend: Already configured in vite.config.ts

3. **Access from Other Devices**
   - Frontend: http://YOUR_IP:5173
   - Backend: http://YOUR_IP:8000

4. **Firewall Rules**
   - Allow ports 5173 and 8000 in Windows Firewall

---

## Key Files & Configuration

### Backend Configuration
- `backend/offchat_backend/settings/development.py` - Dev settings
- `backend/requirements.txt` - Python dependencies
- `backend/manage.py` - Django management

### Frontend Configuration
- `frontend/vite.config.ts` - Vite config
- `frontend/tsconfig.json` - TypeScript config
- `frontend/package.json` - Node dependencies
- `frontend/src/lib/api.ts` - API service

### Environment Variables
- `.env.local` - Local environment config
- `VITE_API_URL` - Backend API URL

---

## Verification Checklist

After setup, verify:

- [ ] Backend running on http://localhost:8000
- [ ] Frontend running on http://localhost:5173
- [ ] Can login with admin credentials
- [ ] Dashboard loads without errors
- [ ] No console errors in browser
- [ ] API calls working (check Network tab)

---

## Getting Help

### Check Logs
- Backend: Terminal output or `django.log`
- Frontend: Browser console (F12)

### Common Commands
```cmd
REM Check Python version
python --version

REM Check Node version
node --version

REM Check if ports are in use
netstat -ano | findstr :8000
netstat -ano | findstr :5173

REM Verify files exist
dir frontend\src\lib\api.ts
dir frontend\src\lib\utils.ts
dir frontend\src\lib\websocket.ts
```

### Documentation
- `README.md` - Project overview
- `SETUP-GUIDE.md` - Troubleshooting
- `docs/` - Detailed documentation

---

## Quick Reference

| Task | Command |
|------|---------|
| Setup everything | `scripts\setup-dev.bat` |
| Fix frontend issues | `scripts\fix-frontend.bat` |
| Start both servers | `start-dev.bat` |
| Backend only | `cd backend && ..\venv\Scripts\activate.bat && python manage.py runserver` |
| Frontend only | `cd frontend && npm run dev` |
| Create admin | `cd backend && ..\venv\Scripts\activate.bat && python manage.py createsuperuser` |
| Reset database | `del db.sqlite3 && cd backend && python manage.py migrate` |

---

## Success Indicators

✅ Setup is successful when:
1. No errors in terminal outputs
2. Both servers start without issues
3. Can access http://localhost:5173
4. Can login to admin dashboard
5. No red errors in browser console

---

## Support

If issues persist:
1. Read error messages carefully
2. Check `SETUP-GUIDE.md` for troubleshooting
3. Verify all prerequisites installed
4. Try manual setup steps
5. Check file permissions
6. Ensure stable internet connection
