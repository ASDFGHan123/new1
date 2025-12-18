@echo off
echo Setting up OffChat Development Environment...

echo.
echo Installing Python dependencies...
pip install -r requirements-dev.txt

echo.
echo Installing Node.js dependencies...
npm install

echo.
echo Running Django migrations...
python manage.py migrate --settings=offchat_backend.settings.development

echo.
echo Creating superuser (optional)...
python manage.py createsuperuser --settings=offchat_backend.settings.development

echo.
echo Setup complete! Run 'scripts\start-dev.bat' to start development servers.
pause