from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models_notification import Notification
from .notification_serializers import NotificationSerializer


class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')
    
    def destroy(self, request, pk=None):
        """Delete a notification."""
        try:
            notification = self.get_object()
            notification.delete()
            return Response({'status': 'notification deleted'}, status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def delete_all(self, request):
        """Delete all notifications for the user."""
        try:
            self.get_queryset().delete()
            return Response({'status': 'all notifications deleted'}, status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def unread(self, request):
        try:
            unread = self.get_queryset().filter(is_read=False)
            serializer = self.get_serializer(unread, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        try:
            count = self.get_queryset().filter(is_read=False).count()
            return Response({'unread_count': count})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        try:
            notification = self.get_object()
            notification.mark_as_read()
            return Response({'status': 'marked as read'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        try:
            self.get_queryset().filter(is_read=False).update(is_read=True)
            return Response({'status': 'all marked as read'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def by_type(self, request):
        """Filter notifications by type."""
        try:
            notification_type = request.query_params.get('type')
            if not notification_type:
                return Response(
                    {'error': 'type parameter is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            notifications = self.get_queryset().filter(notification_type=notification_type)
            serializer = self.get_serializer(notifications, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
