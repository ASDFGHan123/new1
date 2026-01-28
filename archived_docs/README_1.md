# Scripts Directory - Quick Reference

## Available Scripts

### 1. `start-dev.bat` - Start All Development Services
**Purpose**: Starts Django, React, and Celery in separate windows

**Usage**:
```bash
scripts\start-dev.bat
```

**What it does**:
- Starts Django backend on port 8000
- Starts React frontend on port 5173
- Starts Celery worker for background tasks
- Displays access URLs and login credentials

**Output**:
```
Local Machine:
  Frontend: http://localhost:5173
  Backend:  http://localhost:8000

Login:
  Username: admin
  Password: 12341234
```

---

### 2. `start-celery.bat` - Start Celery Worker Only
**Purpose**: Starts the Celery worker for background task processing

**Usage**:
```bash
scripts\start-celery.bat
```

**What it does**:
- Activates virtual environment
- Starts Celery worker with concurrency=4
- Connects to Redis on localhost:6379
- Registers all tasks

**Output**:
```
Starting Celery Worker
celery@HOSTNAME ready
Connected to redis://localhost:6379/0
Registered tasks: [list of tasks]
```

**When to use**:
- Running Django and React separately
- Debugging Celery issues
- Monitoring task processing

---

### 3. `setup-redis.bat` - Redis Setup Helper
**Purpose**: Helps set up Redis on Windows

**Usage**:
```bash
scripts\setup-redis.bat
```

**Menu Options**:
```
1. Check if Redis is already running
2. Start Redis using Docker
3. Start Redis using WSL
4. Download Memurai (Windows Redis)
5. Exit
```

**When to use**:
- First time setup
- Troubleshooting Redis connection
- Switching between Redis implementations

---

### 4. `setup-dev.bat` - Initial Development Setup
**Purpose**: Sets up the development environment (if it exists)

**Usage**:
```bash
scripts\setup-dev.bat
```

**What it typically does**:
- Creates virtual environment
- Installs dependencies
- Runs migrations
- Creates superuser

---

## Quick Start Workflow

### First Time Setup
```bash
# 1. Setup development environment
scripts\setup-dev.bat

# 2. Setup Redis
scripts\setup-redis.bat
# Choose option 2 (Docker) or 3 (WSL)

# 3. Start all services
scripts\start-dev.bat
```

### Daily Development
```bash
# Just run this (starts everything)
scripts\start-dev.bat
```

### Troubleshooting
```bash
# Check Redis
scripts\setup-redis.bat
# Choose option 1

# Start Celery separately for debugging
scripts\start-celery.bat
```

---

## Script Details

### `start-dev.bat` - Detailed Flow

```
1. Get machine IP address
2. Display access URLs
3. Start Django backend
   └─→ New window: python manage.py runserver
4. Start React frontend
   └─→ New window: npm run dev
5. Start Celery worker
   └─→ New window: scripts\start-celery.bat
6. Display login credentials
7. Wait for user input
```

### `start-celery.bat` - Detailed Flow

```
1. Check Python is installed
2. Check requirements.txt exists
3. Activate virtual environment
   └─→ venv\Scripts\activate.bat or .venv\Scripts\activate.bat
4. Start Celery worker
   └─→ celery -A offchat_backend worker -l info --concurrency=4
5. Handle errors if Redis not running
```

### `setup-redis.bat` - Detailed Flow

```
1. Display menu
2. Get user choice
3. Execute selected option:
   ├─→ Option 1: redis-cli ping
   ├─→ Option 2: docker run -d -p 6379:6379 redis:latest
   ├─→ Option 3: wsl redis-server
   ├─→ Option 4: Open download page
   └─→ Option 5: Exit
4. Verify connection
```

---

## Environment Variables

Scripts use these environment variables (if set):

```bash
# Python
PYTHON_HOME          # Python installation directory
VIRTUAL_ENV          # Virtual environment path

# Django
DJANGO_SETTINGS_MODULE  # Settings module (auto-set)

# Celery
CELERY_BROKER_URL    # Redis URL (default: redis://localhost:6379/0)
CELERY_RESULT_BACKEND # Result backend (default: redis://localhost:6379/0)

# Redis
REDIS_URL            # Redis connection URL
```

---

## Troubleshooting Scripts

### Script won't run
```bash
# Check if scripts are executable
# On Windows, they should run directly

# If not, try:
python scripts\start-dev.bat
```

### Virtual environment not found
```bash
# Create virtual environment
python -m venv venv

# Or
python -m venv .venv

# Then run script again
scripts\start-dev.bat
```

### Redis not found
```bash
# Use setup-redis.bat to install
scripts\setup-redis.bat

# Or install manually
docker run -d -p 6379:6379 redis:latest
```

### Celery not starting
```bash
# Check dependencies
pip install -r requirements.txt

# Check Redis is running
redis-cli ping

# Try starting manually
celery -A offchat_backend worker -l info
```

---

## Advanced Usage

### Custom Concurrency
Edit `start-celery.bat`:
```batch
REM Change this line:
celery -A offchat_backend worker -l info --concurrency=4

REM To:
celery -A offchat_backend worker -l info --concurrency=8
```

### Custom Port
Edit `start-dev.bat`:
```batch
REM Change this line:
python manage.py runserver 0.0.0.0:8000

REM To:
python manage.py runserver 0.0.0.0:9000
```

### Production Mode
```bash
# Set environment
set DJANGO_SETTINGS_MODULE=offchat_backend.settings.production

# Run script
scripts\start-dev.bat
```

---

## Monitoring Scripts

### Check Services Status
```bash
# Redis
redis-cli ping

# Celery
celery -A offchat_backend inspect active

# Django
curl http://localhost:8000/api/health/

# React
curl http://localhost:5173/
```

### View Logs
```bash
# Celery logs appear in the terminal window
# Django logs appear in the terminal window
# React logs appear in the terminal window
```

---

## Performance Tips

### Increase Celery Concurrency
```batch
REM In start-celery.bat, change:
--concurrency=4
REM To:
--concurrency=8
```

### Use Production Settings
```bash
set DJANGO_SETTINGS_MODULE=offchat_backend.settings.production
scripts\start-dev.bat
```

### Monitor with Flower
```bash
pip install flower
celery -A offchat_backend flower
# Open http://localhost:5555
```

---

## Documentation

For more information, see:
- `CELERY_QUICK_START.md` - Quick reference
- `CELERY_VISUAL_GUIDE.md` - Step-by-step visual guide
- `docs/CELERY_SETUP.md` - Comprehensive setup guide
- `CELERY_VERIFICATION_CHECKLIST.md` - Verification steps

---

## Support

If scripts don't work:
1. Check error message in terminal
2. Verify prerequisites are installed
3. Check `CELERY_QUICK_START.md` for solutions
4. Review `docs/CELERY_SETUP.md` for detailed setup

---

**Last Updated**: 2024
**Status**: Production Ready ✅
