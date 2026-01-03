"""
Development settings for offchat_backend project.
"""

from .base import *

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = config(
    'SECRET_KEY', 
    default='django-insecure-dev-key-for-local-development-only-change-in-production'
)

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ['*']

# CORS settings for React frontend (Development only)
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True
CORS_EXPOSE_HEADERS = ['Content-Type', 'X-CSRFToken']
CORS_ALLOWED_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]
CORS_ALLOWED_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

# Disable CSRF for API endpoints in development
CSRF_TRUSTED_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://192.168.2.33:5173']

# Development middleware
# MIDDLEWARE += [
#     'django_extensions.management.commands.show_urls',
# ]

# Development apps
# INSTALLED_APPS += [
#     'django_extensions',
# ]

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
        'OPTIONS': {
            'timeout': 20,
        },
    }
}

# WebSocket channel layer configuration (In-memory for development)
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels.layers.InMemoryChannelLayer',
    },
}

# Redis Configuration
REDIS_URL = 'redis://localhost:6379/0'

# Celery Configuration (Eager execution for development)
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True

# Cache Configuration (Local memory for development)
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'unique-snowflake',
    }
}

# Email settings (Console backend for development)
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Security Settings (Relaxed for development)
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False
SECURE_HSTS_SECONDS = 0

# Media files CORS headers
ACCESS_CONTROL_ALLOW_ORIGIN = '*'

# Session Configuration
SESSION_ENGINE = 'django.contrib.sessions.backends.db'
SESSION_COOKIE_AGE = 86400  # 24 hours
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'

# JWT Settings
SIMPLE_JWT['SIGNING_KEY'] = SECRET_KEY

# Media file serving
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# File Upload Settings (Development)
FILE_UPLOAD_MAX_MEMORY_SIZE = 2147483648  # 2048MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 2147483648  # 2048MB

# Logging Configuration
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': True,
        },
        'offchat_backend': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': True,
        },
    },
}