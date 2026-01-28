# Video Attachment System - Integration Checklist

## Pre-Implementation Verification

- [ ] Django 4.2+ installed
- [ ] Python 3.9+ available
- [ ] Database accessible
- [ ] Media directory exists
- [ ] FFmpeg available on system

## Installation Steps

### Step 1: System Dependencies
- [ ] FFmpeg installed (`ffmpeg -version`)
- [ ] FFprobe available (`ffprobe -version`)
- [ ] Sufficient disk space (at least 5GB for media)

### Step 2: Python Dependencies
- [ ] Pillow 9.0+ installed (`pip install Pillow`)
- [ ] DRF 3.14+ available
- [ ] Django 4.2+ available

### Step 3: Database Migration
- [ ] Migration file created: `chat/migrations/0004_video_attachments.py`
- [ ] Migration applied: `python manage.py migrate chat`
- [ ] New fields verified in database

### Step 4: File Structure
- [ ] `chat/services/video_service.py` created
- [ ] `chat/views_video.py` created
- [ ] `chat/serializers_video.py` created
- [ ] `chat/urls_video.py` created
- [ ] `chat/models.py` updated with video fields

### Step 5: Configuration
- [ ] `MEDIA_URL` configured in settings
- [ ] `MEDIA_ROOT` configured in settings
- [ ] Media directories created and writable
- [ ] URL patterns updated to serve media

### Step 6: Documentation
- [ ] `docs/VIDEO_ATTACHMENT_GUIDE.md` available
- [ ] `docs/VIDEO_SETUP_GUIDE.md` available
- [ ] `VIDEO_IMPLEMENTATION_SUMMARY.md` available
- [ ] `VIDEO_QUICK_REFERENCE.md` available

## Verification Tests

### Test 1: FFmpeg Installation
```bash
ffmpeg -version
ffprobe -version
```
Expected: Version information displayed

### Test 2: Python Dependencies
```bash
python -c "from PIL import Image; print('Pillow OK')"
```
Expected: "Pillow OK" printed

### Test 3: Database Migration
```bash
python manage.py showmigrations chat
```
Expected: 0004_video_attachments marked as applied

### Test 4: Media Directories
```bash
ls -la media/attachments
ls -la media/thumbnails
```
Expected: Directories exist and are writable

### Test 5: Create Test Video
```bash
ffmpeg -f lavfi -i testsrc=s=320x240:d=10 -f lavfi -i sine test_video.mp4
```
Expected: test_video.mp4 created (about 1MB)

### Test 6: API Endpoint
```bash
curl -X POST http://localhost:8000/api/chat/videos/upload/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test_video.mp4" \
  -F "message_id=YOUR_MESSAGE_ID"
```
Expected: JSON response with video metadata

### Test 7: Metadata Extraction
```python
python manage.py shell
from chat.services.video_service import VideoProcessingService
metadata = VideoProcessingService.extract_video_metadata('test_video.mp4')
print(metadata)
```
Expected: Dictionary with width, height, duration, bitrate, codec

### Test 8: Thumbnail Generation
```python
VideoProcessingService.generate_thumbnail('test_video.mp4', 'thumb.jpg')
```
Expected: thumb.jpg created in current directory

## Integration Points

### 1. Message Model
```python
# Videos attached to messages
message = Message.objects.get(id='uuid')
videos = message.attachments.filter(file_type='video')
```

### 2. Conversation Access Control
```python
# Only participants can upload/download
if conversation.is_participant(user):
    # Allow video operations
```

### 3. Activity Logging
```python
# All operations logged
UserActivity.objects.create(
    user=user,
    action='file_uploaded',
    description='Uploaded video...'
)
```

### 4. Serialization
```python
# Videos included in message serialization
serializer = MessageSerializer(message)
# attachments field includes video metadata
```

## API Endpoints Summary

### Video Upload
```
POST /api/chat/videos/upload/
Content-Type: multipart/form-data

Parameters:
- file: Video file (max 100MB)
- message_id: UUID of message

Response: 201 Created
{
  "id": "uuid",
  "file_name": "video.mp4",
  "file_type": "video",
  "duration": 120,
  "width": 1920,
  "height": 1080,
  "url": "...",
  "thumbnail_url": "..."
}
```

### Video Download
```
GET /api/chat/videos/<attachment_id>/download/

Response: 200 OK
{
  "id": "uuid",
  "url": "...",
  "thumbnail_url": "..."
}
```

### Generic File Upload
```
POST /api/chat/upload/
Content-Type: multipart/form-data

Parameters:
- file: Any file (size limits by type)
- message_id: UUID of message

Response: 201 Created
```

### Get Attachment
```
GET /api/chat/attachments/<attachment_id>/

Response: 200 OK
{
  "id": "uuid",
  "file_name": "...",
  "file_type": "video",
  ...
}
```

### Delete Attachment
```
DELETE /api/chat/attachments/<attachment_id>/

Response: 200 OK
{
  "message": "Attachment deleted successfully"
}
```

## Database Schema

### Attachment Table
```sql
CREATE TABLE attachments (
    id UUID PRIMARY KEY,
    message_id UUID NOT NULL,
    file VARCHAR(255),
    file_name VARCHAR(255),
    file_type VARCHAR(20),
    file_size INTEGER,
    mime_type VARCHAR(100),
    duration INTEGER,
    thumbnail VARCHAR(255),
    width INTEGER,
    height INTEGER,
    bitrate INTEGER,
    codec VARCHAR(50),
    uploaded_at TIMESTAMP
);

CREATE INDEX idx_attachment_message ON attachments(message_id);
CREATE INDEX idx_attachment_type ON attachments(file_type);
CREATE INDEX idx_attachment_uploaded ON attachments(uploaded_at);
```

## Performance Metrics

### Expected Performance
- Video upload: < 5 seconds (for 50MB file)
- Metadata extraction: < 2 seconds
- Thumbnail generation: < 3 seconds
- API response: < 500ms

### Optimization Opportunities
- [ ] Implement async processing with Celery
- [ ] Add Redis caching for metadata
- [ ] Use CDN for media delivery
- [ ] Implement S3 storage
- [ ] Add video compression on upload

## Security Checklist

- [ ] File type validation implemented
- [ ] Size limits enforced
- [ ] Access control verified
- [ ] Activity logging enabled
- [ ] Temporary files cleaned up
- [ ] CORS configured properly
- [ ] Rate limiting applied
- [ ] Input sanitization done

## Monitoring Setup

### Logs to Monitor
```bash
# Video processing errors
grep "video_service" django.log

# Upload failures
grep "file_uploaded" django.log

# Processing timeouts
grep "TimeoutExpired" django.log
```

### Metrics to Track
- [ ] Video upload success rate
- [ ] Average processing time
- [ ] Storage usage
- [ ] Thumbnail generation success
- [ ] API response times

## Troubleshooting Guide

### Issue: FFmpeg not found
```bash
# Solution
which ffmpeg
export PATH=$PATH:/usr/bin
```

### Issue: Permission denied on media
```bash
# Solution
sudo chown -R www-data:www-data media/
sudo chmod -R 755 media/
```

### Issue: Thumbnail not generated
```bash
# Solution
pip install --upgrade Pillow
python manage.py shell
from chat.models import Attachment
att = Attachment.objects.get(id='uuid')
from chat.services.video_service import VideoProcessingService
VideoProcessingService.process_video_attachment(att)
```

### Issue: Upload timeout
```python
# In video_service.py, increase timeout
result = subprocess.run(cmd, capture_output=True, timeout=60)
```

## Rollback Plan

If issues occur:

1. **Revert Migration**
```bash
python manage.py migrate chat 0003_alter_group_name
```

2. **Remove New Files**
```bash
rm chat/services/video_service.py
rm chat/views_video.py
rm chat/serializers_video.py
rm chat/urls_video.py
```

3. **Restore Original Models**
```bash
git checkout chat/models.py
```

4. **Clear Media**
```bash
rm -rf media/thumbnails/*
```

## Post-Implementation Tasks

- [ ] Update API documentation
- [ ] Train team on new features
- [ ] Set up monitoring alerts
- [ ] Configure backups
- [ ] Plan capacity for storage
- [ ] Schedule maintenance windows
- [ ] Document known limitations
- [ ] Create user guide

## Sign-Off

- [ ] Development complete
- [ ] Testing passed
- [ ] Documentation reviewed
- [ ] Performance acceptable
- [ ] Security verified
- [ ] Ready for production

## Contact & Support

For issues or questions:
1. Review documentation in `docs/`
2. Check `VIDEO_QUICK_REFERENCE.md`
3. Review logs in `django.log`
4. Test with sample video
5. Contact development team

---

**Implementation Date:** 2025-01-15
**Version:** 1.0
**Status:** Ready for Production
