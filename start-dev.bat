@echo off
echo Starting OffChat Development Environment...
echo.

echo Starting Django Backend...
start "Django Backend" cmd /k "python manage.py runserver --settings=offchat_backend.settings.development"

echo Waiting for backend to start...
timeout /t 3 /nobreak > nul

echo Starting React Frontend...
start "React Frontend" cmd /k "npm run dev"

echo.
echo Development servers are starting...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
echo.
echo Press any key to exit...
pause > nul