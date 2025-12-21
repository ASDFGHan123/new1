@echo off
setlocal enabledelayedexpansion

echo Setting up OffChat Development Environment...

echo.
echo Installing Python dependencies...
pip install -r requirements-dev.txt
if errorlevel 1 goto error

echo.
echo Installing Node.js dependencies...
npm install
if errorlevel 1 goto error

echo.
echo Creating Django migrations...
python manage.py makemigrations --settings=offchat_backend.settings.development
if errorlevel 1 goto error

echo.
echo Running Django migrations...
python manage.py migrate --settings=offchat_backend.settings.development
if errorlevel 1 goto error

echo.
echo Creating superuser...
python manage.py createsuperuser --settings=offchat_backend.settings.development
if errorlevel 1 goto error

echo.
echo Setup complete! Starting development servers...
echo.
echo Starting Django backend...
start cmd /k "python manage.py runserver --settings=offchat_backend.settings.development"

echo.
echo Starting React frontend...
start cmd /k "npm run dev"

echo.
echo Development servers started!
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
pause
goto end

:error
echo.
echo ERROR: Setup failed. Please check the error messages above.
pause

:end
endlocal
