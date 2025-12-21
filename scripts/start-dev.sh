#!/bin/bash

echo "Starting OffChat Development Servers..."

echo ""
echo "Activating virtual environment..."
source venv/bin/activate

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
