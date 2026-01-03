# Video Attachment System Implementation Summary

## Overview

Complete video sending and receiving system has been implemented for the OffChat Admin Dashboard. Users can now upload, share, and receive videos with automatic metadata extraction and thumbnail generation.

## What Was Added

### 1. Database Migration
**File:** `chat/migrations/0004_video_attachments.py`

New fields added to Attachment model:
- `thumbnail`: ImageField for video preview
- `width`: PositiveIntegerField for video width
- `height`: PositiveIntegerField for video height
- `bitrate`: PositiveIntegerField for video bitrate (kbps)
- `codec`: CharField for video codec information

### 2. Video Processing Service
**File:** `chat/services/video_service.py`

`VideoProcessingService` class with methods:
- `extract_video_metadata()`: Extracts video info using ffprobe
- `generate_thumbnail()`: Creates preview image using ffmpeg
- `validate_video_file()`: Validates format and size
- `process_video_attachment()`: Complete processing pipeline

### 3. Enhanced Models
**File:** `chat/models.py` (updated)

Attachment model enhancements:
- New video metadata fields
- `video_dimensions` property: Returns (width, height) tuple
- `duration_formatted` property: Returns formatted duration (MM:SS)

### 4. API Views
**File:** `chat/views_video.py` (new)

Two new views:
- `VideoUploadView`: Handles video uploads with validation and processing
- `VideoDownloadView`: Provides video download with activity logging

### 5. Enhanced Serializers
**File:** `chat/serializers_video.py` (new)

Updated `AttachmentSerializer` with:
- Video metadata fields (width, height, bitrate, codec)
- Thumbnail URL generation
- Video dimensions and formatted duration
- Complete video information in API responses

### 6. URL Endpoints
**File:** `chat/urls_video.py` (new)

New endpoints:
- `POST /api/chat/videos/upload/` - Upload video
- `GET /api/chat/videos/<id>/download/` - Download video

### 7. Documentation
**Files:**
- `docs/VIDEO_ATTACHMENT_GUIDE.md` - Complete feature documentation
- `docs/VIDEO_SETUP_GUIDE.md` - Installation and setup instructions
- `config/requirements_video.txt` - Video processing dependencies

## Key Features

### Video Upload
- Supported formats: MP4, WebM, OGG, MOV, AVI, MKV
- Maximum size: 100MB
- Automatic validation before processing
- Async metadata extraction and thumbnail generation

### Video Metadata
- Duration (in seconds and formatted MM:SS)
- Dimensions (width × height)
- Bitrate (kbps)
- Codec information
- Auto-generated thumbnail at 1-second mark

### Security
- File type validation
- Size limit enforcement
- Access control (only conversation participants)
- Activity logging for all operations
- Temporary file cleanup

### Performance
- Lazy metadata extraction
- Thumbnail caching
- Database indexing
- Async processing support

## API Usage Examples

### Upload Video
```bash
curl -X POST http://localhost:8000/api/chat/videos/upload/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@video.mp4" \
  -F "message_id=message-uuid"
```

### Response
```json
{
  "id": "attachment-uuid",
  "file_name": "video.mp4",
  "file_type": "video",
  "file_size": 52428800,
  "file_size_mb": 50.0,
  "duration": 120,
  "duration_formatted": "2:00",
  "width": 1920,
  "height": 1080,
  "bitrate": 5000,
  "codec": "h264",
  "url": "http://localhost:8000/media/attachments/2025/01/15/video.mp4",
  "thumbnail_url": "http://localhost:8000/media/thumbnails/2025/01/15/thumb.jpg",
  "video_dimensions": [1920, 1080],
  "uploaded_at": "2025-01-15T10:30:00Z"
}
```

## Installation Steps

### 1. Install System Dependencies
```bash
# Ubuntu/Debian
sudo apt-get install ffmpeg

# macOS
brew install ffmpeg

# Windows
choco install ffmpeg
```

### 2. Install Python Dependencies
```bash
pip install Pillow>=9.0
```

### 3. Run Migration
```bash
python manage.py migrate chat
```

### 4. Update Settings
Add to Django settings:
```python
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
VIDEO_PROCESSING_ENABLED = True
```

### 5. Create Media Directories
```bash
mkdir -p media/attachments media/thumbnails
```

## File Structure

```
chat/
├── migrations/
│   └── 0004_video_attachments.py          # New migration
├── services/
│   └── video_service.py                   # New service
├── models.py                              # Updated with video fields
├── serializers_video.py                   # New serializers
├── views_video.py                         # New views
└── urls_video.py                          # New URLs

docs/
├── VIDEO_ATTACHMENT_GUIDE.md              # Feature documentation
└── VIDEO_SETUP_GUIDE.md                   # Setup instructions

config/
└── requirements_video.txt                 # Video dependencies
```

## Integration with Existing System

### Message Model
Videos are attached to messages via the Attachment model:
```python
message.attachments.all()  # Get all attachments including videos
```

### Conversation Participants
Only conversation participants can:
- Upload videos
- Download videos
- View video metadata

### Activity Logging
All video operations logged:
- Video upload
- Video download
- Attachment deletion

## Frontend Integration

### React Component Example
```typescript
function VideoUpload({ messageId, onComplete }) {
  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('message_id', messageId);
    
    const response = await fetch('/api/chat/videos/upload/', {
      method: 'POST',
      body: formData,
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const data = await response.json();
    onComplete(data);
  };
  
  return (
    <input 
      type="file" 
      accept="video/*" 
      onChange={(e) => handleUpload(e.target.files[0])}
    />
  );
}
```

## Performance Considerations

### Metadata Extraction
- Uses ffprobe for fast metadata reading
- Timeout: 30 seconds per video
- Runs asynchronously to prevent blocking

### Thumbnail Generation
- Generated at 1-second mark
- Scaled to 320px width
- Cached in media/thumbnails/

### Database
- Indexed by message_id, file_type, uploaded_at
- Supports efficient queries for video attachments

## Error Handling

### Common Issues

**"File type not allowed"**
- Ensure video format is supported
- Check MIME type detection

**"Video file size cannot exceed 100MB"**
- Compress video before upload
- Use ffmpeg: `ffmpeg -i input.mp4 -crf 28 output.mp4`

**"Video processing failed"**
- Verify ffmpeg installed
- Check file validity
- Review Django logs

## Testing

### Manual Testing
```bash
# Create test video
ffmpeg -f lavfi -i testsrc=s=320x240:d=10 -f lavfi -i sine test.mp4

# Upload
curl -X POST http://localhost:8000/api/chat/videos/upload/ \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@test.mp4" \
  -F "message_id=UUID"
```

### Automated Testing
```bash
python manage.py test chat.tests.VideoUploadTestCase
```

## Future Enhancements

- [ ] Video transcoding to multiple formats
- [ ] Adaptive bitrate streaming (HLS/DASH)
- [ ] Video compression on upload
- [ ] Advanced metadata (fps, color space)
- [ ] Multiple thumbnail frames
- [ ] Subtitle support
- [ ] Video editing capabilities
- [ ] Streaming progress tracking

## Maintenance

### Monitor Video Processing
```python
from chat.models import Attachment
videos = Attachment.objects.filter(file_type='video', width__isnull=True)
```

### Cleanup Old Thumbnails
```bash
find media/thumbnails -mtime +90 -delete
```

### Check Storage Usage
```bash
du -sh media/
```

## Support Resources

1. **Documentation**: `docs/VIDEO_ATTACHMENT_GUIDE.md`
2. **Setup Guide**: `docs/VIDEO_SETUP_GUIDE.md`
3. **API Endpoints**: See URL configuration
4. **Logs**: Check Django logs for errors

## Compatibility

- Django 4.2+
- Python 3.9+
- FFmpeg 4.0+
- Pillow 9.0+
- DRF 3.14+

## License

Same as OffChat Admin Dashboard (MIT License)
