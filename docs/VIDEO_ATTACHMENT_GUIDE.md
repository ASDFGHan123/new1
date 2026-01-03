# Video Attachment System Documentation

## Overview

The OffChat Admin Dashboard now includes comprehensive video sending and receiving capabilities. Videos are handled as attachments to messages with automatic metadata extraction, thumbnail generation, and streaming support.

## Features

### Video Upload
- **Supported Formats**: MP4, WebM, OGG, MOV, AVI, MKV
- **Maximum Size**: 100MB per video
- **Automatic Processing**:
  - Metadata extraction (duration, dimensions, bitrate, codec)
  - Thumbnail generation at 1-second mark
  - Video validation before upload

### Video Metadata
- **Duration**: Video length in seconds with formatted display (MM:SS)
- **Dimensions**: Width and height in pixels
- **Bitrate**: Video bitrate in kbps
- **Codec**: Video codec information
- **Thumbnail**: Auto-generated preview image

### Video Streaming
- Direct download links for video files
- Thumbnail preview URLs
- Activity logging for all video operations

## API Endpoints

### Upload Video
```
POST /api/chat/videos/upload/
```

**Request:**
```json
{
  "file": "<video_file>",
  "message_id": "<message_uuid>"
}
```

**Response:**
```json
{
  "id": "<attachment_uuid>",
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
  "url": "http://example.com/media/attachments/2025/01/15/video.mp4",
  "thumbnail_url": "http://example.com/media/thumbnails/2025/01/15/thumb.jpg",
  "video_dimensions": [1920, 1080],
  "uploaded_at": "2025-01-15T10:30:00Z"
}
```

### Download Video
```
GET /api/chat/videos/<attachment_id>/download/
```

**Response:** Video attachment metadata with download URL

### Upload File (Generic)
```
POST /api/chat/upload/
```

Supports images, audio, video, and documents with appropriate size limits:
- Images: 10MB
- Videos: 100MB
- Audio: 50MB
- Documents: 20MB

### Get Attachment Details
```
GET /api/chat/attachments/<attachment_id>/
```

### Delete Attachment
```
DELETE /api/chat/attachments/<attachment_id>/
```

## Database Schema

### Attachment Model Fields

```python
class Attachment(models.Model):
    # Core fields
    id: UUID (primary key)
    message: ForeignKey(Message)
    file: FileField
    file_name: CharField(255)
    file_type: CharField(choices=['image', 'video', 'audio', 'document', 'other'])
    file_size: PositiveIntegerField (bytes)
    mime_type: CharField(100)
    uploaded_at: DateTimeField
    
    # Audio/Video fields
    duration: PositiveIntegerField (seconds, nullable)
    
    # Video-specific fields
    thumbnail: ImageField (nullable)
    width: PositiveIntegerField (nullable)
    height: PositiveIntegerField (nullable)
    bitrate: PositiveIntegerField (kbps, nullable)
    codec: CharField(50, nullable)
```

## Video Processing Service

### VideoProcessingService Class

Located in `chat/services/video_service.py`

#### Methods

**extract_video_metadata(file_path)**
- Extracts video metadata using ffprobe
- Returns: dict with width, height, duration, bitrate, codec
- Requires: ffprobe installed

**generate_thumbnail(file_path, output_path, timestamp=1)**
- Generates thumbnail at specified timestamp
- Returns: bool (success/failure)
- Requires: ffmpeg installed

**validate_video_file(file_obj)**
- Validates video format and size
- Returns: tuple (is_valid, error_message)

**process_video_attachment(attachment)**
- Complete video processing pipeline
- Extracts metadata and generates thumbnail
- Saves processed data to attachment

## Installation Requirements

### System Dependencies

For video processing, install ffmpeg and ffprobe:

**Ubuntu/Debian:**
```bash
sudo apt-get install ffmpeg
```

**macOS:**
```bash
brew install ffmpeg
```

**Windows:**
Download from https://ffmpeg.org/download.html or use:
```bash
choco install ffmpeg
```

### Python Dependencies

Add to requirements.txt:
```
Django>=4.2
djangorestframework>=3.14
Pillow>=9.0
```

## Frontend Integration

### React Component Example

```typescript
import { useState } from 'react';

function VideoUpload({ messageId, onUploadComplete }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleVideoUpload = async (file: File) => {
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
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      onUploadComplete(data);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="video/*"
        onChange={(e) => handleVideoUpload(e.target.files[0])}
        disabled={uploading}
      />
      {uploading && <p>Uploading... {progress}%</p>}
    </div>
  );
}
```

### Video Display Component

```typescript
function VideoMessage({ attachment }) {
  return (
    <div className="video-message">
      {attachment.thumbnail_url && (
        <img 
          src={attachment.thumbnail_url} 
          alt="Video thumbnail"
          className="video-thumbnail"
        />
      )}
      <video
        controls
        width={attachment.width}
        height={attachment.height}
        src={attachment.url}
      >
        Your browser does not support the video tag.
      </video>
      <div className="video-info">
        <p>{attachment.file_name}</p>
        <p>{attachment.duration_formatted} • {attachment.file_size_mb}MB</p>
      </div>
    </div>
  );
}
```

## Configuration

### Settings

Add to Django settings:

```python
# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Video processing
VIDEO_PROCESSING_ENABLED = True
VIDEO_THUMBNAIL_TIMESTAMP = 1  # seconds
VIDEO_MAX_SIZE = 100 * 1024 * 1024  # 100MB

# Cache for video processing status
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
    }
}
```

## Error Handling

### Common Errors

**"File type must be a video format"**
- Ensure file has correct MIME type
- Supported: mp4, webm, ogg, mov, avi, mkv

**"Video file size cannot exceed 100MB"**
- Compress video before uploading
- Use ffmpeg: `ffmpeg -i input.mp4 -crf 28 output.mp4`

**"Video processing failed"**
- Check ffmpeg/ffprobe installation
- Verify file is valid video format
- Check disk space for thumbnail generation

## Performance Optimization

### Thumbnail Caching
Thumbnails are cached in media/thumbnails/ directory with date-based organization.

### Lazy Loading
Video metadata is extracted asynchronously to prevent blocking uploads.

### Database Indexing
Attachments are indexed by:
- message_id
- file_type
- uploaded_at

## Security Considerations

1. **File Validation**: All videos validated before processing
2. **Size Limits**: Enforced maximum file sizes per type
3. **Access Control**: Only conversation participants can access videos
4. **Activity Logging**: All video operations logged for audit trail
5. **Temporary Files**: Cleaned up after processing

## Troubleshooting

### Videos not processing
1. Verify ffmpeg installed: `ffmpeg -version`
2. Check file permissions on media directory
3. Review Django logs for errors
4. Ensure sufficient disk space

### Thumbnails not generating
1. Verify Pillow installed: `pip install Pillow`
2. Check video file validity
3. Ensure write permissions on thumbnails directory

### Upload failures
1. Check file size limits
2. Verify MIME type detection
3. Review network connectivity
4. Check server disk space

## Migration Guide

### From Previous Version

Run migrations:
```bash
python manage.py migrate chat
```

This adds:
- thumbnail field
- width, height fields
- bitrate, codec fields

Existing attachments will have null values for new fields. Process them:
```bash
python manage.py shell
from chat.models import Attachment
from chat.services.video_service import VideoProcessingService

for attachment in Attachment.objects.filter(file_type='video', width__isnull=True):
    VideoProcessingService.process_video_attachment(attachment)
```

## Future Enhancements

- [ ] Video transcoding to multiple formats
- [ ] Adaptive bitrate streaming (HLS/DASH)
- [ ] Video compression on upload
- [ ] Advanced metadata extraction (fps, color space)
- [ ] Video preview generation (multiple frames)
- [ ] Subtitle support
- [ ] Video editing capabilities
