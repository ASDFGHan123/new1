"""
Trash management views.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from datetime import timedelta
from .trash_models import TrashItem
from users.models import User
from users.serializers import UserSerializer


class TrashViewSet(viewsets.ModelViewSet):
    """ViewSet for trash management."""
    
    queryset = TrashItem.objects.all()
    
    def get_permissions(self):
        """Allow any user."""
        from rest_framework.permissions import AllowAny
        return [AllowAny()]
    
    def get_serializer_class(self):
        from rest_framework import serializers
        
        class TrashItemSerializer(serializers.ModelSerializer):
            class Meta:
                model = TrashItem
                fields = ['id', 'item_type', 'item_id', 'item_data', 'deleted_by', 'deleted_at', 'expires_at']
        
        return TrashItemSerializer
    
    def list(self, request):
        """List all trash items."""
        import sys
        print(f'TRASH LIST CALLED - User: {request.user}, Auth: {request.auth}', file=sys.stderr)
        try:
            trash_items = TrashItem.objects.all().order_by('-deleted_at')
            serializer = self.get_serializer(trash_items, many=True)
            return Response(serializer.data)
        except Exception as e:
            print(f'TRASH ERROR: {str(e)}', file=sys.stderr)
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def restore(self, request):
        """Restore item from trash."""
        try:
            item_id = request.data.get('item_id')
            item_type = request.data.get('item_type')
            
            trash_item = TrashItem.objects.get(id=item_id)
            
            if item_type == 'user':
                # Recreate user from stored data
                user_data = trash_item.item_data
                User.objects.create_user(
                    username=user_data['username'],
                    email=user_data['email'],
                    password='',  # Password is not stored, user will need to reset
                    first_name=user_data.get('first_name', ''),
                    last_name=user_data.get('last_name', ''),
                    role=user_data.get('role', 'user'),
                    status=user_data.get('status', 'active'),
                    is_active=True,
                )
            
            trash_item.delete()
            return Response({'success': True, 'message': 'Item restored successfully'})
        except TrashItem.DoesNotExist:
            return Response({'error': 'Trash item not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def empty_trash(self, request):
        """Empty all trash items."""
        try:
            all_items = TrashItem.objects.all()
            count = all_items.count()
            all_items.delete()
            return Response({'success': True, 'message': f'Deleted {count} items'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def destroy(self, request, pk=None):
        """Permanently delete item from trash."""
        try:
            trash_item = TrashItem.objects.get(id=pk)
            trash_item.delete()
            return Response({'success': True, 'message': 'Item permanently deleted'})
        except TrashItem.DoesNotExist:
            return Response({'error': 'Trash item not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
