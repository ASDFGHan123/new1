@echo off
setlocal enabledelayedexpansion

echo ========================================
echo OffChat Admin Nexus - Complete Setup
echo ========================================
echo.
echo This script will set up the complete development environment
echo including Python, Node.js, Django, React, and all dependencies.
echo.

REM Check if running as administrator
net session >nul 2>&1
if %errorLevel% == 0 (
    echo [INFO] Running as administrator
) else (
    echo [WARNING] Not running as administrator. Some operations may fail.
    echo.
)

REM Get current directory
set "PROJECT_ROOT=%cd%"
echo [INFO] Project root: %PROJECT_ROOT%
echo.

REM Step 1: Check Python installation
echo [STEP 1/10] Checking Python installation...
python --version >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://python.org
    echo Make sure to check "Add Python to PATH" during installation
    pause
    exit /b 1
) else (
    for /f "tokens=2" %%i in ('python --version 2^>^&1') do set PYTHON_VERSION=%%i
    echo [SUCCESS] Python !PYTHON_VERSION! found
)

REM Step 2: Check Node.js installation
echo.
echo [STEP 2/10] Checking Node.js installation...
node --version >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js 18+ from https://nodejs.org
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo [SUCCESS] Node.js !NODE_VERSION! found
)

REM Step 3: Check Git installation
echo.
echo [STEP 3/10] Checking Git installation...
git --version >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] Git is not installed or not in PATH
    echo Please install Git from https://git-scm.com
    pause
    exit /b 1
) else (
    for /f "tokens=3" %%i in ('git --version') do set GIT_VERSION=%%i
    echo [SUCCESS] Git !GIT_VERSION! found
)

REM Step 4: Create Python virtual environment
echo.
echo [STEP 4/10] Creating Python virtual environment...
if exist "%PROJECT_ROOT%\venv" (
    echo [INFO] Virtual environment already exists
    choice /c YN /m "Do you want to recreate it? (Y/N)"
    if !errorlevel! equ 1 (
        echo [INFO] Removing existing virtual environment...
        rmdir /s /q "%PROJECT_ROOT%\venv"
    ) else (
        echo [INFO] Using existing virtual environment
        goto :skip_venv
    )
)

echo [INFO] Creating virtual environment...
python -m venv "%PROJECT_ROOT%\venv"
if %errorLevel% neq 0 (
    echo [ERROR] Failed to create virtual environment
    pause
    exit /b 1
)
echo [SUCCESS] Virtual environment created

:skip_venv

REM Step 5: Activate virtual environment and install Python dependencies
echo.
echo [STEP 5/10] Installing Python dependencies...
echo [INFO] Activating virtual environment...
call "%PROJECT_ROOT%\venv\Scripts\activate.bat"

echo [INFO] Upgrading pip...
python -m pip install --upgrade pip

echo [INFO] Installing requirements from requirements.txt...
pip install -r "%PROJECT_ROOT%\requirements.txt"
if %errorLevel% neq 0 (
    echo [ERROR] Failed to install Python dependencies
    pause
    exit /b 1
)

echo [INFO] Installing development requirements...
pip install -r "%PROJECT_ROOT%\requirements-dev.txt"
if %errorLevel% neq 0 (
    echo [WARNING] Some development dependencies may have failed (this is usually OK)
)

echo [SUCCESS] Python dependencies installed

REM Step 6: Setup Django database and initial configuration
echo.
echo [STEP 6/10] Setting up Django database...
echo [INFO] Running Django migrations...
python "%PROJECT_ROOT%\manage.py" migrate
if %errorLevel% neq 0 (
    echo [ERROR] Django migrations failed
    pause
    exit /b 1
)

echo [INFO] Creating Django superuser...
echo [INFO] You will be prompted to create an admin user
echo [INFO] Username: admin, Email: admin@offchat.local, Password: admin123
python "%PROJECT_ROOT%\manage.py" createsuperuser --username admin --email admin@offchat.local --noinput 2>nul
if %errorLevel% neq 0 (
    echo [INFO] Admin user may already exist or manual creation needed
) else (
    echo [INFO] Setting admin password...
    echo from django.contrib.auth.models import User; u = User.objects.get(username='admin'); u.set_password('admin123'); u.save() | python "%PROJECT_ROOT%\manage.py" shell
)

echo [SUCCESS] Django database setup complete

REM Step 7: Install Node.js dependencies
echo.
echo [STEP 7/10] Installing Node.js dependencies...
echo [INFO] Installing npm packages...
npm install
if %errorLevel% neq 0 (
    echo [ERROR] Failed to install Node.js dependencies
    pause
    exit /b 1
)

echo [SUCCESS] Node.js dependencies installed

REM Step 8: Setup environment configuration
echo.
echo [STEP 8/10] Setting up environment configuration...
if not exist "%PROJECT_ROOT%\.env.local" (
    echo [INFO] Creating .env.local from .env.example...
    copy "%PROJECT_ROOT%\.env.example" "%PROJECT_ROOT%\.env.local" >nul
    
    echo [INFO] Configuring default API URL...
    echo VITE_API_URL=http://localhost:8000/api > "%PROJECT_ROOT%\.env.local"
    echo VITE_USE_REAL_DATA=true >> "%PROJECT_ROOT%\.env.local"
    echo VITE_ENABLE_WEBSOCKET=true >> "%PROJECT_ROOT%\.env.local"
    echo VITE_DEBUG=false >> "%PROJECT_ROOT%\.env.local"
    
    echo [SUCCESS] Environment configuration created
) else (
    echo [INFO] .env.local already exists, skipping configuration
)

REM Step 9: Create startup scripts
echo.
echo [STEP 9/10] Creating startup scripts...

REM Create start-backend.bat
echo @echo off > "%PROJECT_ROOT%\start-backend.bat"
echo echo Starting Django Backend Server... >> "%PROJECT_ROOT%\start-backend.bat"
echo echo Backend will be available at: http://localhost:8000 >> "%PROJECT_ROOT%\start-backend.bat"
echo echo API at: http://localhost:8000/api >> "%PROJECT_ROOT%\start-backend.bat"
echo echo. >> "%PROJECT_ROOT%\start-backend.bat"
echo cd /d "%PROJECT_ROOT%" >> "%PROJECT_ROOT%\start-backend.bat"
echo call venv\Scripts\activate.bat >> "%PROJECT_ROOT%\start-backend.bat"
echo python manage.py runserver --settings=offchat_backend.settings.development >> "%PROJECT_ROOT%\start-backend.bat"

REM Create start-frontend.bat
echo @echo off > "%PROJECT_ROOT%\start-frontend.bat"
echo echo Starting React Frontend Server... >> "%PROJECT_ROOT%\start-frontend.bat"
echo echo Frontend will be available at: http://localhost:5173 >> "%PROJECT_ROOT%\start-frontend.bat"
echo echo. >> "%PROJECT_ROOT%\start-frontend.bat"
echo cd /d "%PROJECT_ROOT%" >> "%PROJECT_ROOT%\start-frontend.bat"
echo npm run dev >> "%PROJECT_ROOT%\start-frontend.bat"

echo [SUCCESS] Startup scripts created

REM Step 10: Final verification
echo.
echo [STEP 10/10] Final verification...
echo [INFO] Verifying Django installation...
python "%PROJECT_ROOT%\manage.py" check --deploy
if %errorLevel% neq 0 (
    echo [WARNING] Django check found some issues (this may be normal for development)
)

echo [INFO] Verifying React build...
npm run build
if %errorLevel% neq 0 (
    echo [WARNING] React build had issues (this may be normal for initial setup)
)

echo.
echo ========================================
echo SETUP COMPLETE!
echo ========================================
echo.
echo Project has been successfully set up at:
echo %PROJECT_ROOT%
echo.
echo Quick Start Commands:
echo   Start Backend: start-backend.bat
echo   Start Frontend: start-frontend.bat
echo   Start Both: start-dev.bat
echo.
echo Default Login Credentials:
echo   Username: admin
echo   Password: admin123
echo.
echo Access URLs:
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:8000
echo   API:      http://localhost:8000/api
echo   Admin:    http://localhost:8000/admin
echo.
echo Development Notes:
echo   - Django virtual environment: venv\
echo   - Node modules: node_modules\
echo   - Database: SQLite (db.sqlite3)
echo   - Media files: media\
echo.
echo For LAN access, update .env.local with your IP:
echo   VITE_API_URL=http://YOUR_IP:8000/api
echo.
echo Press any key to exit...
pause >nul

endlocal
