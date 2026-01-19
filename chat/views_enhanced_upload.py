"""
Enhanced File Upload View - Comprehensive media support
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
import os
import tempfile

from .models import Message, Attachment
from .serializers import AttachmentSerializer
from .media_handler import MediaHandler, MediaCategory
from users.models import UserActivity


class EnhancedFileUploadView(APIView):
    """Enhanced file upload view with comprehensive media support"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Upload file with comprehensive validation"""
        if 'file' not in request.FILES:
            return Response({
                'error': 'No file provided',
                'supported_types': MediaHandler.get_supported_types()
            }, status=status.HTTP_400_BAD_REQUEST)
        
        message_id = request.POST.get('message_id') or request.data.get('message_id')
        if not message_id:
            return Response({
                'error': 'Message ID is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            message = Message.objects.get(id=message_id)
            if not message.conversation.is_participant(request.user):
                return Response({
                    'error': 'Permission denied'
                }, status=status.HTTP_403_FORBIDDEN)
        except Message.DoesNotExist:
            return Response({
                'error': 'Message not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        file = request.FILES['file']
        
        # Get MIME type
        mime_type = file.content_type or 'application/octet-stream'
        
        # Check if supported
        if not MediaHandler.is_supported(mime_type):
            return Response({
                'error': f'File type {mime_type} is not supported',
                'supported_types': MediaHandler.get_supported_types()
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get category and limits
        category = MediaHandler.get_category(mime_type)
        max_size = MediaHandler.DEFAULT_LIMITS.get(category, 10 * 1024 * 1024)
        
        # Check file size
        if file.size > max_size:
            max_mb = max_size / (1024 * 1024)
            return Response({
                'error': f'File size exceeds limit of {max_mb}MB for {category.value} files',
                'max_size_mb': max_mb,
                'file_size_mb': round(file.size / (1024 * 1024), 2)
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Validate magic number
            with tempfile.NamedTemporaryFile(delete=False) as tmp:
                for chunk in file.chunks():
                    tmp.write(chunk)
                tmp_path = tmp.name
            
            is_valid, error_msg = MediaHandler.validate_file(
                tmp_path, mime_type, file.size
            )
            
            if not is_valid:
                os.unlink(tmp_path)
                return Response({
                    'error': error_msg
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Get file info
            file_info = MediaHandler.get_file_info(tmp_path, mime_type)
            
            # Determine file type
            file_type = 'image' if category == MediaCategory.IMAGE else \
                       'video' if category == MediaCategory.VIDEO else \
                       'audio' if category == MediaCategory.AUDIO else \
                       'document' if category == MediaCategory.DOCUMENT else \
                       'other'
            
            # Create attachment
            attachment = Attachment.objects.create(
                message=message,
                file=file,
                file_name=file.name,
                file_type=file_type,
                file_size=file.size,
                mime_type=mime_type
            )
            
            # Log activity
            UserActivity.objects.create(
                user=request.user,
                action='file_uploaded',
                description=f'Uploaded {category.value}: {attachment.file_name}',
                ip_address=self.get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            
            # Clean up temp file
            os.unlink(tmp_path)
            
            serializer = AttachmentSerializer(attachment, context={'request': request})
            return Response({
                'attachment': serializer.data,
                'file_info': file_info
            }, status=status.HTTP_201_CREATED)
        
        except Exception as e:
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)
            return Response({
                'error': f'Upload failed: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class MediaInfoView(APIView):
    """Get information about supported media types"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get supported media types and limits"""
        return Response({
            'supported_types': MediaHandler.get_supported_types(),
            'limits': {
                category.value: limit / (1024 * 1024)
                for category, limit in MediaHandler.DEFAULT_LIMITS.items()
            },
            'categories': [cat.value for cat in MediaCategory],
            'total_supported_types': len([mt for mt in MediaType])
        })


class MediaValidationView(APIView):
    """Validate media files before upload"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Validate file without uploading"""
        if 'file' not in request.FILES:
            return Response({
                'error': 'No file provided'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        file = request.FILES['file']
        mime_type = file.content_type or 'application/octet-stream'
        
        # Check support
        is_supported = MediaHandler.is_supported(mime_type)
        
        if not is_supported:
            return Response({
                'valid': False,
                'error': f'File type {mime_type} is not supported',
                'supported_types': MediaHandler.get_supported_types()
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check size
        category = MediaHandler.get_category(mime_type)
        max_size = MediaHandler.DEFAULT_LIMITS.get(category, 10 * 1024 * 1024)
        
        if file.size > max_size:
            max_mb = max_size / (1024 * 1024)
            return Response({
                'valid': False,
                'error': f'File size exceeds limit of {max_mb}MB',
                'max_size_mb': max_mb,
                'file_size_mb': round(file.size / (1024 * 1024), 2)
            }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({
            'valid': True,
            'file_name': file.name,
            'file_size_mb': round(file.size / (1024 * 1024), 2),
            'mime_type': mime_type,
            'category': category.value,
            'icon': MediaHandler.get_category_icon(category)
        })


# Import MediaType for the view
from .media_handler import MediaType
