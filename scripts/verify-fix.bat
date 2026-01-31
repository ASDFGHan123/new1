@echo off
REM Verification script for 192.168.2.33 signin fix

echo.
echo ========================================
echo   Signin Fix Verification
echo   IP: 192.168.2.33
echo ========================================
echo.

REM Check if .env.local exists
echo [CHECK 1] Verifying .env.local...
if exist .env.local (
    echo [OK] .env.local exists
    findstr "VITE_API_URL" .env.local >nul
    if !errorlevel! equ 0 (
        echo [OK] VITE_API_URL is set
        for /f "tokens=2 delims==" %%a in ('findstr "VITE_API_URL" .env.local') do (
            echo     Value: %%a
        )
    ) else (
        echo [ERROR] VITE_API_URL not found in .env.local
    )
) else (
    echo [ERROR] .env.local not found
)
echo.

REM Check backend
echo [CHECK 2] Checking backend on port 8000...
netstat -ano | findstr :8000 >nul
if !errorlevel! equ 0 (
    echo [OK] Backend running
) else (
    echo [ERROR] Backend NOT running
    echo Start with: python manage.py runserver --settings=offchat_backend.settings.development
)
echo.

REM Check frontend
echo [CHECK 3] Checking frontend on port 5173...
netstat -ano | findstr :5173 >nul
if !errorlevel! equ 0 (
    echo [OK] Frontend running
) else (
    echo [ERROR] Frontend NOT running
    echo Start with: npm run dev
)
echo.

REM Test API
echo [CHECK 4] Testing API endpoint...
curl -s -X POST http://192.168.2.33:8000/api/auth/login/ ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"admin\",\"password\":\"12341234\"}" > api_test.json 2>&1

if exist api_test.json (
    findstr "tokens" api_test.json >nul
    if !errorlevel! equ 0 (
        echo [OK] API responding with tokens
    ) else (
        findstr "access" api_test.json >nul
        if !errorlevel! equ 0 (
            echo [OK] API responding with access token
        ) else (
            echo [WARN] API responded but check response:
            type api_test.json
        )
    )
    del api_test.json
) else (
    echo [ERROR] Could not reach API
)
echo.

echo ========================================
echo   Next Steps
echo ========================================
echo.
echo 1. Restart backend:
echo    python manage.py runserver --settings=offchat_backend.settings.development
echo.
echo 2. Restart frontend:
echo    npm run dev
echo.
echo 3. Clear browser cache (Ctrl+Shift+Delete)
echo.
echo 4. Test signin:
echo    http://192.168.2.33:5173
echo    Username: admin
echo    Password: 12341234
echo.
echo 5. Check browser console (F12) for [API] logs
echo.
pause
