# Video Attachment System - Quick Reference

## Installation (5 minutes)

```bash
# 1. Install ffmpeg
sudo apt-get install ffmpeg  # Ubuntu/Debian
brew install ffmpeg          # macOS
choco install ffmpeg         # Windows

# 2. Install Python dependencies
pip install Pillow>=9.0

# 3. Run migration
python manage.py migrate chat

# 4. Create media directories
mkdir -p media/attachments media/thumbnails

# 5. Test
ffmpeg -version && ffprobe -version
```

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/chat/videos/upload/` | Upload video |
| GET | `/api/chat/videos/<id>/download/` | Download video |
| GET | `/api/chat/attachments/<id>/` | Get attachment details |
| DELETE | `/api/chat/attachments/<id>/` | Delete attachment |
| POST | `/api/chat/upload/` | Upload any file type |

## Upload Video

```bash
curl -X POST http://localhost:8000/api/chat/videos/upload/ \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@video.mp4" \
  -F "message_id=message-uuid"
```

## Response Fields

```json
{
  "id": "uuid",
  "file_name": "video.mp4",
  "file_type": "video",
  "file_size": 52428800,
  "file_size_mb": 50.0,
  "mime_type": "video/mp4",
  "duration": 120,
  "duration_formatted": "2:00",
  "width": 1920,
  "height": 1080,
  "bitrate": 5000,
  "codec": "h264",
  "url": "http://...",
  "thumbnail_url": "http://...",
  "video_dimensions": [1920, 1080],
  "uploaded_at": "2025-01-15T10:30:00Z"
}
```

## Video Specifications

| Property | Limit | Notes |
|----------|-------|-------|
| Max Size | 100MB | Per video |
| Formats | MP4, WebM, OGG, MOV, AVI, MKV | Validated by MIME type |
| Thumbnail | Auto-generated | At 1-second mark, 320px width |
| Duration | Unlimited | Extracted from metadata |
| Dimensions | Unlimited | Extracted from metadata |

## Key Files

| File | Purpose |
|------|---------|
| `chat/models.py` | Attachment model with video fields |
| `chat/services/video_service.py` | Video processing logic |
| `chat/views_video.py` | Upload/download views |
| `chat/serializers_video.py` | API serializers |
| `chat/migrations/0004_video_attachments.py` | Database migration |

## Common Tasks

### Extract Video Metadata
```python
from chat.services.video_service import VideoProcessingService

metadata = VideoProcessingService.extract_video_metadata('/path/to/video.mp4')
# Returns: {'width': 1920, 'height': 1080, 'duration': 120, 'bitrate': 5000, 'codec': 'h264'}
```

### Generate Thumbnail
```python
VideoProcessingService.generate_thumbnail(
    '/path/to/video.mp4',
    '/path/to/thumbnail.jpg',
    timestamp=1
)
```

### Process Video Attachment
```python
from chat.models import Attachment
from chat.services.video_service import VideoProcessingService

attachment = Attachment.objects.get(id='uuid')
VideoProcessingService.process_video_attachment(attachment)
```

### Validate Video File
```python
is_valid, error = VideoProcessingService.validate_video_file(file_obj)
if not is_valid:
    print(f"Error: {error}")
```

## Django Settings

```python
# Add to settings
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

VIDEO_PROCESSING_ENABLED = True
VIDEO_THUMBNAIL_TIMESTAMP = 1
VIDEO_MAX_SIZE = 100 * 1024 * 1024

FILE_UPLOAD_MAX_MEMORY_SIZE = 104857600
DATA_UPLOAD_MAX_MEMORY_SIZE = 104857600
```

## URL Configuration

```python
# In urls.py
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # ... your patterns
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

## React Component

```typescript
import { useState } from 'react';

function VideoUpload({ messageId, onComplete }) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File) => {
    if (file.size > 100 * 1024 * 1024) {
      alert('Video must be less than 100MB');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('message_id', messageId);

    setUploading(true);
    try {
      const response = await fetch('/api/chat/videos/upload/', {
        method: 'POST',
        body: formData,
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      onComplete(data);
    } finally {
      setUploading(false);
    }
  };

  return (
    <input
      type="file"
      accept="video/*"
      onChange={(e) => handleUpload(e.target.files[0])}
      disabled={uploading}
    />
  );
}
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| FFmpeg not found | Install: `sudo apt-get install ffmpeg` |
| Permission denied | `sudo chown -R www-data:www-data media/` |
| Timeout error | Increase timeout in video_service.py |
| No thumbnail | Verify Pillow: `pip install Pillow` |
| Upload fails | Check file size and format |

## Testing

```bash
# Create test video
ffmpeg -f lavfi -i testsrc=s=320x240:d=10 -f lavfi -i sine test.mp4

# Upload
curl -X POST http://localhost:8000/api/chat/videos/upload/ \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@test.mp4" \
  -F "message_id=UUID"

# Run tests
python manage.py test chat.tests.VideoUploadTestCase
```

## Performance Tips

1. **Async Processing**: Use Celery for large videos
2. **Caching**: Cache thumbnails for 30 days
3. **CDN**: Serve media from CDN in production
4. **S3**: Use AWS S3 for media storage
5. **Compression**: Compress videos before upload

## Database Queries

```python
# Get all videos
from chat.models import Attachment
videos = Attachment.objects.filter(file_type='video')

# Get videos without thumbnails
videos_no_thumb = Attachment.objects.filter(
    file_type='video',
    thumbnail__isnull=True
)

# Get videos by size
large_videos = Attachment.objects.filter(
    file_type='video',
    file_size__gt=50*1024*1024
)

# Get recent videos
from django.utils import timezone
from datetime import timedelta
recent = Attachment.objects.filter(
    file_type='video',
    uploaded_at__gte=timezone.now()-timedelta(days=7)
)
```

## Logging

```python
import logging
logger = logging.getLogger('chat.services.video_service')

# Check logs
tail -f django.log | grep video_service
```

## Production Checklist

- [ ] FFmpeg installed on server
- [ ] Media directory writable
- [ ] Sufficient disk space
- [ ] Database migrated
- [ ] Settings configured
- [ ] URL patterns updated
- [ ] Media served by web server
- [ ] Backups configured
- [ ] Monitoring enabled
- [ ] Error logging configured

## Documentation

- Full Guide: `docs/VIDEO_ATTACHMENT_GUIDE.md`
- Setup: `docs/VIDEO_SETUP_GUIDE.md`
- Implementation: `VIDEO_IMPLEMENTATION_SUMMARY.md`

## Support

For issues:
1. Check logs: `tail -f django.log`
2. Verify FFmpeg: `ffmpeg -version`
3. Test upload: Use curl command above
4. Review documentation
