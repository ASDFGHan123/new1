@echo off
setlocal enabledelayedexpansion

echo.
echo ========================================
echo   OffChat LAN Signin Test
echo ========================================
echo.

REM Get machine IP
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /R "IPv4 Address"') do (
    set "ip=%%a"
    set "ip=!ip:~1!"
    goto :found_ip
)

:found_ip
echo Machine IP: %ip%
echo.

REM Test 1: Check if backend is running
echo [TEST 1] Checking if backend is running on port 8000...
netstat -ano | findstr :8000 >nul
if %errorlevel% equ 0 (
    echo [PASS] Backend is running
) else (
    echo [FAIL] Backend is NOT running
    echo Start it with: python manage.py runserver --settings=offchat_backend.settings.development
    goto :end
)
echo.

REM Test 2: Check if frontend is running
echo [TEST 2] Checking if frontend is running on port 5173...
netstat -ano | findstr :5173 >nul
if %errorlevel% equ 0 (
    echo [PASS] Frontend is running
) else (
    echo [FAIL] Frontend is NOT running
    echo Start it with: npm run dev
    goto :end
)
echo.

REM Test 3: Test API endpoint with curl
echo [TEST 3] Testing API login endpoint...
echo Testing: http://%ip%:8000/api/auth/login/
echo.

curl -s -X POST http://%ip%:8000/api/auth/login/ ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"admin\",\"password\":\"12341234\"}" > response.json 2>&1

if exist response.json (
    echo Response received:
    type response.json
    echo.
    
    REM Check if response contains tokens
    findstr /M "tokens" response.json >nul
    if !errorlevel! equ 0 (
        echo [PASS] API returned tokens - Backend is working!
    ) else (
        findstr /M "access" response.json >nul
        if !errorlevel! equ 0 (
            echo [PASS] API returned access token - Backend is working!
        ) else (
            echo [WARN] API responded but no tokens found
            echo Check if credentials are correct
        )
    )
    del response.json
) else (
    echo [FAIL] Could not reach API endpoint
    echo Make sure:
    echo   1. Backend is running
    echo   2. Firewall allows port 8000
    echo   3. You're using the correct IP address
    goto :end
)
echo.

REM Test 4: Check frontend accessibility
echo [TEST 4] Testing frontend accessibility...
curl -s -o nul -w "HTTP Status: %%{http_code}\n" http://%ip%:5173/ 2>nul
if !errorlevel! equ 0 (
    echo [PASS] Frontend is accessible
) else (
    echo [WARN] Could not verify frontend (may still work)
)
echo.

REM Test 5: Verify .env.local setup
echo [TEST 5] Checking .env.local configuration...
if exist .env.local (
    echo [INFO] .env.local exists
    findstr "VITE_API_URL" .env.local >nul
    if !errorlevel! equ 0 (
        echo [PASS] VITE_API_URL is configured
        for /f "tokens=2 delims==" %%a in ('findstr "VITE_API_URL" .env.local') do (
            echo Current value: %%a
        )
    ) else (
        echo [WARN] VITE_API_URL not set in .env.local
    )
) else (
    echo [INFO] .env.local not found (using auto-detection)
)
echo.

REM Summary
echo ========================================
echo   Test Summary
echo ========================================
echo.
echo Access URLs:
echo   Frontend: http://%ip%:5173
echo   Backend:  http://%ip%:8000
echo   Admin:    http://%ip%:8000/admin
echo.
echo Default Credentials:
echo   Username: admin
echo   Password: 12341234
echo.
echo Next Steps:
echo   1. Open http://%ip%:5173 in browser
echo   2. Click "Admin Login"
echo   3. Enter credentials above
echo   4. You should be logged in!
echo.
echo If signin fails:
echo   1. Check browser console (F12)
echo   2. Create .env.local with: VITE_API_URL=http://%ip%:8000/api
echo   3. Restart frontend: npm run dev
echo.

:end
pause
