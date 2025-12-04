@echo off
REM Comprehensive fix for Python 3.13 dependency issues
echo 🐍 Python Dependency Fix Script
echo ================================

REM Check if we're in a virtual environment
if exist "venv\Scripts\activate.bat" (
    echo 📦 Virtual environment detected. Activating...
    call venv\Scripts\activate.bat
) else (
    echo ⚠️  No virtual environment found. Continuing with system Python...
)

echo.
echo 🔄 Step 1: Upgrading pip to latest version...
python -m pip install --upgrade pip setuptools wheel

echo.
echo 🧹 Step 2: Clearing pip cache completely...
python -m pip cache purge

echo.
echo 🗑️  Step 3: Uninstalling potentially problematic packages...
python -m pip uninstall -y django djangorestframework django-cors-headers django-filter django-debug-toolbar pillow cryptography psycopg2-binary channels channels-redis

echo.
echo 📦 Step 4: Installing essential packages only...
python -m pip install Django djangorestframework django-cors-headers python-decouple python-dotenv requests pytz asgiref

echo.
echo ✅ Testing Django installation...
python manage.py check

echo.
echo 🎉 Fix completed! If Django check passed, your basic setup is working.
echo You can now add packages gradually as needed.
echo.
pause