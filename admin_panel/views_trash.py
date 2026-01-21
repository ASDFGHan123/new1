"""
Trash management views for handling soft-deleted items.
"""
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAdminUser
from rest_framework import status
from admin_panel.models import Trash, AuditLog
from admin_panel.serializers import TrashSerializer
from admin_panel.services.audit_logging_service import AuditLoggingService
from users.models import User
from chat.models import Conversation, Message
import logging

logger = logging.getLogger(__name__)

class TrashListView(APIView):
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        """Get all trashed items."""
        try:
            trash_items = Trash.objects.all().order_by('-deleted_at')
            serializer = TrashSerializer(trash_items, many=True)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error fetching trash: {str(e)}")
            return Response({'error': 'Failed to fetch trash'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class TrashRestoreView(APIView):
    permission_classes = [IsAdminUser]
    
    def post(self, request, trash_id):
        """Restore a trashed item."""
        try:
            trash_item = Trash.objects.get(id=trash_id)
            
            # Restore based on item type
            if trash_item.item_type == 'USER':
                user = User.objects.get(id=trash_item.item_id)
                user.is_active = True
                user.save()
            elif trash_item.item_type == 'CONVERSATION':
                conversation = Conversation.objects.get(id=trash_item.item_id)
                conversation.is_deleted = False
                conversation.save()
            elif trash_item.item_type == 'MESSAGE':
                message = Message.objects.get(id=trash_item.item_id)
                message.is_deleted = False
                message.save()
            
            # Log the restore action
            AuditLoggingService.log_admin_action(
                action_type=AuditLog.ActionType.ITEM_RESTORED,
                description=f'Restored {trash_item.item_type} from trash',
                admin_user=request.user,
                target_type=trash_item.item_type,
                target_id=trash_item.item_id,
                request=request
            )
            
            # Delete trash record
            trash_item.delete()
            
            return Response({'message': 'Item restored successfully'})
        except Trash.DoesNotExist:
            return Response({'error': 'Trash item not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error restoring trash item: {str(e)}")
            return Response({'error': 'Failed to restore item'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class TrashPermanentDeleteView(APIView):
    permission_classes = [IsAdminUser]
    
    def delete(self, request, trash_id):
        """Permanently delete a trashed item."""
        try:
            trash_item = Trash.objects.get(id=trash_id)
            
            # Permanently delete based on item type
            if trash_item.item_type == 'USER':
                User.objects.filter(id=trash_item.item_id).delete()
            elif trash_item.item_type == 'CONVERSATION':
                Conversation.objects.filter(id=trash_item.item_id).delete()
            elif trash_item.item_type == 'MESSAGE':
                Message.objects.filter(id=trash_item.item_id).delete()
            
            # Log the permanent delete action
            AuditLoggingService.log_admin_action(
                action_type=AuditLog.ActionType.PERMANENT_DELETE,
                description=f'Permanently deleted {trash_item.item_type} from trash',
                admin_user=request.user,
                target_type=trash_item.item_type,
                target_id=trash_item.item_id,
                request=request
            )
            
            # Delete trash record
            trash_item.delete()
            
            return Response({'message': 'Item permanently deleted'})
        except Trash.DoesNotExist:
            return Response({'error': 'Trash item not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error permanently deleting trash item: {str(e)}")
            return Response({'error': 'Failed to delete item'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class TrashEmptyView(APIView):
    permission_classes = [IsAdminUser]
    
    def post(self, request):
        """Empty all trash (delete items older than 30 days)."""
        try:
            from datetime import timedelta
            from django.utils import timezone
            
            cutoff_date = timezone.now() - timedelta(days=30)
            old_trash = Trash.objects.filter(deleted_at__lt=cutoff_date)
            
            count = 0
            for trash_item in old_trash:
                if trash_item.item_type == 'USER':
                    User.objects.filter(id=trash_item.item_id).delete()
                elif trash_item.item_type == 'CONVERSATION':
                    Conversation.objects.filter(id=trash_item.item_id).delete()
                elif trash_item.item_type == 'MESSAGE':
                    Message.objects.filter(id=trash_item.item_id).delete()
                count += 1
            
            old_trash.delete()
            
            return Response({'message': f'Deleted {count} old items from trash'})
        except Exception as e:
            logger.error(f"Error emptying trash: {str(e)}")
            return Response({'error': 'Failed to empty trash'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
