@echo off
echo ================================================
echo OffChat Admin Dashboard - Project Launcher
echo ================================================
echo.

:: Check if running with administrator privileges
net session >nul 2>&1
if %errorLevel% == 0 (
    echo [INFO] Running with administrator privileges
) else (
    echo [WARNING] Not running as administrator - some operations may fail
)

:: Kill any existing processes on our ports
echo [1/6] Checking for running servers...
echo Killing processes on ports 5173 (React) and 8000 (Django)...

:: Kill processes on port 5173 (React dev server)
for /f "tokens=5" %%i in ('netstat -ano ^| findstr :5173') do (
    echo Killing process %%i on port 5173
    taskkill /PID %%i /F >nul 2>&1
)

:: Kill processes on port 8000 (Django)
for /f "tokens=5" %%i in ('netstat -ano ^| findstr :8000') do (
    echo Killing process %%i on port 8000
    taskkill /PID %%i /F >nul 2>&1
)

:: Kill any existing node processes
taskkill /IM node.exe /F >nul 2>&1
taskkill /IM python.exe /F >nul 2>&1

echo [2/6] Checking Node.js installation...
node --version >nul 2>&1
if %errorLevel% == 0 (
    for /f "tokens=1" %%i in ('node --version') do set NODE_VERSION=%%i
    echo [OK] Node.js %NODE_VERSION% found
) else (
    echo [ERROR] Node.js not found! Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)

echo [3/6] Checking Python installation...
python --version >nul 2>&1
if %errorLevel% == 0 (
    for /f "tokens=2" %%i in ('python --version') do set PYTHON_VERSION=%%i
    echo [OK] Python %PYTHON_VERSION% found
) else (
    echo [ERROR] Python not found! Please install Python 3.8+ from https://python.org/
    pause
    exit /b 1
)

echo [4/6] Checking npm installation...
npm --version >nul 2>&1
if %errorLevel% == 0 (
    for /f "tokens=1" %%i in ('npm --version') do set NPM_VERSION=%%i
    echo [OK] npm %NPM_VERSION% found
) else (
    echo [ERROR] npm not found! Please install npm
    pause
    exit /b 1
)

echo [5/6] Installing/updating npm dependencies...
if not exist node_modules (
    echo Installing npm packages...
    npm install
    if %errorLevel% neq 0 (
        echo [ERROR] Failed to install npm packages
        pause
        exit /b 1
    )
) else (
    echo Updating npm packages...
    npm install
    if %errorLevel% neq 0 (
        echo [WARNING] npm update had issues, but continuing...
    )
)

echo [6/6] Checking Python virtual environment...
if not exist venv (
    echo Creating Python virtual environment...
    python -m venv venv
    if %errorLevel% neq 0 (
        echo [ERROR] Failed to create virtual environment
        pause
        exit /b 1
    )
)

echo Activating virtual environment and installing Python dependencies...
call venv\Scripts\activate
pip install -r requirements.txt
if %errorLevel% neq 0 (
    echo [ERROR] Failed to install Python dependencies
    echo Trying to install essential packages only...
    pip install Django djangorestframework django-cors-headers channels
)

echo.
echo ================================================
echo Starting servers...
echo ================================================
echo Frontend (React): http://localhost:5173
echo Backend (Django): http://localhost:8000
echo Django Admin: http://localhost:8000/admin
echo.
echo Login credentials:
echo Username: admin
echo Password: 12341234
echo.
echo Press Ctrl+C to stop all servers
echo ================================================
echo.

:: Start Django backend in background
echo Starting Django backend...
start "Django Backend" cmd /k "call venv\Scripts\activate && python manage.py runserver 0.0.0.0:8000"

:: Wait a moment for Django to start
timeout /t 3 /nobreak >nul

:: Start React frontend
echo Starting React frontend...
start "React Frontend" cmd /k "npm run dev"

echo.
echo [SUCCESS] Both servers are starting!
echo.
echo Access points:
echo - Frontend: http://localhost:5173
echo - Backend API: http://localhost:8000/api/
echo - Django Admin: http://localhost:8000/admin
echo.
echo To stop servers, close the command windows or press Ctrl+C in each window
echo.
pause