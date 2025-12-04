@echo off
echo ================================================
echo OffChat Admin Dashboard - Server Status Check
echo ================================================
echo.

echo Checking server status and dependencies...
echo.

:: Check Node.js installation
echo [DEPENDENCY] Node.js...
node --version >nul 2>&1
if %errorLevel% == 0 (
    for /f "tokens=1" %%i in ('node --version') do echo [OK] Node.js %%i installed
) else (
    echo [ERROR] Node.js not installed
)

:: Check Python installation
echo [DEPENDENCY] Python...
python --version >nul 2>&1
if %errorLevel% == 0 (
    for /f "tokens=2" %%i in ('python --version') do echo [OK] Python %%i installed
) else (
    echo [ERROR] Python not installed
)

:: Check npm
echo [DEPENDENCY] npm...
npm --version >nul 2>&1
if %errorLevel% == 0 (
    for /f "tokens=1" %%i in ('npm --version') do echo [OK] npm %%i installed
) else (
    echo [ERROR] npm not installed
)

:: Check Redis (optional)
echo [DEPENDENCY] Redis...
redis-cli ping >nul 2>&1
if %errorLevel% == 0 (
    echo [OK] Redis server running
) else (
    echo [WARNING] Redis not running (optional for WebSocket features)
)

echo.
echo [SERVER STATUS]
echo ================================================

:: Check React server on port 5173
echo React Frontend (Port 5173):
netstat -ano | findstr :5173 >nul 2>&1
if %errorLevel% == 0 (
    echo [RUNNING] React dev server is active
    for /f "tokens=5" %%i in ('netstat -ano ^| findstr :5173') do (
        echo Process ID: %%i
        tasklist /FI "PID eq %%i" | findstr node.exe >nul 2>&1 && echo Command: node.exe (React dev server)
    )
) else (
    echo [STOPPED] React dev server not running
)

echo.

:: Check Django server on port 8000
echo Django Backend (Port 8000):
netstat -ano | findstr :8000 >nul 2>&1
if %errorLevel% == 0 (
    echo [RUNNING] Django server is active
    for /f "tokens=5" %%i in ('netstat -ano ^| findstr :8000') do (
        echo Process ID: %%i
        tasklist /FI "PID eq %%i" | findstr python.exe >nul 2>&1 && echo Command: python.exe (Django server)
    )
) else (
    echo [STOPPED] Django server not running
)

echo.
echo [PROJECT FILES]
echo ================================================

:: Check if key files exist
if exist "package.json" (
    echo [OK] package.json found
) else (
    echo [ERROR] package.json not found
)

if exist "requirements.txt" (
    echo [OK] requirements.txt found
) else (
    echo [ERROR] requirements.txt not found
)

if exist "manage.py" (
    echo [OK] manage.py found
) else (
    echo [ERROR] manage.py not found (not in Django project root?)
)

if exist "src/App.tsx" (
    echo [OK] src/App.tsx found
) else (
    echo [ERROR] src/App.tsx not found (not in React project root?)
)

if exist "node_modules" (
    echo [OK] node_modules directory found
) else (
    echo [WARNING] node_modules not found - run npm install
)

if exist "venv" (
    echo [OK] Python virtual environment found
) else (
    echo [WARNING] Python virtual environment not found - run setup
)

echo.
echo [ACCESS POINTS]
echo ================================================
echo If servers are running, you can access:
echo - Frontend: http://localhost:5173
echo - Backend API: http://localhost:8000/api/
echo - Django Admin: http://localhost:8000/admin
echo.
echo Default admin credentials:
echo Username: admin
echo Password: 12341234

echo.
echo [ACTIONS]
echo ================================================
echo Available scripts:
echo - start_project.bat : Start both servers
echo - stop_servers.bat  : Stop all servers
echo - check_status.bat  : Check this status (current)
echo.

pause