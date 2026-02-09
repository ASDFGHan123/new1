@echo off
setlocal enabledelayedexpansion
color 0A

echo.
echo ============================================================
echo   OffChat Admin Dashboard - Complete Development Setup
echo ============================================================
echo.

REM Get script directory and project root
set SCRIPT_DIR=%~dp0
set PROJECT_ROOT=%SCRIPT_DIR%..
echo Project root: %PROJECT_ROOT%

REM Check if required directories exist
if not exist "%PROJECT_ROOT%\backend" (
    echo ERROR: Backend directory not found at %PROJECT_ROOT%\backend
    echo Please ensure you are running this script from the correct location
    pause
    exit /b 1
)

if not exist "%PROJECT_ROOT%\frontend" (
    echo ERROR: Frontend directory not found at %PROJECT_ROOT%\frontend
    echo Please ensure you are running this script from the correct location
    pause
    exit /b 1
)

REM Check if Python is installed
echo Checking prerequisites...
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.9+ from https://www.python.org/
    echo Make sure to check "Add Python to PATH" during installation
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js 18+ from https://nodejs.org/
    echo Make sure to check "Add to PATH" during installation
    pause
    exit /b 1
)

echo [OK] Python found: 
for /f "tokens=*" %%i in ('python --version') do echo     %%i
echo [OK] Node.js found:
for /f "tokens=*" %%i in ('node --version') do echo     %%i
echo [OK] npm found:
for /f "tokens=*" %%i in ('npm --version') do echo     %%i

echo.
echo ============================================================
echo Step 1: Setting up Python Virtual Environment
echo ============================================================
if exist "%PROJECT_ROOT%\venv" (
    echo Virtual environment already exists. Removing old one...
    rmdir /s /q "%PROJECT_ROOT%\venv"
)
echo Creating new Python virtual environment...
python -m venv "%PROJECT_ROOT%\venv"
if errorlevel 1 goto error
echo [OK] Virtual environment created

echo.
echo ============================================================
echo Step 2: Installing Python Dependencies
echo ============================================================
echo Activating virtual environment...
call "%PROJECT_ROOT%\venv\Scripts\activate.bat"
if errorlevel 1 goto error

echo Upgrading pip and installing setuptools...
call "%PROJECT_ROOT%\venv\Scripts\python.exe" -m pip install --upgrade pip
call "%PROJECT_ROOT%\venv\Scripts\python.exe" -m pip install setuptools==69.0.0
if errorlevel 1 goto error

echo Installing project dependencies from requirements.txt...
call "%PROJECT_ROOT%\venv\Scripts\python.exe" -m pip install -r "%PROJECT_ROOT%\backend\requirements.txt"
if errorlevel 1 goto error
echo [OK] Python dependencies installed

echo.
echo ============================================================
echo Step 3: Setting up Django Database
echo ============================================================
echo Creating Django migrations...
cd /d "%PROJECT_ROOT%\backend"
call "%PROJECT_ROOT%\venv\Scripts\python.exe" manage.py makemigrations --settings=offchat_backend.settings.development
if errorlevel 1 goto error

echo Running Django migrations...
call "%PROJECT_ROOT%\venv\Scripts\python.exe" manage.py migrate --settings=offchat_backend.settings.development
if errorlevel 1 goto error
echo [OK] Database migrations completed

echo.
echo ============================================================
echo Step 4: Installing Node.js Dependencies
echo ============================================================
echo Installing npm packages...
cd /d "%PROJECT_ROOT%\frontend"

REM Remove node_modules and package-lock if they exist
if exist "node_modules" (
    echo Removing old node_modules...
    rmdir /s /q node_modules
)
if exist "package-lock.json" (
    del /f /q package-lock.json
)
if exist "dist" (
    echo Removing old dist folder...
    rmdir /s /q dist
)
if exist ".vite" (
    echo Removing Vite cache...
    rmdir /s /q .vite
)

echo Performing fresh npm install...
npm install --no-audit --no-fund
if errorlevel 1 goto error

echo Cleaning compiled files from src directory...
for /r "src" %%f in (*.js) do del /f /q "%%f" 2>nul
for /r "src" %%f in (*.jsx) do del /f /q "%%f" 2>nul

echo Clearing Vite cache...
if exist "node_modules\.vite" rmdir /s /q node_modules\.vite

echo Verifying critical files...
if not exist "src\lib\api.ts" (
    echo ERROR: Missing src\lib\api.ts
    goto error
)
if not exist "src\lib\utils.ts" (
    echo ERROR: Missing src\lib\utils.ts
    goto error
)
if not exist "src\lib\websocket.ts" (
    echo ERROR: Missing src\lib\websocket.ts
    goto error
)
if not exist "vite.config.ts" (
    echo ERROR: Missing vite.config.ts
    goto error
)
if not exist "tsconfig.json" (
    echo ERROR: Missing tsconfig.json
    goto error
)
if not exist "tsconfig.app.json" (
    echo ERROR: Missing tsconfig.app.json
    goto error
)
echo [OK] All critical files verified

echo [OK] Node.js dependencies installed

echo.
echo ============================================================
echo Step 5: Creating Environment Configuration
echo ============================================================
if not exist "%PROJECT_ROOT%\.env.local" (
    echo Creating .env.local file...
    (
        echo # Development Environment Configuration
        echo VITE_API_URL=http://localhost:8000/api
        echo VITE_DEBUG=true
    ) > "%PROJECT_ROOT%\.env.local"
    echo [OK] .env.local created with default settings
) else (
    echo [OK] .env.local already exists
)

echo.
echo ============================================================
echo Step 6: Creating Superuser Account
echo ============================================================
echo.
echo Creating Django superuser for admin access...
echo Default credentials (optional - you can set custom ones):
echo   Username: admin
echo   Password: 12341234
echo.
echo If you want to use default credentials, just press Enter when prompted.
echo.
cd /d "%PROJECT_ROOT%\backend"
call "%PROJECT_ROOT%\venv\Scripts\python.exe" manage.py createsuperuser --settings=offchat_backend.settings.development
if errorlevel 1 (
    echo WARNING: Superuser creation failed or was skipped
    echo You can create it later by running:
    echo   python manage.py createsuperuser --settings=offchat_backend.settings.development
)

echo.
echo ============================================================
echo Step 7: Collecting Static Files
echo ============================================================
cd /d "%PROJECT_ROOT%\backend"
call "%PROJECT_ROOT%\venv\Scripts\python.exe" manage.py collectstatic --noinput --settings=offchat_backend.settings.development
if errorlevel 1 (
    echo WARNING: Static files collection had issues, but continuing...
)
echo [OK] Static files collected

echo.
echo ============================================================
echo Setup Complete!
echo ============================================================
echo.
echo All development dependencies have been installed successfully!
echo.
echo Next steps:
echo 1. A new command window will open for the Django backend
echo 2. Another command window will open for the React frontend
echo 3. Wait for both servers to start (may take 30-60 seconds)
echo.
echo Access the application:
echo   Admin Dashboard: http://localhost:5173
echo   API Backend:     http://localhost:8000/api
echo   Admin Panel:     http://localhost:8000/admin
echo.
echo Default Admin Credentials:
echo   Username: admin
echo   Password: 12341234
echo.
echo To stop the servers, close the command windows or press Ctrl+C
echo.
pause

echo.
echo Starting development servers...
echo.

echo Starting Django backend on port 8000...
start "OffChat Backend" cmd /k "cd /d \"%PROJECT_ROOT%\backend\" && call \"%PROJECT_ROOT%\venv\Scripts\activate.bat\" && python manage.py runserver 0.0.0.0:8000 --settings=offchat_backend.settings.development"

echo Waiting 3 seconds before starting frontend...
timeout /t 3 /nobreak

echo Starting React frontend on port 5173...
start "OffChat Frontend" cmd /k "cd /d \"%PROJECT_ROOT%\frontend\" && npm run dev"

echo.
echo ============================================================
echo Development servers are starting...
echo ============================================================
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:5173
echo.
echo This window will close in 10 seconds...
timeout /t 10 /nobreak
goto end

:error
echo.
echo ============================================================
echo ERROR: Setup Failed
echo ============================================================
echo.
echo Please check the error messages above and ensure:
echo   1. Python 3.9+ is installed and in PATH
echo   2. Node.js 18+ is installed and in PATH
echo   3. You have internet connection for downloading packages
echo   4. You have sufficient disk space
echo   5. You have write permissions in this directory
echo.
echo For more help, check the README.md file
echo.
pause

:end
endlocal
