#!/bin/bash

set -e

echo "Setting up OffChat Development Environment..."

echo ""
echo "Creating Python virtual environment..."
python3 -m venv venv

echo ""
echo "Activating virtual environment..."
source venv/bin/activate

echo ""
echo "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements-dev.txt

echo ""
echo "Creating Django migrations..."
python manage.py makemigrations --settings=offchat_backend.settings.development

echo ""
echo "Running Django migrations..."
python manage.py migrate --settings=offchat_backend.settings.development

echo ""
echo "Installing Node.js dependencies..."
npm ci

echo ""
echo "Creating superuser..."
python manage.py createsuperuser --settings=offchat_backend.settings.development

echo ""
echo "Setup complete! Starting development servers..."
echo ""
echo "Starting Django backend..."
python manage.py runserver --settings=offchat_backend.settings.development &
BACKEND_PID=$!

echo ""
echo "Starting React frontend..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "Development servers started!"
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop servers"

wait $BACKEND_PID $FRONTEND_PID
