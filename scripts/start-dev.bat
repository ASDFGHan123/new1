@echo off
setlocal enabledelayedexpansion

echo Starting OffChat Development Servers...

echo.
echo Starting Django backend...
start cmd /k "call venv\Scripts\activate.bat && python manage.py runserver --settings=offchat_backend.settings.development"

echo.
echo Starting React frontend...
start cmd /k "npm run dev"

echo.
echo Development servers started!
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
echo.
echo Press any key to close this window...
pause

endlocal
