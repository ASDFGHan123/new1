"""
Enhanced video upload view for chat app.
"""
from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
import logging
from .models import Message, Attachment
from .serializers import AttachmentSerializer
from users.models import UserActivity

logger = logging.getLogger(__name__)


class VideoUploadView(APIView):
    """Enhanced video upload view with metadata extraction."""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        if 'file' not in request.FILES:
            return Response({
                'file': ['No file provided']
            }, status=status.HTTP_400_BAD_REQUEST)
        
        message_id = request.POST.get('message_id') or request.data.get('message_id')
        if not message_id:
            return Response({
                'file': ['Message ID is required']
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            message = Message.objects.get(id=message_id)
            if not message.conversation.is_participant(request.user):
                return Response({
                    'file': ['Permission denied']
                }, status=status.HTTP_403_FORBIDDEN)
        except Message.DoesNotExist:
            return Response({
                'file': ['Message not found']
            }, status=status.HTTP_404_NOT_FOUND)
        
        file = request.FILES['file']
        
        # Video size limit: 100MB
        if file.size > 100 * 1024 * 1024:
            return Response({
                'file': ['Video file size cannot exceed 100MB']
            }, status=status.HTTP_400_BAD_REQUEST)
        
        video_types = [
            'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime',
            'video/x-msvideo', 'video/x-matroska'
        ]
        
        if file.content_type not in video_types:
            return Response({
                'file': ['File type must be a video format (mp4, webm, ogg, mov, avi, mkv)']
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create attachment
        attachment = Attachment.objects.create(
            message_id=message_id,
            file=file,
            file_name=file.name,
            file_type='video',
            file_size=file.size,
            mime_type=file.content_type
        )
        
        # Process video metadata asynchronously
        try:
            from .services.video_service import VideoProcessingService
            VideoProcessingService.process_video_attachment(attachment)
        except Exception as e:
            logger.warning(f"Video processing failed: {str(e)}")
        
        # Log activity
        UserActivity.objects.create(
            user=request.user,
            action='file_uploaded',
            description=f'Uploaded video {attachment.file_name}',
            ip_address=self.get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        
        serializer = AttachmentSerializer(attachment, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class VideoDownloadView(APIView):
    """Video download view with streaming support."""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, attachment_id):
        try:
            attachment = Attachment.objects.get(id=attachment_id)
            
            if attachment.file_type != 'video':
                return Response({
                    'error': 'Attachment is not a video'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if not attachment.message.conversation.is_participant(request.user):
                return Response({
                    'error': 'Permission denied'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Log download activity
            UserActivity.objects.create(
                user=request.user,
                action='file_downloaded',
                description=f'Downloaded video {attachment.file_name}',
                ip_address=self.get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            
            serializer = AttachmentSerializer(attachment, context={'request': request})
            return Response(serializer.data)
        
        except Attachment.DoesNotExist:
            return Response({
                'error': 'Video not found'
            }, status=status.HTTP_404_NOT_FOUND)
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
