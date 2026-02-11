@echo off
echo ============================================================
echo   OffChat Admin - Simple Setup
echo ============================================================
echo.

REM Get project root
set PROJECT_ROOT=%~dp0..
cd /d "%PROJECT_ROOT%"

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found. Install from https://www.python.org/
    pause
    exit /b 1
)

REM Check Node
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found. Install from https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Prerequisites found
echo.

REM ===== BACKEND SETUP =====
echo [1/4] Setting up Backend...
if exist venv rmdir /s /q venv
python -m venv venv
call venv\Scripts\pip.exe install --quiet setuptools==69.0.0
call venv\Scripts\pip.exe install --quiet -r backend\requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install Python packages
    pause
    exit /b 1
)

cd backend
..\venv\Scripts\python.exe manage.py migrate --noinput
if errorlevel 1 (
    echo ERROR: Database migration failed
    pause
    exit /b 1
)
cd ..

echo [OK] Backend ready
echo.

REM ===== FRONTEND SETUP =====
echo [2/4] Setting up Frontend...
cd frontend

REM Clean everything
if exist node_modules rmdir /s /q node_modules 2>nul
if exist .vite rmdir /s /q .vite 2>nul
if exist dist rmdir /s /q dist 2>nul
del /f /q package-lock.json 2>nul

REM Remove ALL compiled JS files from src (this is the critical fix)
echo Removing compiled JS files...
for /r src %%f in (*.js) do (
    echo Deleting %%f
    del /f /q "%%f" 2>nul
)
for /r src %%f in (*.jsx) do (
    echo Deleting %%f
    del /f /q "%%f" 2>nul
)

REM Install
echo Installing npm packages...
call npm install --silent
if errorlevel 1 (
    echo ERROR: npm install failed
    pause
    exit /b 1
)

REM Verify files exist
if not exist "src\lib\api.ts" (
    echo ERROR: src\lib\api.ts not found!
    pause
    exit /b 1
)
if not exist "src\lib\utils.ts" (
    echo ERROR: src\lib\utils.ts not found!
    pause
    exit /b 1
)

cd ..
echo [OK] Frontend ready
echo.

REM ===== CREATE ADMIN =====
echo [3/4] Create Admin User
echo.
echo Enter admin username (or press Enter for 'admin'):
set /p ADMIN_USER=
if "%ADMIN_USER%"=="" set ADMIN_USER=admin

echo Enter admin password (or press Enter for '12341234'):
set /p ADMIN_PASS=
if "%ADMIN_PASS%"=="" set ADMIN_PASS=12341234

cd backend
echo from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.filter(username='%ADMIN_USER%').exists() or User.objects.create_superuser('%ADMIN_USER%', 'admin@example.com', '%ADMIN_PASS%') | ..\venv\Scripts\python.exe manage.py shell
cd ..

echo [OK] Admin user created
echo.

REM ===== START SERVERS =====
echo [4/4] Starting Servers...
echo.
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
echo Login: %ADMIN_USER% / %ADMIN_PASS%
echo.
echo Press any key to start...
pause >nul

start "Backend" cmd /k "cd /d %PROJECT_ROOT%\backend && ..\venv\Scripts\python.exe manage.py runserver"
timeout /t 2 /nobreak >nul
start "Frontend" cmd /k "cd /d %PROJECT_ROOT%\frontend && npm run dev"

echo.
echo ============================================================
echo Servers starting in new windows...
echo Close this window when done.
echo ============================================================
timeout /t 5 /nobreak
