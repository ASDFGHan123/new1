# Media Support Configuration Template

## Add to offchat_backend/settings/base.py

```python
# ============================================================================
# MEDIA SUPPORT CONFIGURATION
# ============================================================================

# File Upload Settings - Enhanced for comprehensive media support
FILE_UPLOAD_MAX_MEMORY_SIZE = 2147483648  # 2GB
DATA_UPLOAD_MAX_MEMORY_SIZE = 2147483648  # 2GB
FILE_UPLOAD_PERMISSIONS = 0o644
FILE_UPLOAD_DIRECTORY_PERMISSIONS = 0o755

# Media file extensions - All supported types
ALLOWED_MEDIA_EXTENSIONS = {
    # Images (9 types)
    'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff', 'tif',
    
    # Audio (8 types)
    'mp3', 'wav', 'ogg', 'oga', 'aac', 'flac', 'm4a', 'wma',
    
    # Video (9 types)
    'mp4', 'webm', 'ogv', 'mov', 'avi', 'mkv', 'flv', 'wmv', '3gp',
    
    # Documents (10 types)
    'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odp', 'ods', 'odt',
    
    # Text (9 types)
    'txt', 'csv', 'tsv', 'json', 'xml', 'yaml', 'yml', 'md', 'markdown', 'html', 'htm',
    
    # Archives (6 types)
    'zip', 'rar', '7z', 'tar', 'gz', 'gzip', 'bz2',
    
    # Code (13 types)
    'py', 'js', 'mjs', 'ts', 'tsx', 'java', 'cpp', 'cc', 'cxx', 'c', 'cs', 'php', 'rb', 'go', 'rs', 'sql', 'sh', 'bash',
    
    # 3D Models (5 types)
    'obj', 'fbx', 'gltf', 'glb', 'stl',
    
    # GIS Data (3 types)
    'shp', 'geojson', 'kml',
}

# MIME type configuration for media support
MEDIA_MIME_TYPES = {
    # Images
    'image/jpeg': {'ext': ['.jpg', '.jpeg'], 'category': 'image', 'limit': 50},
    'image/png': {'ext': ['.png'], 'category': 'image', 'limit': 50},
    'image/gif': {'ext': ['.gif'], 'category': 'image', 'limit': 50},
    'image/webp': {'ext': ['.webp'], 'category': 'image', 'limit': 50},
    'image/svg+xml': {'ext': ['.svg'], 'category': 'image', 'limit': 50},
    'image/bmp': {'ext': ['.bmp'], 'category': 'image', 'limit': 50},
    'image/tiff': {'ext': ['.tiff', '.tif'], 'category': 'image', 'limit': 50},
    
    # Audio
    'audio/mpeg': {'ext': ['.mp3'], 'category': 'audio', 'limit': 100},
    'audio/wav': {'ext': ['.wav'], 'category': 'audio', 'limit': 100},
    'audio/ogg': {'ext': ['.ogg', '.oga'], 'category': 'audio', 'limit': 100},
    'audio/aac': {'ext': ['.aac'], 'category': 'audio', 'limit': 100},
    'audio/flac': {'ext': ['.flac'], 'category': 'audio', 'limit': 100},
    'audio/mp4': {'ext': ['.m4a'], 'category': 'audio', 'limit': 100},
    'audio/x-ms-wma': {'ext': ['.wma'], 'category': 'audio', 'limit': 100},
    
    # Video
    'video/mp4': {'ext': ['.mp4'], 'category': 'video', 'limit': 500},
    'video/webm': {'ext': ['.webm'], 'category': 'video', 'limit': 500},
    'video/ogg': {'ext': ['.ogv'], 'category': 'video', 'limit': 500},
    'video/quicktime': {'ext': ['.mov'], 'category': 'video', 'limit': 500},
    'video/x-msvideo': {'ext': ['.avi'], 'category': 'video', 'limit': 500},
    'video/x-matroska': {'ext': ['.mkv'], 'category': 'video', 'limit': 500},
    'video/x-flv': {'ext': ['.flv'], 'category': 'video', 'limit': 500},
    'video/x-ms-wmv': {'ext': ['.wmv'], 'category': 'video', 'limit': 500},
    'video/3gpp': {'ext': ['.3gp'], 'category': 'video', 'limit': 500},
    
    # Documents
    'application/pdf': {'ext': ['.pdf'], 'category': 'document', 'limit': 50},
    'application/msword': {'ext': ['.doc'], 'category': 'document', 'limit': 50},
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {'ext': ['.docx'], 'category': 'document', 'limit': 50},
    'application/vnd.ms-excel': {'ext': ['.xls'], 'category': 'document', 'limit': 50},
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {'ext': ['.xlsx'], 'category': 'document', 'limit': 50},
    'application/vnd.ms-powerpoint': {'ext': ['.ppt'], 'category': 'document', 'limit': 50},
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': {'ext': ['.pptx'], 'category': 'document', 'limit': 50},
    'application/vnd.oasis.opendocument.presentation': {'ext': ['.odp'], 'category': 'document', 'limit': 50},
    'application/vnd.oasis.opendocument.spreadsheet': {'ext': ['.ods'], 'category': 'document', 'limit': 50},
    'application/vnd.oasis.opendocument.text': {'ext': ['.odt'], 'category': 'document', 'limit': 50},
    
    # Text
    'text/plain': {'ext': ['.txt'], 'category': 'text', 'limit': 10},
    'text/csv': {'ext': ['.csv'], 'category': 'text', 'limit': 10},
    'text/tab-separated-values': {'ext': ['.tsv'], 'category': 'text', 'limit': 10},
    'application/json': {'ext': ['.json'], 'category': 'text', 'limit': 10},
    'application/xml': {'ext': ['.xml'], 'category': 'text', 'limit': 10},
    'application/x-yaml': {'ext': ['.yaml', '.yml'], 'category': 'text', 'limit': 10},
    'text/markdown': {'ext': ['.md', '.markdown'], 'category': 'text', 'limit': 10},
    'text/html': {'ext': ['.html', '.htm'], 'category': 'text', 'limit': 10},
    
    # Archives
    'application/zip': {'ext': ['.zip'], 'category': 'archive', 'limit': 100},
    'application/x-rar-compressed': {'ext': ['.rar'], 'category': 'archive', 'limit': 100},
    'application/x-7z-compressed': {'ext': ['.7z'], 'category': 'archive', 'limit': 100},
    'application/x-tar': {'ext': ['.tar'], 'category': 'archive', 'limit': 100},
    'application/gzip': {'ext': ['.gz', '.gzip'], 'category': 'archive', 'limit': 100},
    'application/x-bzip2': {'ext': ['.bz2'], 'category': 'archive', 'limit': 100},
    
    # Code
    'text/x-python': {'ext': ['.py'], 'category': 'code', 'limit': 10},
    'text/javascript': {'ext': ['.js', '.mjs'], 'category': 'code', 'limit': 10},
    'text/typescript': {'ext': ['.ts', '.tsx'], 'category': 'code', 'limit': 10},
    'text/x-java-source': {'ext': ['.java'], 'category': 'code', 'limit': 10},
    'text/x-c++src': {'ext': ['.cpp', '.cc', '.cxx'], 'category': 'code', 'limit': 10},
    'text/x-csrc': {'ext': ['.c'], 'category': 'code', 'limit': 10},
    'text/x-csharp': {'ext': ['.cs'], 'category': 'code', 'limit': 10},
    'application/x-php': {'ext': ['.php'], 'category': 'code', 'limit': 10},
    'text/x-ruby': {'ext': ['.rb'], 'category': 'code', 'limit': 10},
    'text/x-go': {'ext': ['.go'], 'category': 'code', 'limit': 10},
    'text/x-rust': {'ext': ['.rs'], 'category': 'code', 'limit': 10},
    'text/x-sql': {'ext': ['.sql'], 'category': 'code', 'limit': 10},
    'application/x-sh': {'ext': ['.sh', '.bash'], 'category': 'code', 'limit': 10},
    
    # 3D Models
    'model/obj': {'ext': ['.obj'], 'category': 'model', 'limit': 200},
    'model/x-fbx': {'ext': ['.fbx'], 'category': 'model', 'limit': 200},
    'model/gltf+json': {'ext': ['.gltf'], 'category': 'model', 'limit': 200},
    'model/gltf-binary': {'ext': ['.glb'], 'category': 'model', 'limit': 200},
    'model/stl': {'ext': ['.stl'], 'category': 'model', 'limit': 200},
    
    # GIS Data
    'application/x-shapefile': {'ext': ['.shp'], 'category': 'gis', 'limit': 50},
    'application/geo+json': {'ext': ['.geojson'], 'category': 'gis', 'limit': 50},
    'application/vnd.google-earth.kml+xml': {'ext': ['.kml'], 'category': 'gis', 'limit': 50},
}

# Media processing settings
MEDIA_PROCESSING = {
    'ENABLE_IMAGE_OPTIMIZATION': True,
    'ENABLE_VIDEO_THUMBNAIL': True,
    'ENABLE_AUDIO_METADATA': True,
    'ENABLE_VIRUS_SCANNING': False,  # Set to True if virus scanner is available
    'ENABLE_ENCRYPTION': False,  # Set to True for encrypted storage
}

# Celery task configuration for media processing
CELERY_BEAT_SCHEDULE = {
    'cleanup-temp-files': {
        'task': 'chat.tasks.cleanup_temp_files',
        'schedule': 3600.0,  # Every hour
    },
    'process-media-metadata': {
        'task': 'chat.tasks.process_media_metadata',
        'schedule': 300.0,  # Every 5 minutes
    },
}

# Cache configuration for media info
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
        'OPTIONS': {
            'CLIENT_CLASS': 'redis.Redis',
        },
        'KEY_PREFIX': 'offchat',
        'TIMEOUT': 300,
    }
}

# Media storage settings
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Create media directories if they don't exist
import os
os.makedirs(MEDIA_ROOT / 'attachments', exist_ok=True)
os.makedirs(MEDIA_ROOT / 'thumbnails', exist_ok=True)
os.makedirs(MEDIA_ROOT / 'avatars', exist_ok=True)

# ============================================================================
# END MEDIA SUPPORT CONFIGURATION
# ============================================================================
```

## Add to offchat_backend/settings/development.py

```python
# Development-specific media settings
DEBUG = True
ALLOWED_HOSTS = ['*']

# Disable virus scanning in development
MEDIA_PROCESSING['ENABLE_VIRUS_SCANNING'] = False

# Use local file storage in development
DEFAULT_FILE_STORAGE = 'django.core.files.storage.FileSystemStorage'
```

## Add to offchat_backend/settings/production.py

```python
# Production-specific media settings
DEBUG = False
ALLOWED_HOSTS = ['yourdomain.com', 'www.yourdomain.com']

# Enable security features in production
MEDIA_PROCESSING['ENABLE_VIRUS_SCANNING'] = True
MEDIA_PROCESSING['ENABLE_ENCRYPTION'] = True

# Use S3 or other cloud storage in production
# DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
# AWS_STORAGE_BUCKET_NAME = 'your-bucket-name'
# AWS_S3_REGION_NAME = 'us-east-1'

# Enable HTTPS for media URLs
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
```

## Update Django URLs (chat/urls.py)

```python
from django.urls import path
from .views_enhanced_upload import (
    EnhancedFileUploadView,
    MediaInfoView,
    MediaValidationView
)

urlpatterns = [
    # ... existing patterns ...
    
    # Enhanced media upload endpoints
    path('upload/', EnhancedFileUploadView.as_view(), name='enhanced-file-upload'),
    path('media/info/', MediaInfoView.as_view(), name='media-info'),
    path('media/validate/', MediaValidationView.as_view(), name='media-validate'),
]
```

## Environment Variables (.env)

```bash
# Media Processing
ENABLE_IMAGE_OPTIMIZATION=true
ENABLE_VIDEO_THUMBNAIL=true
ENABLE_AUDIO_METADATA=true
ENABLE_VIRUS_SCANNING=false
ENABLE_ENCRYPTION=false

# File Upload Limits (in MB)
MAX_IMAGE_SIZE=50
MAX_AUDIO_SIZE=100
MAX_VIDEO_SIZE=500
MAX_DOCUMENT_SIZE=50
MAX_TEXT_SIZE=10
MAX_ARCHIVE_SIZE=100
MAX_CODE_SIZE=10
MAX_MODEL_SIZE=200
MAX_GIS_SIZE=50

# Storage
MEDIA_ROOT=/path/to/media
MEDIA_URL=/media/

# S3 Configuration (if using cloud storage)
USE_S3=false
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_STORAGE_BUCKET_NAME=
AWS_S3_REGION_NAME=us-east-1
```

## Verification Checklist

After adding configuration:

- [ ] All MIME types are defined
- [ ] File size limits are set correctly
- [ ] Media directories exist with proper permissions
- [ ] Cache is configured
- [ ] Celery tasks are configured
- [ ] Environment variables are set
- [ ] Settings are imported in main settings file
- [ ] URLs are updated
- [ ] Migrations are run
- [ ] Tests pass

## Testing Configuration

```python
# Test that configuration is loaded
from django.conf import settings

# Check media settings
print(settings.ALLOWED_MEDIA_EXTENSIONS)
print(settings.MEDIA_MIME_TYPES)
print(settings.MEDIA_PROCESSING)

# Check file upload limits
print(settings.FILE_UPLOAD_MAX_MEMORY_SIZE)
print(settings.DATA_UPLOAD_MAX_MEMORY_SIZE)
```

## Notes

- All file size limits are in MB
- MIME types are case-sensitive
- Extensions should include the dot (.)
- Categories must match MediaCategory enum
- Limits should be reasonable for your infrastructure
- Adjust based on your server capacity
- Monitor disk space usage
- Implement cleanup policies for old files
