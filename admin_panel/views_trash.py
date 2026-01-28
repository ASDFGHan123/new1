"""
Trash management views for handling soft-deleted items.
"""
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAdminUser
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from django.db.models import Prefetch
from django.db import IntegrityError
from admin_panel.models import Trash, AuditLog
from admin_panel.serializers import TrashSerializer
from admin_panel.services.audit_logging_service import AuditLoggingService
from users.models import User
from chat.models import Conversation, Message
from users.models_organization import Department, Office
import logging
import uuid

logger = logging.getLogger(__name__)

class TrashPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

class TrashListView(APIView):
    permission_classes = [IsAdminUser]
    pagination_class = TrashPagination
    
    def get(self, request):
        """Get all trashed items, optionally filtered by source tab."""
        try:
            # Get query parameters
            source_tab = request.query_params.get('source_tab')
            item_type = request.query_params.get('item_type')
            page = request.query_params.get('page', 1)
            
            # Start with all trash items - use select_related for deleted_by
            trash_items = Trash.objects.select_related('deleted_by').all()
            
            # Filter by source tab if provided
            if source_tab:
                trash_items = trash_items.filter(source_tab=source_tab)
            
            # Filter by item type if provided
            if item_type:
                trash_items = trash_items.filter(item_type=item_type)
            
            # Order by deletion date
            trash_items = trash_items.order_by('-deleted_at')
            
            # Apply pagination
            paginator = self.pagination_class()
            page_obj = paginator.paginate_queryset(trash_items, request)
            
            if page_obj is not None:
                serializer = TrashSerializer(page_obj, many=True)
                return paginator.get_paginated_response(serializer.data)
            
            # Fallback for no pagination
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
            restored = False
            item_name = "Unknown"
            
            if trash_item.item_type == Trash.ItemType.USER:
                try:
                    user = User.objects.get(id=trash_item.item_id)
                    user.activate_user()
                    restored = True
                    item_name = user.username
                except User.DoesNotExist:
                    logger.warning(f"User {trash_item.item_id} not found for restore")
            
            elif trash_item.item_type == Trash.ItemType.CONVERSATION:
                try:
                    conversation = Conversation.objects.get(id=trash_item.item_id)
                    conversation.is_deleted = False
                    conversation.save()
                    restored = True
                    item_name = conversation.title or f"Conversation {trash_item.item_id}"
                except Conversation.DoesNotExist:
                    logger.warning(f"Conversation {trash_item.item_id} not found for restore")
            
            elif trash_item.item_type == Trash.ItemType.MESSAGE:
                try:
                    message = Message.objects.get(id=trash_item.item_id)
                    message.is_deleted = False
                    message.save()
                    restored = True
                    item_name = f"Message {trash_item.item_id}"
                except Message.DoesNotExist:
                    logger.warning(f"Message {trash_item.item_id} not found for restore")
            
            elif trash_item.item_type == Trash.ItemType.DEPARTMENT:
                department_data = trash_item.item_data or {}
                name = department_data.get('name')
                if not name:
                    return Response({'error': 'Could not restore DEPARTMENT - missing name'}, status=status.HTTP_400_BAD_REQUEST)

                if Department.objects.filter(name=name).exists():
                    return Response({'error': f'Could not restore DEPARTMENT - a department named "{name}" already exists'}, status=status.HTTP_400_BAD_REQUEST)

                department_id = uuid.UUID(str(trash_item.item_id))
                if Department.objects.filter(id=department_id).exists():
                    return Response({'error': 'Could not restore DEPARTMENT - department already exists'}, status=status.HTTP_400_BAD_REQUEST)

                head_id = department_data.get('head_id')
                head_user = None
                if head_id:
                    head_user = User.objects.filter(id=head_id).first()

                try:
                    department = Department.objects.create(
                        id=department_id,
                        name=name,
                        manager=department_data.get('manager') or '',
                        code=department_data.get('code') or '',
                        description=department_data.get('description') or '',
                        head=head_user,
                    )
                except (ValueError, IntegrityError) as e:
                    return Response({'error': f'Could not restore DEPARTMENT - {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

                restored = True
                item_name = department.name
            
            elif trash_item.item_type == Trash.ItemType.OFFICE:
                office_data = trash_item.item_data or {}
                name = office_data.get('name')
                department_id = office_data.get('department_id')
                if not name or not department_id:
                    return Response({'error': 'Could not restore OFFICE - missing name or department_id'}, status=status.HTTP_400_BAD_REQUEST)

                department = Department.objects.filter(id=department_id).first()
                if not department:
                    return Response({'error': 'Could not restore OFFICE - department not found. Restore the department first.'}, status=status.HTTP_400_BAD_REQUEST)

                office_uuid = uuid.UUID(str(trash_item.item_id))
                if Office.objects.filter(id=office_uuid).exists():
                    return Response({'error': 'Could not restore OFFICE - office already exists'}, status=status.HTTP_400_BAD_REQUEST)

                if Office.objects.filter(department=department, name=name).exists():
                    return Response({'error': f'Could not restore OFFICE - an office named "{name}" already exists in this department'}, status=status.HTTP_400_BAD_REQUEST)

                try:
                    office = Office.objects.create(
                        id=office_uuid,
                        department=department,
                        name=name,
                        manager=office_data.get('manager') or '',
                        code=office_data.get('code') or '',
                        description=office_data.get('description') or '',
                    )
                except (ValueError, IntegrityError) as e:
                    return Response({'error': f'Could not restore OFFICE - {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

                restored = True
                item_name = office.name
            
            if not restored:
                return Response({
                    'error': f'Could not restore {trash_item.item_type} item - original item not found'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Log the restore action
            AuditLoggingService.log_admin_action(
                action_type=AuditLog.ActionType.ITEM_RESTORED,
                description=f'Restored {trash_item.item_type} from trash: {item_name}',
                admin_user=request.user,
                target_type=trash_item.item_type,
                target_id=trash_item.item_id,
                request=request
            )
            
            # Delete trash record
            trash_item.delete()
            
            return Response({'message': f'{trash_item.item_type} restored successfully'})
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
            item_name = "Unknown"
            
            # Get item name for logging before deletion
            if trash_item.item_data:
                item_name = (
                    trash_item.item_data.get('name') or 
                    trash_item.item_data.get('username') or 
                    trash_item.item_data.get('title') or 
                    f"{trash_item.item_type} {trash_item.item_id}"
                )
            
            # Permanently delete based on item type
            deleted = False
            
            if trash_item.item_type == Trash.ItemType.USER:
                deleted_count = User.objects.filter(id=trash_item.item_id).delete()[0]
                deleted = deleted_count > 0
            
            elif trash_item.item_type == Trash.ItemType.CONVERSATION:
                deleted_count = Conversation.objects.filter(id=trash_item.item_id).delete()[0]
                deleted = deleted_count > 0
            
            elif trash_item.item_type == Trash.ItemType.MESSAGE:
                deleted_count = Message.objects.filter(id=trash_item.item_id).delete()[0]
                deleted = deleted_count > 0
            
            elif trash_item.item_type == Trash.ItemType.DEPARTMENT:
                # Department might already be deleted, just ensure it's gone
                deleted_count = Department.objects.filter(id=trash_item.item_id).delete()[0]
                deleted = deleted_count > 0
            
            elif trash_item.item_type == Trash.ItemType.OFFICE:
                # Office might already be deleted, just ensure it's gone
                deleted_count = Office.objects.filter(id=trash_item.item_id).delete()[0]
                deleted = deleted_count > 0
            
            if not deleted:
                logger.warning(f"Original {trash_item.item_type} item {trash_item.item_id} was already deleted")
            
            # Log the permanent delete action
            AuditLoggingService.log_admin_action(
                action_type=AuditLog.ActionType.PERMANENT_DELETE,
                description=f'Permanently deleted {trash_item.item_type} from trash: {item_name}',
                admin_user=request.user,
                target_type=trash_item.item_type,
                target_id=trash_item.item_id,
                request=request
            )
            
            # Delete trash record
            trash_item.delete()
            
            return Response({'message': f'{trash_item.item_type} permanently deleted'})
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
                try:
                    # Permanently delete based on item type
                    if trash_item.item_type == Trash.ItemType.USER:
                        User.objects.filter(id=trash_item.item_id).delete()
                    elif trash_item.item_type == Trash.ItemType.CONVERSATION:
                        Conversation.objects.filter(id=trash_item.item_id).delete()
                    elif trash_item.item_type == Trash.ItemType.MESSAGE:
                        Message.objects.filter(id=trash_item.item_id).delete()
                    elif trash_item.item_type == Trash.ItemType.DEPARTMENT:
                        Department.objects.filter(id=trash_item.item_id).delete()
                    elif trash_item.item_type == Trash.ItemType.OFFICE:
                        Office.objects.filter(id=trash_item.item_id).delete()
                    
                    count += 1
                except Exception as e:
                    logger.error(f"Error deleting trash item {trash_item.id}: {str(e)}")
                    continue
            
            # Delete all old trash records
            old_trash.delete()
            
            return Response({'message': f'Deleted {count} old items from trash'})
        except Exception as e:
            logger.error(f"Error emptying trash: {str(e)}")
            return Response({'error': 'Failed to empty trash'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
