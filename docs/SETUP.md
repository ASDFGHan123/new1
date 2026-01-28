# OffChat Admin Nexus - Setup Guide

## Table of Contents
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Backend Setup](#backend-setup)
- [Frontend Setup](#frontend-setup)
- [Database Setup](#database-setup)
- [Redis Setup](#redis-setup)
- [Celery Setup](#celery-setup)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements
- **Operating System**: Windows 10/11, Linux, or macOS
- **Python**: 3.11 or higher
- **Node.js**: 18.0 or higher
- **npm**: 9.0 or higher
- **PostgreSQL**: 13 or higher (production)
- **Redis**: 6.0 or higher

### Required Software
1. **Python and pip**
2. **Node.js and npm**
3. **PostgreSQL** (for production)
4. **Redis** (for caching and Celery)
5. **Git** (for version control)

---

## Environment Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd offchat-admin-nexus-main
```

### 2. Create Virtual Environment
```bash
# Using venv
python -m venv venv

# Activate virtual environment
# Windows
venv\Scripts\activate
# Linux/macOS
source venv/bin/activate
```

### 3. Install Python Dependencies
```bash
pip install -r requirements.txt
```

### 4. Install Node Dependencies
```bash
cd src
npm install
cd ..
```

---

## Backend Setup

### 1. Environment Variables
Create a `.env` file in the project root:
```env
# Django Settings
DEBUG=True
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=localhost,127.0.0.1

# Database Settings
DB_NAME=offchat_db
DB_USER=postgres
DB_PASSWORD=your-password
DB_HOST=localhost
DB_PORT=5432

# Redis Settings
REDIS_URL=redis://localhost:6379/0

# Email Settings
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# Media Files
MEDIA_ROOT=media/
STATIC_ROOT=static/
```

### 2. Database Migration
```bash
python manage.py makemigrations
python manage.py migrate
```

### 3. Create Superuser
```bash
python manage.py createsuperuser
```

### 4. Collect Static Files
```bash
python manage.py collectstatic
```

---

## Frontend Setup

### 1. Environment Configuration
Create `src/.env`:
```env
VITE_API_URL=http://localhost:8000/api
VITE_WS_URL=ws://localhost:8000/ws
VITE_USE_REAL_DATA=true
```

### 2. Build Frontend
```bash
cd src
npm run build
cd ..
```

---

## Database Setup

### PostgreSQL Setup (Production)

1. **Install PostgreSQL**
   - Windows: Download from postgresql.org
   - Linux: `sudo apt-get install postgresql postgresql-contrib`
   - macOS: `brew install postgresql`

2. **Create Database**
   ```sql
   CREATE DATABASE offchat_db;
   CREATE USER offchat_user WITH PASSWORD 'your-password';
   GRANT ALL PRIVILEGES ON DATABASE offchat_db TO offchat_user;
   ```

3. **Update Django Settings**
   ```python
   # offchat_backend/settings.py
   DATABASES = {
       'default': {
           'ENGINE': 'django.db.backends.postgresql',
           'NAME': os.environ.get('DB_NAME', 'offchat_db'),
           'USER': os.environ.get('DB_USER', 'offchat_user'),
           'PASSWORD': os.environ.get('DB_PASSWORD'),
           'HOST': os.environ.get('DB_HOST', 'localhost'),
           'PORT': os.environ.get('DB_PORT', '5432'),
       }
   }
   ```

### SQLite Setup (Development)
For development, SQLite is configured by default:
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}
```

---

## Redis Setup

### Windows Setup
1. Download Redis for Windows
2. Extract and run `redis-server.exe`
3. Or use WSL2 with Linux Redis

### Linux Setup
```bash
sudo apt-get install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

### macOS Setup
```bash
brew install redis
brew services start redis
```

### Verify Redis Installation
```bash
redis-cli ping
# Should return: PONG
```

---

## Celery Setup

### 1. Install Celery Dependencies
```bash
pip install celery redis
```

### 2. Configure Celery
In `offchat_backend/celery.py`:
```python
import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'offchat_backend.settings')

app = Celery('offchat_backend')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()
```

### 3. Start Celery Worker
```bash
# Terminal 1: Start Celery worker
celery -A offchat_backend worker -l info

# Terminal 2: Start Celery beat (for scheduled tasks)
celery -A offchat_backend beat -l info
```

---

## Configuration

### Django Settings Key Configurations

#### Installed Apps
```python
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'channels',
    'corsheaders',
    # Your apps
    'users',
    'chat',
    'admin_panel',
]
```

#### Channels Configuration
```python
ASGI_APPLICATION = 'offchat_backend.asgi.application'

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': [('127.0.0.1', 6379)],
        },
    },
}
```

#### CORS Settings
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
```

### Security Settings
```python
# Production security settings
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
SECURE_HSTS_SECONDS = 31536000
```

---

## Running the Application

### Development Mode

1. **Start Django Server**
   ```bash
   python manage.py runserver
   ```

2. **Start Frontend Dev Server**
   ```bash
   cd src
   npm run dev
   ```

3. **Start Redis** (if not running)
   ```bash
   redis-server
   ```

4. **Start Celery Worker** (optional)
   ```bash
   celery -A offchat_backend worker -l info
   ```

### Production Mode

1. **Using Gunicorn**
   ```bash
   pip install gunicorn
   gunicorn offchat_backend.wsgi:application --bind 0.0.0.0:8000
   ```

2. **Using Daphne (for WebSockets)**
   ```bash
   pip install daphne
   daphne offchat_backend.asgi:application --bind 0.0.0.0:8000
   ```

3. **Using Nginx as Reverse Proxy**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://127.0.0.1:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
       
       location /ws/ {
           proxy_pass http://127.0.0.1:8000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection "upgrade";
       }
   }
   ```

---

## Troubleshooting

### Common Issues

1. **ModuleNotFoundError**
   - Ensure virtual environment is activated
   - Run `pip install -r requirements.txt`

2. **Database Connection Error**
   - Check PostgreSQL service is running
   - Verify database credentials in `.env`
   - Ensure database exists

3. **Redis Connection Error**
   - Check Redis service is running
   - Verify Redis URL in settings
   - Test with `redis-cli ping`

4. **Celery Not Working**
   - Ensure Redis is running
   - Check Celery configuration
   - Verify task registration

5. **WebSocket Connection Failed**
   - Ensure Daphne is running (not just Django dev server)
   - Check Channels configuration
   - Verify Redis for channel layers

6. **Static Files Not Loading**
   - Run `python manage.py collectstatic`
   - Check STATIC_ROOT in settings
   - Verify Nginx configuration (if using)

### Debug Mode

Enable debug mode for detailed error messages:
```python
# settings.py
DEBUG = True
```

### Logging Configuration
```python
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': 'debug.log',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file'],
            'level': 'INFO',
            'propagate': True,
        },
    },
}
```

### Performance Tips

1. **Database Optimization**
   - Use connection pooling
   - Add database indexes
   - Optimize queries

2. **Caching**
   - Enable Redis caching
   - Cache frequently accessed data
   - Use template caching

3. **Static Files**
   - Use CDN in production
   - Enable gzip compression
   - Minify CSS/JS

---

## Quick Start Checklist

- [ ] Clone repository
- [ ] Create and activate virtual environment
- [ ] Install Python dependencies
- [ ] Install Node dependencies
- [ ] Configure environment variables
- [ ] Set up database
- [ ] Run migrations
- [ ] Create superuser
- [ ] Install and configure Redis
- [ ] Start Redis server
- [ ] Start Django development server
- [ ] Start frontend development server
- [ ] Test application functionality

---

## Next Steps

After successful setup:
1. Read the [Features Documentation](FEATURES.md)
2. Check the [Security Guide](SECURITY.md)
3. Review the [Troubleshooting Guide](TROUBLESHOOTING.md)
4. Explore the [Development Guidelines](DEVELOPMENT.md)
