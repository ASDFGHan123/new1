@echo off
setlocal enabledelayedexpansion

:: =============================================
:: OffChat Admin - Complete Setup Script
:: =============================================

:: Configuration
set PROJECT_ROOT=%~dp0
set PYTHON_REQUIRED_VERSION=3.8
set NODE_REQUIRED_VERSION=16.0.0
set VENV_DIR=%PROJECT_ROOT%venv
set BACKEND_DIR=%PROJECT_ROOT%backend
set FRONTEND_DIR=%PROJECT_ROOT%frontend

:: Colors
set RED=[91m
set GREEN=[92m
set YELLOW=[93m
set NC=[0m

:: Function to check command existence
:command_exists
where %1 >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo %RED%Error: %1 is not installed or not in PATH%NC%
    exit /b 1
)
exit /b 0

:: Function to check Python version
:check_python_version
for /f "tokens=2 delims==. " %%A in ('python --version 2^>^&1') do set "PYTHON_VERSION=%%A"
if "!PYTHON_VERSION!" LSS "%PYTHON_REQUIRED_VERSION%" (
    echo %RED%Error: Python %PYTHON_REQUIRED_VERSION% or higher is required. Found version !PYTHON_VERSION!%NC%
    exit /b 1
)
exit /b 0

:: Main script starts here
echo %GREEN%=== OffChat Admin Setup ===%NC%
echo %GREEN%=== This will set up your development environment ===%NC%
echo.

:: 1. Check Python
echo %YELLOW%[1/8] Checking Python...%NC%
call :command_exists python
if %ERRORLEVEL% NEQ 0 (
    echo %RED%Python is not installed. Please install Python %PYTHON_REQUIRED_VERSION%+ from python.org%NC%
    start https://www.python.org/downloads/windows/
    pause
    exit /b 1
)
call :check_python_version
echo %GREEN%✓ Python !PYTHON_VERSION! is installed%NC%

:: 2. Check Node.js and npm
echo %YELLOW%[2/8] Checking Node.js and npm...%NC%
call :command_exists node
if %ERRORLEVEL% NEQ 0 (
    echo %RED%Node.js is not installed. Please install Node.js LTS from nodejs.org%NC%
    start https://nodejs.org/
    pause
    exit /b 1
)
call :command_exists npm
if %ERRORLEVEL% NEQ 0 (
    echo %RED%npm is not installed. Please install Node.js which includes npm%NC%
    exit /b 1
)
echo %GREEN%✓ Node.js and npm are installed%NC%

:: 3. Create and activate virtual environment
echo %YELLOW%[3/8] Setting up Python virtual environment...%NC%
if exist "%VENV_DIR%" (
    echo %YELLOW%Virtual environment already exists. Removing old one...%NC%
    rmdir /s /q "%VENV_DIR%"
)
python -m venv "%VENV_DIR%"
if %ERRORLEVEL% NEQ 0 (
    echo %RED%Failed to create virtual environment%NC%
    exit /b 1
)
echo %GREEN%✓ Virtual environment created%NC%

:: 4. Install Python dependencies
echo %YELLOW%[4/8] Installing Python dependencies...%NC%
call "%VENV_DIR%\Scripts\activate.bat"
if %ERRORLEVEL% NEQ 0 (
    echo %RED%Failed to activate virtual environment%NC%
    exit /b 1
)

echo Upgrading pip, setuptools, and wheel...
python -m pip install --upgrade pip setuptools wheel
if %ERRORLEVEL% NEQ 0 (
    echo %RED%Failed to upgrade pip packages%NC%
    exit /b 1
)

echo Installing project dependencies...
cd /d "%BACKEND_DIR%"
pip install -r requirements.txt
if %ERRORLEVEL% NEQ 0 (
    echo %YELLOW%Warning: Failed to install some dependencies. Trying with --no-cache-dir...%NC%
    pip install --no-cache-dir -r requirements.txt
    if %ERRORLEVEL% NEQ 0 (
        echo %RED%Failed to install Python dependencies%NC%
        exit /b 1
    )
)

:: 5. Set up database
echo %YELLOW%[5/8] Setting up database...%NC%
python manage.py migrate
if %ERRORLEVEL% NEQ 0 (
    echo %YELLOW%Warning: Failed to run migrations. Trying with --run-syncdb...%NC%
    python manage.py migrate --run-syncdb
    if %ERRORLEVEL% NEQ 0 (
        echo %RED%Failed to set up database%NC%
        exit /b 1
    )
)

:: 6. Create superuser (skip if already exists)
echo %YELLOW%[6/8] Creating superuser...%NC%
echo %YELLOW%Leave fields blank to skip superuser creation%NC%
python manage.py createsuperuser --username=admin --email=admin@example.com --noinput 2>nul
if %ERRORLEVEL% EQU 0 (
    echo %YELLOW%Superuser created with username 'admin' and password 'admin'%NC%
    echo %YELLOW%Please change the password after first login!%NC%
) else (
    echo %YELLOW%Superuser already exists or could not be created%NC%
)

:: 7. Install Node.js dependencies
echo %YELLOW%[7/8] Installing Node.js dependencies...%NC%
cd /d "%FRONTEND_DIR%"
if exist "package-lock.json" (
    npm ci
) else (
    npm install
)
if %ERRORLEVEL% NEQ 0 (
    echo %YELLOW%Warning: Failed to install Node.js dependencies%NC%
)

:: 8. Create required directories
echo %YELLOW%[8/8] Creating required directories...%NC%
for %%d in ("%PROJECT_ROOT%static" "%PROJECT_ROOT%media" "%PROJECT_ROOT%logs") do (
    if not exist "%%~d" (
        mkdir "%%~d"
        echo Created directory: %%~d
    )
)

:: Complete
echo.
echo %GREEN%=== Setup completed successfully! ===%NC%
echo.
echo %GREEN%To start the development servers, run:%NC%
echo   1. %PROJECT_ROOT%start-dev.bat
echo.
echo %GREEN%Or start them manually:%NC%
echo   Backend:  cd /d "%BACKEND_DIR%" && "%VENV_DIR%\Scripts\activate.bat" && python manage.py runserver
echo   Frontend: cd /d "%FRONTEND_DIR%" && npm run dev
echo.
pause