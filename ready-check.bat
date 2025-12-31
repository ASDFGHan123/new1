@echo off
REM Quick verification that everything is ready for LAN signin testing

echo.
echo ========================================
echo   OffChat LAN Signin - Ready Check
echo ========================================
echo.

REM Get IP
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /R "IPv4 Address"') do (
    set "ip=%%a"
    set "ip=!ip:~1!"
    goto :found
)

:found
echo Your Machine IP: %ip%
echo.

REM Check backend
echo Checking Backend...
netstat -ano | findstr :8000 >nul
if %errorlevel% equ 0 (
    echo [OK] Backend running on port 8000
) else (
    echo [ERROR] Backend NOT running
    echo Start with: python manage.py runserver --settings=offchat_backend.settings.development
    goto :fail
)

REM Check frontend
echo Checking Frontend...
netstat -ano | findstr :5173 >nul
if %errorlevel% equ 0 (
    echo [OK] Frontend running on port 5173
) else (
    echo [ERROR] Frontend NOT running
    echo Start with: npm run dev
    goto :fail
)

echo.
echo ========================================
echo   ✓ Everything is Ready!
echo ========================================
echo.
echo Test Signin:
echo   1. Open browser on another device
echo   2. Go to: http://%ip%:5173
echo   3. Click "Admin Login"
echo   4. Enter: admin / 12341234
echo   5. Click "Sign In"
echo.
echo Expected: Admin dashboard loads
echo.
echo If signin fails:
echo   1. Check browser console (F12)
echo   2. Run: test-lan-signin.bat
echo   3. Create .env.local with API URL
echo.
pause
goto :end

:fail
echo.
echo ========================================
echo   ✗ Setup Incomplete
echo ========================================
echo.
pause

:end
