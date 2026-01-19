# Media Support Implementation Guide

## Overview
This guide provides step-by-step instructions to integrate comprehensive media support into the OffChat system.

## Files Created

### 1. `chat/media_handler.py`
Comprehensive media handler with:
- Support for 50+ media types
- File validation with magic number verification
- Category-based file size limits
- File integrity checking
- Media type detection

### 2. `chat/views_enhanced_upload.py`
Enhanced upload views with:
- `EnhancedFileUploadView`: Main upload endpoint with validation
- `MediaInfoView`: Get supported types and limits
- `MediaValidationView`: Pre-upload validation

### 3. `MEDIA_SUPPORT_AUDIT.md`
Comprehensive audit document with:
- Current media support status
- Enhancement requirements
- Implementation checklist
- Testing recommendations

## Integration Steps

### Step 1: Update Django URLs

Add to `chat/urls.py`:

```python
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

### Step 2: Update Frontend API

Update `src/lib/api.ts` to use new endpoints:

```typescript
async uploadFile(conversationId: string, file: File, messageId: string): Promise<ApiResponse<any>> {
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('message_id', messageId);
        
        const url = `${this.baseURL}/chat/upload/`;
        const headers: HeadersInit = {};
        
        let token = this.authToken;
        if (typeof window !== 'undefined') {
            let accessToken = sessionStorage.getItem('access_token');
            if (!accessToken) {
                accessToken = localStorage.getItem('access_token');
            }
            if (accessToken) {
                token = accessToken;
                this.authToken = accessToken;
            }
        }
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await this.fetchWithRetry(url, {
            method: 'POST',
            headers,
            body: formData,
        });
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Upload failed');
        }
        
        return { data, success: true };
    } catch (error) {
        return {
            data: null,
            success: false,
            error: error instanceof Error ? error.message : 'Upload failed'
        };
    }
}

async getMediaInfo(): Promise<ApiResponse<any>> {
    return this.request('/chat/media/info/');
}

async validateMedia(file: File): Promise<ApiResponse<any>> {
    try {
        const formData = new FormData();
        formData.append('file', file);
        
        const url = `${this.baseURL}/chat/media/validate/`;
        const headers: HeadersInit = {};
        
        let token = this.authToken;
        if (typeof window !== 'undefined') {
            let accessToken = sessionStorage.getItem('access_token');
            if (!accessToken) {
                accessToken = localStorage.getItem('access_token');
            }
            if (accessToken) {
                token = accessToken;
                this.authToken = accessToken;
            }
        }
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: formData,
        });
        
        const data = await response.json();
        return { data, success: response.ok };
    } catch (error) {
        return {
            data: null,
            success: false,
            error: error instanceof Error ? error.message : 'Validation failed'
        };
    }
}
```

### Step 3: Update Settings

Update `offchat_backend/settings/base.py`:

```python
# File Upload Settings - Enhanced
FILE_UPLOAD_MAX_MEMORY_SIZE = 2147483648  # 2GB
DATA_UPLOAD_MAX_MEMORY_SIZE = 2147483648  # 2GB
FILE_UPLOAD_PERMISSIONS = 0o644
FILE_UPLOAD_DIRECTORY_PERMISSIONS = 0o755

# Media file extensions
ALLOWED_MEDIA_EXTENSIONS = {
    # Images
    'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff', 'tif',
    # Audio
    'mp3', 'wav', 'ogg', 'oga', 'aac', 'flac', 'm4a', 'wma',
    # Video
    'mp4', 'webm', 'ogv', 'mov', 'avi', 'mkv', 'flv', 'wmv', '3gp',
    # Documents
    'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odp', 'ods', 'odt',
    # Text
    'txt', 'csv', 'tsv', 'json', 'xml', 'yaml', 'yml', 'md', 'markdown', 'html', 'htm',
    # Archives
    'zip', 'rar', '7z', 'tar', 'gz', 'gzip', 'bz2',
    # Code
    'py', 'js', 'mjs', 'ts', 'tsx', 'java', 'cpp', 'cc', 'cxx', 'c', 'cs', 'php', 'rb', 'go', 'rs', 'sql', 'sh', 'bash',
    # 3D Models
    'obj', 'fbx', 'gltf', 'glb', 'stl',
    # GIS
    'shp', 'geojson', 'kml',
}
```

### Step 4: Create Frontend Upload Component

Create `src/components/chat/MediaUpload.tsx`:

```typescript
import React, { useState } from 'react';
import { apiService } from '@/lib/api';

interface MediaUploadProps {
    conversationId: string;
    messageId: string;
    onUploadComplete: (attachment: any) => void;
    onError: (error: string) => void;
}

export const MediaUpload: React.FC<MediaUploadProps> = ({
    conversationId,
    messageId,
    onUploadComplete,
    onError
}) => {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [mediaInfo, setMediaInfo] = useState<any>(null);

    React.useEffect(() => {
        loadMediaInfo();
    }, []);

    const loadMediaInfo = async () => {
        const response = await apiService.getMediaInfo();
        if (response.success) {
            setMediaInfo(response.data);
        }
    };

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate before upload
        const validation = await apiService.validateMedia(file);
        if (!validation.success) {
            onError(validation.error || 'File validation failed');
            return;
        }

        // Upload file
        setUploading(true);
        const response = await apiService.uploadFile(conversationId, file, messageId);
        setUploading(false);

        if (response.success) {
            onUploadComplete(response.data.attachment);
        } else {
            onError(response.error || 'Upload failed');
        }
    };

    return (
        <div className="media-upload">
            <input
                type="file"
                onChange={handleFileSelect}
                disabled={uploading}
                accept={mediaInfo?.supported_types ? 
                    Object.values(mediaInfo.supported_types)
                        .flat()
                        .join(',') : '*/*'
                }
            />
            {uploading && <div>Uploading... {progress}%</div>}
            {mediaInfo && (
                <div className="media-info">
                    <p>Supported types: {Object.keys(mediaInfo.supported_types).join(', ')}</p>
                    <p>Max sizes: {JSON.stringify(mediaInfo.limits)}</p>
                </div>
            )}
        </div>
    );
};
```

### Step 5: Update Message Model (Optional)

If you want to track media metadata, update `chat/models.py`:

```python
class Attachment(models.Model):
    # ... existing fields ...
    
    # Enhanced metadata
    file_hash = models.CharField(max_length=256, blank=True, null=True)
    is_scanned = models.BooleanField(default=False)
    scan_result = models.CharField(max_length=50, blank=True, null=True)
    
    class Meta:
        # ... existing meta ...
        indexes = [
            models.Index(fields=['message']),
            models.Index(fields=['file_type']),
            models.Index(fields=['uploaded_at']),
            models.Index(fields=['file_hash']),
        ]
```

### Step 6: Run Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

## Testing

### Test Supported Media Types

```python
from chat.media_handler import MediaHandler

# Get all supported types
supported = MediaHandler.get_supported_types()
print(supported)

# Check if type is supported
is_supported = MediaHandler.is_supported('image/jpeg')
print(is_supported)  # True

# Get category
category = MediaHandler.get_category('video/mp4')
print(category)  # MediaCategory.VIDEO

# Get file info
info = MediaHandler.get_file_info('/path/to/file.mp4', 'video/mp4')
print(info)
```

### Test Upload Endpoint

```bash
# Using curl
curl -X POST http://localhost:8000/api/chat/upload/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/file.mp4" \
  -F "message_id=YOUR_MESSAGE_ID"

# Using Python
import requests

with open('file.mp4', 'rb') as f:
    files = {'file': f}
    data = {'message_id': 'YOUR_MESSAGE_ID'}
    response = requests.post(
        'http://localhost:8000/api/chat/upload/',
        files=files,
        data=data,
        headers={'Authorization': 'Bearer YOUR_TOKEN'}
    )
    print(response.json())
```

## Supported Media Types Summary

### Images (9 types)
- JPEG, PNG, GIF, WebP, SVG, BMP, TIFF

### Audio (8 types)
- MP3, WAV, OGG, AAC, FLAC, M4A, WMA

### Video (9 types)
- MP4, WebM, OGG, MOV, AVI, MKV, FLV, WMV, 3GP

### Documents (10 types)
- PDF, Word, Excel, PowerPoint, OpenDocument formats

### Text (9 types)
- Plain text, CSV, JSON, XML, YAML, Markdown, HTML

### Archives (6 types)
- ZIP, RAR, 7Z, TAR, GZIP, BZIP2

### Code (13 types)
- Python, JavaScript, TypeScript, Java, C++, C#, PHP, Ruby, Go, Rust, SQL, Shell

### 3D Models (5 types)
- OBJ, FBX, GLTF, GLB, STL

### GIS Data (3 types)
- Shapefile, GeoJSON, KML

**Total: 72+ supported media types**

## Security Considerations

1. **File Validation**: Magic number verification prevents file type spoofing
2. **Size Limits**: Category-based limits prevent abuse
3. **Permission Checks**: Only conversation participants can upload
4. **Activity Logging**: All uploads are logged for audit trail
5. **Temporary Files**: Cleaned up after processing

## Performance Optimization

1. **Async Processing**: Use Celery for large file processing
2. **Caching**: Cache media info and supported types
3. **CDN Integration**: Serve media through CDN
4. **Compression**: Compress media before storage
5. **Lazy Loading**: Load media on demand

## Next Steps

1. Implement virus scanning integration
2. Add image optimization and thumbnail generation
3. Implement video transcoding
4. Add resumable uploads
5. Setup CDN integration
6. Implement media encryption
7. Add bandwidth throttling
8. Create media gallery UI

## Support

For issues or questions:
1. Check the MEDIA_SUPPORT_AUDIT.md document
2. Review the media_handler.py implementation
3. Check Django logs for errors
4. Verify file permissions in media directory
