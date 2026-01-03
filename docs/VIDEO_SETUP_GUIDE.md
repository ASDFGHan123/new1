# Video Attachment System Setup Guide

## Quick Start

### 1. Install System Dependencies

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install ffmpeg
```

**macOS:**
```bash
brew install ffmpeg
```

**Windows:**
```bash
# Using Chocolatey
choco install ffmpeg

# Or download from https://ffmpeg.org/download.html
# Add ffmpeg to PATH
```

Verify installation:
```bash
ffmpeg -version
ffprobe -version
```

### 2. Install Python Dependencies

```bash
pip install Pillow>=9.0
```

### 3. Run Database Migration

```bash
python manage.py migrate chat
```

This creates the new video-related fields:
- thumbnail
- width
- height
- bitrate
- codec

### 4. Update Django Settings

Add to `offchat_backend/settings/base.py`:

```python
# Media files configuration
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Video processing settings
VIDEO_PROCESSING_ENABLED = True
VIDEO_THUMBNAIL_TIMESTAMP = 1  # Generate thumbnail at 1 second
VIDEO_MAX_SIZE = 100 * 1024 * 1024  # 100MB

# File upload settings
FILE_UPLOAD_MAX_MEMORY_SIZE = 104857600  # 100MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 104857600  # 100MB

# Cache configuration for video processing status
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'unique-snowflake',
    }
}
```

### 5. Update URL Configuration

In `offchat_backend/urls.py`, ensure media files are served:

```python
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # ... your patterns
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

### 6. Create Media Directories

```bash
mkdir -p media/attachments
mkdir -p media/thumbnails
chmod 755 media/attachments
chmod 755 media/thumbnails
```

### 7. Test Video Upload

```bash
# Create a test video (10 seconds)
ffmpeg -f lavfi -i testsrc=s=320x240:d=10 -f lavfi -i sine=f=1000:d=10 test_video.mp4

# Upload via API
curl -X POST http://localhost:8000/api/chat/videos/upload/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test_video.mp4" \
  -F "message_id=YOUR_MESSAGE_ID"
```

## Configuration Options

### Video Processing Service

Edit `chat/services/video_service.py` to customize:

```python
class VideoProcessingService:
    SUPPORTED_FORMATS = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv']
    MAX_VIDEO_SIZE = 100 * 1024 * 1024  # 100MB
```

### Thumbnail Generation

Customize thumbnail settings:

```python
# In video_service.py
def generate_thumbnail(file_path, output_path, timestamp=1):
    cmd = [
        'ffmpeg', '-i', file_path,
        '-ss', str(timestamp),  # Change timestamp
        '-vframes', '1',
        '-vf', 'scale=320:-1',  # Change resolution
        '-y', output_path
    ]
```

## Troubleshooting

### FFmpeg Not Found

**Error:** `FileNotFoundError: [Errno 2] No such file or directory: 'ffmpeg'`

**Solution:**
1. Verify installation: `which ffmpeg`
2. Add to PATH if needed
3. Restart Django server

### Permission Denied on Media Directory

**Error:** `PermissionError: [Errno 13] Permission denied: 'media/thumbnails'`

**Solution:**
```bash
sudo chown -R www-data:www-data media/
sudo chmod -R 755 media/
```

### Video Processing Timeout

**Error:** `subprocess.TimeoutExpired`

**Solution:**
1. Increase timeout in `video_service.py`:
```python
result = subprocess.run(cmd, capture_output=True, timeout=60)  # Increase from 30
```
2. Use smaller video files
3. Check system resources

### Thumbnail Not Generated

**Error:** Thumbnail URL is null

**Solution:**
1. Verify Pillow installed: `pip install Pillow`
2. Check disk space: `df -h`
3. Verify write permissions on thumbnails directory
4. Check Django logs for errors

## Performance Tuning

### Async Video Processing

For production, process videos asynchronously using Celery:

```python
# In chat/tasks.py
from celery import shared_task
from .services.video_service import VideoProcessingService

@shared_task
def process_video_async(attachment_id):
    from .models import Attachment
    attachment = Attachment.objects.get(id=attachment_id)
    VideoProcessingService.process_video_attachment(attachment)
```

Update `FileUploadView`:
```python
if file_type == 'video':
    process_video_async.delay(attachment.id)
```

### Caching Thumbnails

Enable CDN caching for thumbnails:

```python
# In settings
THUMBNAIL_CACHE_TIMEOUT = 86400 * 30  # 30 days
```

### Database Optimization

Add indexes for common queries:

```python
# In Attachment model
class Meta:
    indexes = [
        models.Index(fields=['message']),
        models.Index(fields=['file_type']),
        models.Index(fields=['uploaded_at']),
        models.Index(fields=['file_type', 'uploaded_at']),
    ]
```

## Production Deployment

### 1. Use Gunicorn with Workers

```bash
gunicorn offchat_backend.wsgi:application \
  --workers 4 \
  --worker-class sync \
  --bind 0.0.0.0:8000 \
  --timeout 120
```

### 2. Configure Nginx for Large Uploads

```nginx
client_max_body_size 100M;

location /media/ {
    alias /path/to/media/;
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

### 3. Use S3 for Media Storage

```python
# Install: pip install django-storages boto3

# In settings
if not DEBUG:
    STORAGES = {
        'default': {
            'BACKEND': 'storages.backends.s3boto3.S3Boto3Storage',
            'OPTIONS': {
                'AWS_STORAGE_BUCKET_NAME': 'your-bucket',
                'AWS_S3_REGION_NAME': 'us-east-1',
            }
        }
    }
```

### 4. Monitor Video Processing

```python
# In settings
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': 'video_processing.log',
        },
    },
    'loggers': {
        'chat.services.video_service': {
            'handlers': ['file'],
            'level': 'INFO',
        },
    },
}
```

## Testing

### Unit Tests

```python
# In chat/tests.py
from django.test import TestCase
from .services.video_service import VideoProcessingService

class VideoProcessingTestCase(TestCase):
    def test_validate_video_file(self):
        # Test video validation
        pass
    
    def test_extract_metadata(self):
        # Test metadata extraction
        pass
    
    def test_generate_thumbnail(self):
        # Test thumbnail generation
        pass
```

### Integration Tests

```bash
# Test video upload endpoint
python manage.py test chat.tests.VideoUploadTestCase
```

## Monitoring

### Check Video Processing Status

```python
# In Django shell
from chat.models import Attachment

# Find videos without thumbnails
videos_without_thumbnails = Attachment.objects.filter(
    file_type='video',
    thumbnail__isnull=True
)

# Reprocess them
from chat.services.video_service import VideoProcessingService
for video in videos_without_thumbnails:
    VideoProcessingService.process_video_attachment(video)
```

### Storage Usage

```bash
# Check media directory size
du -sh media/

# Find largest videos
find media/attachments -type f -exec ls -lh {} \; | sort -k5 -h | tail -20
```

## Maintenance

### Cleanup Old Thumbnails

```python
# In management command
from django.core.management.base import BaseCommand
from chat.models import Attachment
from datetime import timedelta
from django.utils import timezone

class Command(BaseCommand):
    def handle(self, *args, **options):
        cutoff = timezone.now() - timedelta(days=90)
        old_attachments = Attachment.objects.filter(
            file_type='video',
            uploaded_at__lt=cutoff
        )
        
        for attachment in old_attachments:
            if attachment.thumbnail:
                attachment.thumbnail.delete()
```

## Support

For issues or questions:
1. Check logs: `tail -f django.log`
2. Review documentation: `docs/VIDEO_ATTACHMENT_GUIDE.md`
3. Test with sample video: `ffmpeg -f lavfi -i testsrc=s=320x240:d=10 test.mp4`
