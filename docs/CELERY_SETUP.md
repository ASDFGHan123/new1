# Celery Setup Guide

## Overview
Celery is used for background task processing (async notifications, scheduled tasks, etc.). It requires Redis as a message broker.

## Prerequisites

### 1. Redis Installation

#### Windows
**Option A: Using Windows Subsystem for Linux (WSL)**
```bash
# In WSL terminal
sudo apt-get update
sudo apt-get install redis-server
redis-server
```

**Option B: Using Docker**
```bash
docker run -d -p 6379:6379 redis:latest
```

**Option C: Using Memurai (Windows Redis port)**
- Download from: https://github.com/microsoftarchive/redis/releases
- Install and run as service

#### macOS
```bash
brew install redis
redis-server
```

#### Linux
```bash
sudo apt-get install redis-server
redis-server
```

### 2. Verify Redis is Running
```bash
redis-cli ping
# Should return: PONG
```

## Starting Celery

### Method 1: Using Batch Script (Windows)
```bash
scripts\start-celery.bat
```

### Method 2: Manual Command
```bash
# Activate virtual environment first
venv\Scripts\activate

# Start Celery worker
celery -A offchat_backend worker -l info --concurrency=4
```

### Method 3: With Celery Beat (Scheduled Tasks)
```bash
# Terminal 1: Start Celery Worker
celery -A offchat_backend worker -l info

# Terminal 2: Start Celery Beat (in another terminal)
celery -A offchat_backend beat -l info
```

## Configuration

### Development Settings (`offchat_backend/settings/development.py`)
```python
# Celery Configuration
CELERY_BROKER_URL = 'redis://localhost:6379/0'
CELERY_RESULT_BACKEND = 'redis://localhost:6379/0'
CELERY_TASK_ALWAYS_EAGER = False  # Set to True to run tasks synchronously for testing
CELERY_TASK_EAGER_PROPAGATES = False
```

### Production Settings (`offchat_backend/settings/production.py`)
```python
# Use environment variables
CELERY_BROKER_URL = os.getenv('CELERY_BROKER_URL', 'redis://localhost:6379/0')
CELERY_RESULT_BACKEND = os.getenv('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0')
```

## Monitoring Celery

### View Active Tasks
```bash
celery -A offchat_backend inspect active
```

### View Registered Tasks
```bash
celery -A offchat_backend inspect registered
```

### View Worker Stats
```bash
celery -A offchat_backend inspect stats
```

### Using Flower (Web UI)
```bash
# Install Flower
pip install flower

# Start Flower
celery -A offchat_backend flower

# Access at http://localhost:5555
```

## Troubleshooting

### Issue: "Connection refused" error
**Solution**: Make sure Redis is running
```bash
redis-cli ping  # Should return PONG
```

### Issue: "No module named 'celery'"
**Solution**: Install dependencies
```bash
pip install -r requirements.txt
```

### Issue: Tasks not being processed
**Solution**: 
1. Check Celery worker is running
2. Check Redis connection: `redis-cli ping`
3. Check logs for errors
4. Verify task is registered: `celery -A offchat_backend inspect registered`

### Issue: "ImportError: cannot import name 'app' from 'offchat_backend.celery'"
**Solution**: Make sure `offchat_backend/celery.py` exists and is properly configured

## Testing Celery Tasks

### Send a Test Task
```python
from users.notification_tasks import send_notification_async

# Queue a task
result = send_notification_async.delay(
    user_id=1,
    notification_type='system',
    title='Test',
    message='Test message'
)

# Check result
print(result.get())
```

## Performance Tuning

### Concurrency
```bash
# Default (number of CPU cores)
celery -A offchat_backend worker -l info

# Specific concurrency
celery -A offchat_backend worker -l info --concurrency=8

# Single process (for debugging)
celery -A offchat_backend worker -l info --concurrency=1 --pool=solo
```

### Task Time Limits
```bash
# Set task timeout to 5 minutes
celery -A offchat_backend worker -l info --time-limit=300 --soft-time-limit=280
```

## Integration with Development Setup

The `scripts/start-dev.bat` script should start both Django and Celery:

```batch
@echo off
REM Start Django
start cmd /k "python manage.py runserver --settings=offchat_backend.settings.development"

REM Start Celery
start cmd /k "scripts\start-celery.bat"

REM Start React
start cmd /k "npm run dev"
```

## Production Deployment

### Using Supervisor (Linux)
Create `/etc/supervisor/conf.d/celery.conf`:
```ini
[program:celery]
command=celery -A offchat_backend worker -l info
directory=/path/to/offchat-admin-nexus-main
user=www-data
numprocs=1
stdout_logfile=/var/log/celery/worker.log
stderr_logfile=/var/log/celery/worker.log
autostart=true
autorestart=true
startsecs=10
stopwaitsecs=600
```

### Using Systemd (Linux)
Create `/etc/systemd/system/celery.service`:
```ini
[Unit]
Description=Celery Service
After=network.target

[Service]
Type=forking
User=www-data
Group=www-data
WorkingDirectory=/path/to/offchat-admin-nexus-main
ExecStart=/path/to/venv/bin/celery -A offchat_backend worker -l info
Restart=always

[Install]
WantedBy=multi-user.target
```

## Quick Start Checklist

- [ ] Redis installed and running
- [ ] Celery installed (`pip install celery`)
- [ ] `offchat_backend/celery.py` configured
- [ ] Celery worker started (`celery -A offchat_backend worker -l info`)
- [ ] Tasks are being processed (check logs)
- [ ] Message sending is fast (no blocking)
