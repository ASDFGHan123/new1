@echo off
echo ================================================
echo OffChat Admin Dashboard - Server Management
echo ================================================
echo.

echo [1/4] Checking for running processes on our ports...

:: Check port 5173 (React dev server)
echo Checking port 5173 (React frontend)...
netstat -ano | findstr :5173 >nul 2>&1
if %errorLevel% == 0 (
    echo [FOUND] React server is running on port 5173
    for /f "tokens=5" %%i in ('netstat -ano ^| findstr :5173') do (
        echo Process ID: %%i
    )
) else (
    echo [CLEAR] Port 5173 is free
)

:: Check port 8000 (Django)
echo Checking port 8000 (Django backend)...
netstat -ano | findstr :8000 >nul 2>&1
if %errorLevel% == 0 (
    echo [FOUND] Django server is running on port 8000
    for /f "tokens=5" %%i in ('netstat -ano ^| findstr :8000') do (
        echo Process ID: %%i
    )
) else (
    echo [CLEAR] Port 8000 is free
)

:: Check for Node processes
echo Checking for Node.js processes...
tasklist /FI "IMAGENAME eq node.exe" 2>NUL | find /I /N "node.exe">NUL
if %errorLevel% == 0 (
    echo [FOUND] Node.js processes detected
    tasklist /FI "IMAGENAME eq node.exe"
) else (
    echo [CLEAR] No Node.js processes running
)

:: Check for Python processes
echo Checking for Python processes...
tasklist /FI "IMAGENAME eq python.exe" 2>NUL | find /I /N "python.exe">NUL
if %errorLevel% == 0 (
    echo [FOUND] Python processes detected
    tasklist /FI "IMAGENAME eq python.exe"
) else (
    echo [CLEAR] No Python processes running
)

echo.
echo [2/4] Stopping all related processes...

:: Kill processes on port 5173
echo Killing processes on port 5173...
for /f "tokens=5" %%i in ('netstat -ano ^| findstr :5173') do (
    echo Killing process %%i
    taskkill /PID %%i /F >nul 2>&1
    if %errorLevel% == 0 (
        echo [OK] Process %%i killed
    ) else (
        echo [ERROR] Failed to kill process %%i
    )
)

:: Kill processes on port 8000
echo Killing processes on port 8000...
for /f "tokens=5" %%i in ('netstat -ano ^| findstr :8000') do (
    echo Killing process %%i
    taskkill /PID %%i /F >nul 2>&1
    if %errorLevel% == 0 (
        echo [OK] Process %%i killed
    ) else (
        echo [ERROR] Failed to kill process %%i
    )
)

:: Kill all Node processes
echo Killing all Node.js processes...
taskkill /IM node.exe /F >nul 2>&1
if %errorLevel% == 0 (
    echo [OK] All Node.js processes killed
) else (
    echo [INFO] No Node.js processes to kill
)

:: Kill all Python processes (be careful with this)
echo Warning: This will kill ALL Python processes on the system
set /p confirm="Are you sure you want to kill all Python processes? (y/N): "
if /i "%confirm%"=="y" (
    taskkill /IM python.exe /F >nul 2>&1
    if %errorLevel% == 0 (
        echo [OK] All Python processes killed
    ) else (
        echo [INFO] No Python processes to kill
    )
) else (
    echo [SKIPPED] Python processes left running
)

echo.
echo [3/4] Verifying ports are now free...

:: Verify ports are free
echo Verifying port 5173...
netstat -ano | findstr :5173 >nul 2>&1
if %errorLevel% == 0 (
    echo [WARNING] Port 5173 still has processes
    for /f "tokens=5" %%i in ('netstat -ano ^| findstr :5173') do echo Process: %%i
) else (
    echo [OK] Port 5173 is now free
)

echo Verifying port 8000...
netstat -ano | findstr :8000 >nul 2>&1
if %errorLevel% == 0 (
    echo [WARNING] Port 8000 still has processes
    for /f "tokens=5" %%i in ('netstat -ano ^| findstr :8000') do echo Process: %%i
) else (
    echo [OK] Port 8000 is now free
)

echo.
echo [4/4] Summary...
echo ================================================
echo Server Management Complete
echo ================================================
echo.
echo If you want to restart the servers, run: start_project.bat
echo.
echo Current status:
netstat -ano | findstr :5173 >nul 2>&1 && echo - React server: RUNNING on port 5173 || echo - React server: STOPPED
netstat -ano | findstr :8000 >nul 2>&1 && echo - Django server: RUNNING on port 8000 || echo - Django server: STOPPED
echo.
pause