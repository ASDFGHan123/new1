@echo off
setlocal enabledelayedexpansion

echo Setting up OffChat Development Environment...

echo.
echo Creating Python virtual environment...
python -m venv venv
if errorlevel 1 goto error

echo.
echo Activating virtual environment...
call venv\Scripts\activate.bat
if errorlevel 1 goto error

echo.
echo Installing Python dependencies...
call venv\Scripts\python.exe -m pip install --upgrade pip setuptools
call venv\Scripts\pip install -r requirements-dev.txt
if errorlevel 1 goto error

echo.
echo Creating Django migrations...
call venv\Scripts\python.exe manage.py makemigrations --settings=offchat_backend.settings.development
if errorlevel 1 goto error

echo.
echo Running Django migrations...
call venv\Scripts\python.exe manage.py migrate --settings=offchat_backend.settings.development
if errorlevel 1 goto error

echo.
echo Installing Node.js dependencies...
npm ci
if errorlevel 1 goto error

echo.
echo Creating superuser...
call venv\Scripts\python.exe manage.py createsuperuser --settings=offchat_backend.settings.development
if errorlevel 1 goto error

echo.
echo Setup complete! Starting development servers...
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
pause
goto end

:error
echo.
echo ERROR: Setup failed. Please check the error messages above.
pause

:end
endlocal
