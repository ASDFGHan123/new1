@echo off
REM Get LAN IP and display connection information
echo.
echo ========================================
echo   OffChat Admin - LAN Connection Info
echo ========================================
echo.

REM Get IP address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /R "IPv4 Address"') do (
    set "ip=%%a"
    set "ip=!ip:~1!"
)

if defined ip (
    echo Your Machine IP Address: %ip%
    echo.
    echo Access the application from other devices using:
    echo.
    echo Frontend Dashboard:
    echo   http://%ip%:5173
    echo.
    echo Backend API:
    echo   http://%ip%:8000
    echo.
    echo Django Admin:
    echo   http://%ip%:8000/admin
    echo.
) else (
    echo Could not determine IP address.
    echo Please run 'ipconfig' manually to find your IPv4 Address.
)

echo ========================================
echo Make sure both servers are running:
echo   - Frontend: npm run dev
echo   - Backend: python manage.py runserver
echo ========================================
echo.
pause
