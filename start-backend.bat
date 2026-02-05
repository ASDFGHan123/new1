@echo off
REM Start Django backend on all network interfaces (0.0.0.0)
REM This allows access from other devices on the LAN

echo.
echo ========================================
echo   Starting OffChat Backend
echo   Listening on: 0.0.0.0:8000
echo   Access from LAN: http://192.168.2.33:8000
echo ========================================
echo.

cd backend
python manage.py runserver 0.0.0.0:8000 --settings=offchat_backend.settings.development

pause
