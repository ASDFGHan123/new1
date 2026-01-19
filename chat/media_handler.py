"""
Enhanced Media Handler - Comprehensive media support for all file types
"""
import os
import mimetypes
from typing import Dict, List, Tuple, Optional
from enum import Enum
import hashlib

class MediaType(Enum):
    """Comprehensive media type classification"""
    # Images
    IMAGE_JPEG = ('image/jpeg', ['.jpg', '.jpeg'])
    IMAGE_PNG = ('image/png', ['.png'])
    IMAGE_GIF = ('image/gif', ['.gif'])
    IMAGE_WEBP = ('image/webp', ['.webp'])
    IMAGE_SVG = ('image/svg+xml', ['.svg'])
    IMAGE_BMP = ('image/bmp', ['.bmp'])
    IMAGE_TIFF = ('image/tiff', ['.tiff', '.tif'])
    
    # Audio
    AUDIO_MP3 = ('audio/mpeg', ['.mp3'])
    AUDIO_WAV = ('audio/wav', ['.wav'])
    AUDIO_OGG = ('audio/ogg', ['.ogg', '.oga'])
    AUDIO_AAC = ('audio/aac', ['.aac'])
    AUDIO_FLAC = ('audio/flac', ['.flac'])
    AUDIO_M4A = ('audio/mp4', ['.m4a'])
    AUDIO_WMA = ('audio/x-ms-wma', ['.wma'])
    
    # Video
    VIDEO_MP4 = ('video/mp4', ['.mp4'])
    VIDEO_WEBM = ('video/webm', ['.webm'])
    VIDEO_OGG = ('video/ogg', ['.ogv'])
    VIDEO_MOV = ('video/quicktime', ['.mov'])
    VIDEO_AVI = ('video/x-msvideo', ['.avi'])
    VIDEO_MKV = ('video/x-matroska', ['.mkv'])
    VIDEO_FLV = ('video/x-flv', ['.flv'])
    VIDEO_WMV = ('video/x-ms-wmv', ['.wmv'])
    VIDEO_3GP = ('video/3gpp', ['.3gp'])
    
    # Documents
    DOC_PDF = ('application/pdf', ['.pdf'])
    DOC_WORD = ('application/msword', ['.doc'])
    DOC_WORD_X = ('application/vnd.openxmlformats-officedocument.wordprocessingml.document', ['.docx'])
    DOC_EXCEL = ('application/vnd.ms-excel', ['.xls'])
    DOC_EXCEL_X = ('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', ['.xlsx'])
    DOC_PPT = ('application/vnd.ms-powerpoint', ['.ppt'])
    DOC_PPT_X = ('application/vnd.openxmlformats-officedocument.presentationml.presentation', ['.pptx'])
    DOC_ODP = ('application/vnd.oasis.opendocument.presentation', ['.odp'])
    DOC_ODS = ('application/vnd.oasis.opendocument.spreadsheet', ['.ods'])
    DOC_ODT = ('application/vnd.oasis.opendocument.text', ['.odt'])
    
    # Text
    TEXT_PLAIN = ('text/plain', ['.txt'])
    TEXT_CSV = ('text/csv', ['.csv'])
    TEXT_TSV = ('text/tab-separated-values', ['.tsv'])
    TEXT_JSON = ('application/json', ['.json'])
    TEXT_XML = ('application/xml', ['.xml'])
    TEXT_YAML = ('application/x-yaml', ['.yaml', '.yml'])
    TEXT_MARKDOWN = ('text/markdown', ['.md', '.markdown'])
    TEXT_HTML = ('text/html', ['.html', '.htm'])
    
    # Archives
    ARCHIVE_ZIP = ('application/zip', ['.zip'])
    ARCHIVE_RAR = ('application/x-rar-compressed', ['.rar'])
    ARCHIVE_7Z = ('application/x-7z-compressed', ['.7z'])
    ARCHIVE_TAR = ('application/x-tar', ['.tar'])
    ARCHIVE_GZIP = ('application/gzip', ['.gz', '.gzip'])
    ARCHIVE_BZIP2 = ('application/x-bzip2', ['.bz2'])
    
    # Code Files
    CODE_PYTHON = ('text/x-python', ['.py'])
    CODE_JAVASCRIPT = ('text/javascript', ['.js', '.mjs'])
    CODE_TYPESCRIPT = ('text/typescript', ['.ts', '.tsx'])
    CODE_JAVA = ('text/x-java-source', ['.java'])
    CODE_CPP = ('text/x-c++src', ['.cpp', '.cc', '.cxx'])
    CODE_C = ('text/x-csrc', ['.c'])
    CODE_CSHARP = ('text/x-csharp', ['.cs'])
    CODE_PHP = ('application/x-php', ['.php'])
    CODE_RUBY = ('text/x-ruby', ['.rb'])
    CODE_GO = ('text/x-go', ['.go'])
    CODE_RUST = ('text/x-rust', ['.rs'])
    CODE_SQL = ('text/x-sql', ['.sql'])
    CODE_SHELL = ('application/x-sh', ['.sh', '.bash'])
    
    # 3D Models
    MODEL_OBJ = ('model/obj', ['.obj'])
    MODEL_FBX = ('model/x-fbx', ['.fbx'])
    MODEL_GLTF = ('model/gltf+json', ['.gltf'])
    MODEL_GLB = ('model/gltf-binary', ['.glb'])
    MODEL_STL = ('model/stl', ['.stl'])
    
    # GIS Data
    GIS_SHAPEFILE = ('application/x-shapefile', ['.shp'])
    GIS_GEOJSON = ('application/geo+json', ['.geojson'])
    GIS_KML = ('application/vnd.google-earth.kml+xml', ['.kml'])
    
    # Other
    OTHER = ('application/octet-stream', [])


class MediaCategory(Enum):
    """Media category for grouping"""
    IMAGE = 'image'
    AUDIO = 'audio'
    VIDEO = 'video'
    DOCUMENT = 'document'
    TEXT = 'text'
    ARCHIVE = 'archive'
    CODE = 'code'
    MODEL = 'model'
    GIS = 'gis'
    OTHER = 'other'


class MediaHandler:
    """Comprehensive media handler for all file types"""
    
    # File size limits (in bytes)
    DEFAULT_LIMITS = {
        MediaCategory.IMAGE: 50 * 1024 * 1024,      # 50MB
        MediaCategory.AUDIO: 100 * 1024 * 1024,     # 100MB
        MediaCategory.VIDEO: 500 * 1024 * 1024,     # 500MB
        MediaCategory.DOCUMENT: 50 * 1024 * 1024,   # 50MB
        MediaCategory.TEXT: 10 * 1024 * 1024,       # 10MB
        MediaCategory.ARCHIVE: 100 * 1024 * 1024,   # 100MB
        MediaCategory.CODE: 10 * 1024 * 1024,       # 10MB
        MediaCategory.MODEL: 200 * 1024 * 1024,     # 200MB
        MediaCategory.GIS: 50 * 1024 * 1024,        # 50MB
        MediaCategory.OTHER: 10 * 1024 * 1024,      # 10MB
    }
    
    # Magic numbers for file validation
    MAGIC_NUMBERS = {
        b'\xFF\xD8\xFF': 'image/jpeg',
        b'\x89PNG': 'image/png',
        b'GIF8': 'image/gif',
        b'RIFF': 'audio/wav',
        b'ID3': 'audio/mpeg',
        b'\xFF\xFB': 'audio/mpeg',
        b'%PDF': 'application/pdf',
        b'PK\x03\x04': 'application/zip',
        b'Rar!': 'application/x-rar-compressed',
        b'7z\xBC\xAF\x27\x1C': 'application/x-7z-compressed',
    }
    
    @staticmethod
    def get_media_type(mime_type: str) -> Optional[MediaType]:
        """Get MediaType enum from MIME type"""
        for media_type in MediaType:
            if media_type.value[0] == mime_type:
                return media_type
        return None
    
    @staticmethod
    def get_category(mime_type: str) -> MediaCategory:
        """Determine media category from MIME type"""
        if mime_type.startswith('image/'):
            return MediaCategory.IMAGE
        elif mime_type.startswith('audio/'):
            return MediaCategory.AUDIO
        elif mime_type.startswith('video/'):
            return MediaCategory.VIDEO
        elif mime_type.startswith('text/'):
            if 'x-' in mime_type:  # Code files
                return MediaCategory.CODE
            return MediaCategory.TEXT
        elif 'application' in mime_type:
            if any(x in mime_type for x in ['pdf', 'word', 'excel', 'powerpoint', 'oasis']):
                return MediaCategory.DOCUMENT
            elif any(x in mime_type for x in ['zip', 'rar', '7z', 'tar', 'gzip', 'bzip']):
                return MediaCategory.ARCHIVE
            elif any(x in mime_type for x in ['json', 'xml', 'yaml', 'markdown']):
                return MediaCategory.TEXT
            elif any(x in mime_type for x in ['python', 'javascript', 'java', 'c++', 'php', 'ruby', 'go', 'rust', 'sql', 'sh']):
                return MediaCategory.CODE
        elif 'model' in mime_type:
            return MediaCategory.MODEL
        elif 'geo' in mime_type or 'shapefile' in mime_type or 'kml' in mime_type:
            return MediaCategory.GIS
        
        return MediaCategory.OTHER
    
    @staticmethod
    def validate_file(file_path: str, mime_type: str, file_size: int, 
                     custom_limits: Optional[Dict] = None) -> Tuple[bool, str]:
        """
        Validate file with comprehensive checks
        
        Returns: (is_valid, error_message)
        """
        # Check file exists
        if not os.path.exists(file_path):
            return False, "File does not exist"
        
        # Check file size
        limits = {**MediaHandler.DEFAULT_LIMITS}
        if custom_limits:
            limits.update(custom_limits)
        
        category = MediaHandler.get_category(mime_type)
        max_size = limits.get(category, limits[MediaCategory.OTHER])
        
        if file_size > max_size:
            max_mb = max_size / (1024 * 1024)
            return False, f"File size exceeds limit of {max_mb}MB"
        
        # Validate magic numbers
        if not MediaHandler.validate_magic_number(file_path, mime_type):
            return False, "File content does not match declared type"
        
        return True, ""
    
    @staticmethod
    def validate_magic_number(file_path: str, expected_mime: str) -> bool:
        """Validate file magic number"""
        try:
            with open(file_path, 'rb') as f:
                header = f.read(16)
            
            for magic, mime in MediaHandler.MAGIC_NUMBERS.items():
                if header.startswith(magic):
                    # Allow if matches or if expected is generic
                    if mime == expected_mime or expected_mime == 'application/octet-stream':
                        return True
            
            # If no magic number matched, allow if it's a text-based format
            if expected_mime.startswith('text/') or 'json' in expected_mime or 'xml' in expected_mime:
                return True
            
            return False
        except Exception:
            return True  # Allow if can't read
    
    @staticmethod
    def get_file_extension(file_path: str) -> str:
        """Get file extension"""
        return os.path.splitext(file_path)[1].lower()
    
    @staticmethod
    def get_file_hash(file_path: str, algorithm: str = 'sha256') -> str:
        """Calculate file hash for integrity verification"""
        hash_obj = hashlib.new(algorithm)
        with open(file_path, 'rb') as f:
            for chunk in iter(lambda: f.read(4096), b''):
                hash_obj.update(chunk)
        return hash_obj.hexdigest()
    
    @staticmethod
    def get_supported_types() -> Dict[str, List[str]]:
        """Get all supported MIME types grouped by category"""
        supported = {}
        for media_type in MediaType:
            mime = media_type.value[0]
            category = MediaHandler.get_category(mime)
            if category.value not in supported:
                supported[category.value] = []
            supported[category.value].append(mime)
        return supported
    
    @staticmethod
    def is_supported(mime_type: str) -> bool:
        """Check if MIME type is supported"""
        for media_type in MediaType:
            if media_type.value[0] == mime_type:
                return True
        return False
    
    @staticmethod
    def get_category_icon(category: MediaCategory) -> str:
        """Get icon name for media category"""
        icons = {
            MediaCategory.IMAGE: '🖼️',
            MediaCategory.AUDIO: '🎵',
            MediaCategory.VIDEO: '🎬',
            MediaCategory.DOCUMENT: '📄',
            MediaCategory.TEXT: '📝',
            MediaCategory.ARCHIVE: '📦',
            MediaCategory.CODE: '💻',
            MediaCategory.MODEL: '🎨',
            MediaCategory.GIS: '🗺️',
            MediaCategory.OTHER: '📎',
        }
        return icons.get(category, '📎')
    
    @staticmethod
    def get_file_info(file_path: str, mime_type: str) -> Dict:
        """Get comprehensive file information"""
        try:
            file_size = os.path.getsize(file_path)
            category = MediaHandler.get_category(mime_type)
            
            return {
                'path': file_path,
                'name': os.path.basename(file_path),
                'extension': MediaHandler.get_file_extension(file_path),
                'mime_type': mime_type,
                'category': category.value,
                'size': file_size,
                'size_mb': round(file_size / (1024 * 1024), 2),
                'hash': MediaHandler.get_file_hash(file_path),
                'icon': MediaHandler.get_category_icon(category),
                'is_supported': MediaHandler.is_supported(mime_type),
            }
        except Exception as e:
            return {'error': str(e)}


# Export for use in Django views
__all__ = ['MediaHandler', 'MediaType', 'MediaCategory']
