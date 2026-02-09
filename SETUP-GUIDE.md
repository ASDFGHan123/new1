# OffChat Admin Nexus - Setup Guide

## Prerequisites
1. **Python 3.8+** - Download from https://www.python.org/
   - ✅ Check "Add Python to PATH" during installation
2. **Node.js 18+** - Download from https://nodejs.org/
   - ✅ Check "Add to PATH" during installation

## Quick Setup (Recommended)

### Step 1: Run Setup Script
```cmd
cd offchat-admin-nexus-main
scripts\setup-dev.bat
```

The script will automatically:
- Create Python virtual environment
- Install all Python dependencies (with correct versions)
- Setup Django database
- Install Node.js dependencies
- Create superuser account
- Start both servers

### Step 2: Access Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000/api
- Admin Panel: http://localhost:8000/admin

Default credentials:
- Username: `admin`
- Password: `12341234`

## Manual Setup (If Script Fails)

### Backend Setup
```cmd
cd offchat-admin-nexus-main
python -m venv venv
venv\Scripts\activate.bat
cd backend
pip install setuptools==69.0.0
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### Frontend Setup (New Terminal)
```cmd
cd offchat-admin-nexus-main\frontend
rmdir /s /q node_modules
del package-lock.json
rmdir /s /q dist
rmdir /s /q .vite
npm install
npm run dev
```

## Troubleshooting

### Error: "Failed to resolve import @/lib/api"

**Solution 1:** Clean install
```cmd
cd frontend
rmdir /s /q node_modules
rmdir /s /q .vite
del package-lock.json
npm install
npm run dev
```

**Solution 2:** Verify files exist
```cmd
cd frontend
dir src\lib\api.ts
dir src\lib\utils.ts
dir src\lib\websocket.ts
```

If files are missing, restore from backup or repository.

**Solution 3:** Check tsconfig.app.json
Ensure it contains:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Error: "ModuleNotFoundError: No module named 'pkg_resources'"

**Solution:**
```cmd
venv\Scripts\activate.bat
pip install setuptools==69.0.0
```

### Error: "Pillow build failed"

**Solution:**
```cmd
venv\Scripts\activate.bat
pip install Pillow>=11.1.0
```

### Error: "pkgutil.find_loader AttributeError"

**Solution:**
```cmd
venv\Scripts\activate.bat
pip install django-filter==24.2
```

### Port Already in Use

**Solution:**
```cmd
REM Kill process on port 8000 (Backend)
netstat -ano | findstr :8000
taskkill /PID <PID> /F

REM Kill process on port 5173 (Frontend)
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

## Common Issues on New Device

### Issue: Path aliases not working
- Delete `node_modules`, `.vite`, and `dist` folders
- Run `npm install` again
- Restart Vite dev server

### Issue: Python version mismatch
- Ensure Python 3.8-3.13 is installed
- Python 3.14 requires specific package versions (handled by setup script)

### Issue: Permission denied
- Run Command Prompt as Administrator
- Check antivirus isn't blocking file operations

## Development Workflow

### Starting Servers
```cmd
REM Backend
cd backend
..\venv\Scripts\activate.bat
python manage.py runserver

REM Frontend (new terminal)
cd frontend
npm run dev
```

### Stopping Servers
- Press `Ctrl+C` in each terminal
- Or close the terminal windows

### Database Migrations
```cmd
cd backend
..\venv\Scripts\activate.bat
python manage.py makemigrations
python manage.py migrate
```

### Creating New Admin User
```cmd
cd backend
..\venv\Scripts\activate.bat
python manage.py createsuperuser
```

## Project Structure
```
offchat-admin-nexus-main/
├── backend/          # Django backend
│   ├── manage.py
│   ├── requirements.txt
│   └── offchat_backend/
├── frontend/         # React frontend
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── scripts/          # Setup scripts
│   └── setup-dev.bat
└── venv/            # Python virtual environment
```

## Support

If you encounter issues not covered here:
1. Check error messages carefully
2. Verify all prerequisites are installed
3. Try manual setup steps
4. Check file permissions
5. Ensure internet connection for package downloads
