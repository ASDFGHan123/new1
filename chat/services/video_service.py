"""
Video attachment service for processing and managing video files.
"""
import os
import subprocess
from django.core.files.base import ContentFile
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


class VideoProcessingService:
    """Service for processing video attachments."""
    
    SUPPORTED_FORMATS = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv']
    MAX_VIDEO_SIZE = 100 * 1024 * 1024  # 100MB
    
    @staticmethod
    def extract_video_metadata(file_path):
        """Extract video metadata using ffprobe."""
        try:
            cmd = [
                'ffprobe', '-v', 'error',
                '-select_streams', 'v:0',
                '-show_entries', 'stream=width,height,duration,bit_rate,codec_name',
                '-of', 'default=noprint_wrappers=1:nokey=1:nokey=1',
                file_path
            ]
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            
            if result.returncode == 0:
                lines = result.stdout.strip().split('\n')
                if len(lines) >= 5:
                    return {
                        'width': int(float(lines[0])) if lines[0] else None,
                        'height': int(float(lines[1])) if lines[1] else None,
                        'duration': int(float(lines[2])) if lines[2] else None,
                        'bitrate': int(float(lines[3])) if lines[3] else None,
                        'codec': lines[4] if lines[4] else None,
                    }
        except (subprocess.TimeoutExpired, FileNotFoundError, Exception) as e:
            logger.warning(f"Failed to extract video metadata: {str(e)}")
        
        return {}
    
    @staticmethod
    def generate_thumbnail(file_path, output_path, timestamp=1):
        """Generate video thumbnail at specified timestamp."""
        try:
            cmd = [
                'ffmpeg', '-i', file_path,
                '-ss', str(timestamp),
                '-vframes', '1',
                '-vf', 'scale=320:-1',
                '-y', output_path
            ]
            result = subprocess.run(cmd, capture_output=True, timeout=30)
            
            if result.returncode == 0 and os.path.exists(output_path):
                return True
        except (subprocess.TimeoutExpired, FileNotFoundError, Exception) as e:
            logger.warning(f"Failed to generate thumbnail: {str(e)}")
        
        return False
    
    @staticmethod
    def validate_video_file(file_obj):
        """Validate video file format and size."""
        if file_obj.size > VideoProcessingService.MAX_VIDEO_SIZE:
            return False, "Video file exceeds maximum size of 100MB"
        
        file_ext = os.path.splitext(file_obj.name)[1].lower().lstrip('.')
        if file_ext not in VideoProcessingService.SUPPORTED_FORMATS:
            return False, f"Video format .{file_ext} is not supported"
        
        return True, None
    
    @staticmethod
    def process_video_attachment(attachment):
        """Process video attachment: extract metadata and generate thumbnail."""
        try:
            file_path = attachment.file.path
            
            # Extract metadata
            metadata = VideoProcessingService.extract_video_metadata(file_path)
            if metadata:
                attachment.width = metadata.get('width')
                attachment.height = metadata.get('height')
                attachment.duration = metadata.get('duration')
                attachment.bitrate = metadata.get('bitrate')
                attachment.codec = metadata.get('codec')
            
            # Generate thumbnail
            temp_thumbnail_path = f"{file_path}_thumb.jpg"
            if VideoProcessingService.generate_thumbnail(file_path, temp_thumbnail_path):
                with open(temp_thumbnail_path, 'rb') as thumb_file:
                    thumb_name = f"{attachment.id}_thumb.jpg"
                    attachment.thumbnail.save(thumb_name, ContentFile(thumb_file.read()), save=False)
                
                # Clean up temp file
                if os.path.exists(temp_thumbnail_path):
                    os.remove(temp_thumbnail_path)
            
            attachment.save()
            return True
        except Exception as e:
            logger.error(f"Error processing video attachment: {str(e)}")
            return False
