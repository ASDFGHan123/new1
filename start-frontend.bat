@echo off
REM Start Vite frontend on all network interfaces

echo.
echo ========================================
echo   Starting OffChat Frontend
echo   Listening on: 0.0.0.0:5173
echo   Access from LAN: http://192.168.2.33:5173
echo ========================================
echo.

npm run dev

pause
