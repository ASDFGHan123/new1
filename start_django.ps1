# Django Backend Server Starter
Write-Host "Starting Django Backend Server..." -ForegroundColor Green
Write-Host "Server will be available at:" -ForegroundColor Blue
Write-Host "  - Local: http://localhost:8000" -ForegroundColor White
Write-Host "  - Network: http://192.168.2.9:8000" -ForegroundColor White
Write-Host "  - Django Admin: http://192.168.2.9:8000/admin" -ForegroundColor Blue
Write-Host "  - API Endpoints: http://192.168.2.9:8000/api/" -ForegroundColor Blue
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Activate virtual environment and start server
& ".\venv\Scripts\Activate.ps1"
python manage.py runserver 0.0.0.0:8000