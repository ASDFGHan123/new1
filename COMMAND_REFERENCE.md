# Command Reference Guide

## 🚀 Quick Commands

### Start All Services (Recommended)

**Windows - Create batch file `start-all.bat`:**
```batch
@echo off
echo Starting OffChat Admin Dashboard...

REM Terminal 1: Django Server
start "Django Server" cmd /k "venv\Scripts\activate && python manage.py runserver --settings=offchat_backend.settings.development"

REM Terminal 2: Redis Server
start "Redis Server" cmd /k "redis-server"

REM Terminal 3: Celery Worker
start "Celery Worker" cmd /k "venv\Scripts\activate && celery -A offchat_backend worker --beat -l info"

REM Terminal 4: React Server
start "React Server" cmd /k "npm run dev"

echo All services started!
echo Django: http://localhost:8000
echo React: http://localhost:5173
echo Admin: http://localhost:5173/admin-login
```

**macOS/Linux - Create shell script `start-all.sh`:**
```bash
#!/bin/bash

# Terminal 1: Django Server
gnome-terminal -- bash -c "source venv/bin/activate && python manage.py runserver --settings=offchat_backend.settings.development; exec bash"

# Terminal 2: Redis Server
gnome-terminal -- bash -c "redis-server; exec bash"

# Terminal 3: Celery Worker
gnome-terminal -- bash -c "source venv/bin/activate && celery -A offchat_backend worker --beat -l info; exec bash"

# Terminal 4: React Server
gnome-terminal -- bash -c "npm run dev; exec bash"

echo "All services started!"
```

---

## 📦 Installation Commands

### Initial Setup
```bash
# Clone repository
git clone <repository-url>
cd offchat-admin-nexus-main

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements-dev.txt

# Install Node dependencies
npm install

# Run migrations
python manage.py migrate --settings=offchat_backend.settings.development

# Create superuser
python manage.py createsuperuser --settings=offchat_backend.settings.development
```

### Install Additional Dependencies
```bash
# Install Redis (Windows - using WSL or Chocolatey)
choco install redis

# Install Redis (macOS)
brew install redis

# Install Redis (Linux)
sudo apt-get install redis-server

# Install Celery
pip install celery

# Install Django Channels
pip install channels
```

---

## 🔧 Backend Commands

### Django Server
```bash
# Start development server
python manage.py runserver --settings=offchat_backend.settings.development

# Start on specific port
python manage.py runserver 0.0.0.0:8000 --settings=offchat_backend.settings.development

# Run migrations
python manage.py migrate --settings=offchat_backend.settings.development

# Create migrations
python manage.py makemigrations --settings=offchat_backend.settings.development

# Create superuser
python manage.py createsuperuser --settings=offchat_backend.settings.development

# Run tests
python manage.py test --settings=offchat_backend.settings.development

# Django shell
python manage.py shell --settings=offchat_backend.settings.development

# Collect static files
python manage.py collectstatic --settings=offchat_backend.settings.development

# Clear cache
python manage.py clear_cache --settings=offchat_backend.settings.development
```

### Redis Commands
```bash
# Start Redis server
redis-server

# Start Redis on specific port
redis-server --port 6379

# Connect to Redis CLI
redis-cli

# Check Redis connection
redis-cli ping
# Expected output: PONG

# Flush all data
redis-cli FLUSHALL

# Monitor Redis commands
redis-cli MONITOR

# Get Redis info
redis-cli INFO
```

### Celery Commands
```bash
# Start Celery worker with beat scheduler
celery -A offchat_backend worker --beat -l info

# Start Celery worker only (without beat)
celery -A offchat_backend worker -l info

# Start Celery beat scheduler only
celery -A offchat_backend beat -l info

# Purge all tasks
celery -A offchat_backend purge

# Inspect active tasks
celery -A offchat_backend inspect active

# Inspect scheduled tasks
celery -A offchat_backend inspect scheduled

# Inspect registered tasks
celery -A offchat_backend inspect registered

# Revoke a task
celery -A offchat_backend revoke <task_id>

# Revoke all tasks
celery -A offchat_backend revoke --all
```

---

## 🎨 Frontend Commands

### React Development
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint

# Run tests
npm run test

# Run tests with coverage
npm run test:coverage

# Format code
npm run format

# Type check
npm run type-check
```

---

## 🗄️ Database Commands

### Django ORM
```bash
# Open Django shell
python manage.py shell --settings=offchat_backend.settings.development

# In Django shell:
from users.models import User

# Get all users
users = User.objects.all()

# Get specific user
user = User.objects.get(username='admin')

# Get user by ID
user = User.objects.get(id=1)

# Filter users
online_users = User.objects.filter(online_status='online')
active_users = User.objects.filter(status='active')

# Update user
user.online_status = 'offline'
user.save()

# Update multiple users
User.objects.filter(status='pending').update(status='active')

# Delete user
user.delete()

# Count users
count = User.objects.count()

# Get user statistics
from django.db.models import Count
stats = User.objects.aggregate(
    total=Count('id'),
    online=Count('id', filter=Q(online_status='online')),
    active=Count('id', filter=Q(status='active'))
)
```

### Database Backup/Restore
```bash
# Backup database
python manage.py dumpdata --settings=offchat_backend.settings.development > backup.json

# Restore database
python manage.py loaddata backup.json --settings=offchat_backend.settings.development

# Backup specific app
python manage.py dumpdata users --settings=offchat_backend.settings.development > users_backup.json

# Export to CSV
python manage.py dumpdata users --format=json --settings=offchat_backend.settings.development | python -m json.tool
```

---

## 🔍 Debugging Commands

### Django Debug
```bash
# Enable debug mode
DEBUG = True  # in settings

# Run with verbose output
python manage.py runserver --verbosity=2 --settings=offchat_backend.settings.development

# Check settings
python manage.py diffsettings --settings=offchat_backend.settings.development

# Show URLs
python manage.py show_urls --settings=offchat_backend.settings.development

# Check installed apps
python manage.py check --settings=offchat_backend.settings.development
```

### Celery Debug
```bash
# Run Celery with debug logging
celery -A offchat_backend worker --beat -l debug

# Run specific task
celery -A offchat_backend call users.tasks.check_and_mark_offline_users

# Monitor Celery events
celery -A offchat_backend events

# Inspect worker stats
celery -A offchat_backend inspect stats
```

### Frontend Debug
```bash
# Run with source maps
npm run dev

# Build with source maps
npm run build -- --sourcemap

# Run tests in watch mode
npm run test -- --watch

# Run tests with coverage
npm run test:coverage
```

---

## 📊 Monitoring Commands

### Check System Status
```bash
# Check if Django is running
curl http://localhost:8000/api/auth/verify/

# Check if React is running
curl http://localhost:5173/

# Check if Redis is running
redis-cli ping

# Check if Celery is running
celery -A offchat_backend inspect active

# Check all services
curl http://localhost:8000/api/users/all-users/ -H "Authorization: Bearer <token>"
```

### View Logs
```bash
# Django logs (in terminal where Django is running)
# Celery logs (in terminal where Celery is running)
# React logs (in terminal where React is running)

# Save logs to file
python manage.py runserver --settings=offchat_backend.settings.development > django.log 2>&1

# View logs in real-time
tail -f django.log

# Search logs
grep "error" django.log
grep "heartbeat" django.log
```

---

## 🧹 Cleanup Commands

### Clear Cache
```bash
# Clear Django cache
python manage.py clear_cache --settings=offchat_backend.settings.development

# Clear Redis cache
redis-cli FLUSHALL

# Clear browser cache
# In browser DevTools: Application > Clear site data
```

### Clean Build Files
```bash
# Remove build directory
rm -rf dist/

# Remove node_modules
rm -rf node_modules/

# Remove Python cache
find . -type d -name __pycache__ -exec rm -r {} +
find . -type f -name "*.pyc" -delete

# Remove virtual environment
rm -rf venv/
```

### Reset Database
```bash
# Delete database file
rm db.sqlite3

# Run migrations
python manage.py migrate --settings=offchat_backend.settings.development

# Create superuser
python manage.py createsuperuser --settings=offchat_backend.settings.development
```

---

## 🚀 Deployment Commands

### Production Build
```bash
# Build frontend
npm run build

# Collect static files
python manage.py collectstatic --settings=offchat_backend.settings.production

# Run migrations
python manage.py migrate --settings=offchat_backend.settings.production

# Start with Gunicorn
gunicorn offchat_backend.wsgi:application --settings=offchat_backend.settings.production

# Start with Gunicorn (with workers)
gunicorn offchat_backend.wsgi:application --workers 4 --settings=offchat_backend.settings.production

# Start Celery for production
celery -A offchat_backend worker --beat -l info
```

### Docker Commands
```bash
# Build Docker image
docker build -t offchat-admin .

# Run Docker container
docker run -p 8000:8000 offchat-admin

# Run with Docker Compose
docker-compose up

# Stop Docker container
docker-compose down
```

---

## 🔐 Security Commands

### Generate Secret Key
```bash
# Python
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"

# Bash
openssl rand -base64 32
```

### Create SSL Certificate
```bash
# Generate self-signed certificate
openssl req -x509 -newkey rsa:4096 -nodes -out cert.pem -keyout key.pem -days 365
```

### Change Admin Password
```bash
# Django shell
python manage.py shell --settings=offchat_backend.settings.development

# In shell:
from django.contrib.auth import get_user_model
User = get_user_model()
user = User.objects.get(username='admin')
user.set_password('new_password')
user.save()
```

---

## 📱 API Testing Commands

### Using curl
```bash
# Login
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"12341234"}'

# Get users
curl -X GET http://localhost:8000/api/users/all-users/ \
  -H "Authorization: Bearer <token>"

# Send heartbeat
curl -X POST http://localhost:8000/api/users/heartbeat/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"

# Get user profile
curl -X GET http://localhost:8000/api/users/profile/ \
  -H "Authorization: Bearer <token>"
```

### Using Postman
1. Import API collection
2. Set base URL: http://localhost:8000/api
3. Set authorization token
4. Test endpoints

### Using Python requests
```python
import requests

# Login
response = requests.post('http://localhost:8000/api/auth/login/', json={
    'username': 'admin',
    'password': '12341234'
})
token = response.json()['tokens']['access']

# Get users
headers = {'Authorization': f'Bearer {token}'}
response = requests.get('http://localhost:8000/api/users/all-users/', headers=headers)
users = response.json()['users']

# Send heartbeat
response = requests.post('http://localhost:8000/api/users/heartbeat/', headers=headers)
print(response.json())
```

---

## 🆘 Emergency Commands

### Stop All Services
```bash
# Windows: Ctrl+C in each terminal or:
taskkill /F /IM python.exe
taskkill /F /IM node.exe
taskkill /F /IM redis-server.exe

# macOS/Linux:
pkill -f "python manage.py runserver"
pkill -f "celery"
pkill -f "npm run dev"
pkill -f "redis-server"
```

### Reset Everything
```bash
# Stop all services
# Delete database
rm db.sqlite3

# Clear cache
redis-cli FLUSHALL

# Run migrations
python manage.py migrate --settings=offchat_backend.settings.development

# Create superuser
python manage.py createsuperuser --settings=offchat_backend.settings.development

# Restart all services
```

### Emergency Restart
```bash
# Kill all Python processes
pkill -9 python

# Kill all Node processes
pkill -9 node

# Kill Redis
pkill -9 redis-server

# Wait 5 seconds
sleep 5

# Restart all services
```

---

## 📚 Useful Resources

### Documentation
- Django: https://docs.djangoproject.com/
- DRF: https://www.django-rest-framework.org/
- Celery: https://docs.celeryproject.org/
- React: https://react.dev/
- Redis: https://redis.io/documentation

### Tools
- Postman: https://www.postman.com/
- VS Code: https://code.visualstudio.com/
- PyCharm: https://www.jetbrains.com/pycharm/
- Git: https://git-scm.com/

---

## 💡 Tips & Tricks

### Performance
```bash
# Run Django with threading
python manage.py runserver --nothreading

# Run Celery with multiple workers
celery -A offchat_backend worker -c 4

# Monitor performance
celery -A offchat_backend inspect stats
```

### Development
```bash
# Use Django extensions
python manage.py shell_plus --settings=offchat_backend.settings.development

# Use IPython for better shell
pip install ipython
python manage.py shell --settings=offchat_backend.settings.development

# Use Django Debug Toolbar
pip install django-debug-toolbar
```

### Testing
```bash
# Run specific test
python manage.py test users.tests.TestUserModel --settings=offchat_backend.settings.development

# Run with coverage
coverage run --source='.' manage.py test --settings=offchat_backend.settings.development
coverage report
```

---

**Last Updated**: 2024
**Version**: 1.0
**Status**: ✅ Complete
