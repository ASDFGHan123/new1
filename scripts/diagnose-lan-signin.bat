@echo off
REM Diagnostic script for LAN signin issues

echo.
echo ========================================
echo   OffChat LAN Signin Diagnostics
echo ========================================
echo.

REM Get machine IP
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /R "IPv4 Address"') do (
    set "ip=%%a"
    set "ip=!ip:~1!"
)

echo Your Machine IP: %ip%
echo.

REM Check if backend is running
echo Checking Backend (Port 8000)...
netstat -ano | findstr :8000 >nul
if %errorlevel% equ 0 (
    echo [OK] Backend appears to be running on port 8000
) else (
    echo [ERROR] Backend not running on port 8000
    echo Start it with: python manage.py runserver --settings=offchat_backend.settings.development
)
echo.

REM Check if frontend is running
echo Checking Frontend (Port 5173)...
netstat -ano | findstr :5173 >nul
if %errorlevel% equ 0 (
    echo [OK] Frontend appears to be running on port 5173
) else (
    echo [ERROR] Frontend not running on port 5173
    echo Start it with: npm run dev
)
echo.

REM Test API endpoint
echo Testing API Endpoint...
echo Attempting to reach: http://%ip%:8000/api/auth/login/
echo.
echo If you see a JSON response below, the API is accessible:
echo.
curl -s -X POST http://%ip%:8000/api/auth/login/ ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"admin\",\"password\":\"12341234\"}" 2>nul || (
    echo [ERROR] Could not reach API endpoint
    echo Make sure:
    echo   1. Backend is running
    echo   2. Firewall allows port 8000
    echo   3. You're using the correct IP address
)

echo.
echo ========================================
echo Access URLs:
echo   Frontend: http://%ip%:5173
echo   Backend:  http://%ip%:8000
echo   Admin:    http://%ip%:8000/admin
echo ========================================
echo.
echo If signin still fails:
echo   1. Check browser console (F12) for exact error
echo   2. Create .env.local with: VITE_API_URL=http://%ip%:8000/api
echo   3. Restart frontend: npm run dev
echo.
pause
