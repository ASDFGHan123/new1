@echo off
echo Starting OffChat Development Environment...

echo.
echo Starting Django Backend...
start "Django Backend" cmd /k "cd /d %~dp0.. && python manage.py runserver 8000 --settings=offchat_backend.settings.development"

timeout /t 3 /nobreak > nul

echo.
echo Starting React Frontend...
start "React Frontend" cmd /k "cd /d %~dp0.. && npm run dev"

echo.
echo Development servers starting...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
echo.
echo Press any key to exit...
pause > nul