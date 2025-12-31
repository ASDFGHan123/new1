@echo off
setlocal enabledelayedexpansion

echo.
echo ========================================
echo   OffChat Development Servers
echo ========================================
echo.

REM Get machine IP
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /R "IPv4 Address"') do (
    set "ip=%%a"
    set "ip=!ip:~1!"
    goto :found_ip
)

:found_ip
echo Your Machine IP: %ip%
echo.
echo Starting Django backend on 0.0.0.0:8000...
start cmd /k "python manage.py runserver 0.0.0.0:8000 --settings=offchat_backend.settings.development"

echo Starting React frontend on 0.0.0.0:5173...
start cmd /k "npm run dev"

echo.
echo ========================================
echo   Access URLs
echo ========================================
echo.
echo Local Machine:
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:8000
echo.
echo Other Devices (LAN):
echo   Frontend: http://%ip%:5173
echo   Backend:  http://%ip%:8000
echo.
echo Login Credentials:
echo   Username: admin
echo   Password: 12341234
echo.
echo ========================================
echo.
echo Servers are starting in new windows...
echo Press any key to close this window...
pause

endlocal
