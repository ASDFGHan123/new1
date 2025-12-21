"""
Views for admin_panel app.
"""
from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from .models import AuditLog, SystemMessage, Trash, Backup
from .serializers import SystemMessageSerializer
from .views_settings import SystemSettingsListView, SystemSettingDetailView, SystemSettingUpdateView, SystemSettingsBulkUpdateView
from .services.audit_logging_service import AuditLoggingService
from users.views import IsAdminUser


class AuditLogListView(APIView):
    """Audit log list view."""
    permission_classes = [permissions.IsAdminUser]
    
    def get(self, request):
        from .models import AuditLog
        from .serializers import AuditLogSerializer
        
        logs = AuditLog.objects.all().order_by('-timestamp')[:100]
        serializer = AuditLogSerializer(logs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AuditLogDetailView(APIView):
    """Audit log detail view."""
    
    def get(self, request, log_id):
        return Response({'message': f'Audit log detail endpoint for {log_id} - to be implemented'}, status=status.HTTP_501_NOT_IMPLEMENTED)


class AuditLogExportView(APIView):
    """Audit log export view."""
    
    def post(self, request):
        return Response({'message': 'Audit log export endpoint - to be implemented'}, status=status.HTTP_501_NOT_IMPLEMENTED)


class SystemMessageListCreateView(APIView):
    """System message list and create view."""
    
    def get(self, request):
        """Get list of system messages."""
        from .models import SystemMessage
        from .serializers import SystemMessageSerializer
        
        messages = SystemMessage.objects.all().order_by('-created_at')
        serializer = SystemMessageSerializer(messages, many=True)
        return Response(serializer.data)
    
    def post(self, request):
        """Create a new system message."""
        from .models import SystemMessage
        from .serializers import SystemMessageCreateSerializer
        
        serializer = SystemMessageCreateSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            system_message = serializer.save()
            
            AuditLoggingService.log_admin_action(
                action_type=AuditLog.ActionType.SYSTEM_MESSAGE_SENT,
                description=f'System message created: {system_message.title}',
                admin_user=request.user,
                target_type=AuditLog.TargetType.SYSTEM,
                target_id=str(system_message.id),
                metadata={'message_type': system_message.message_type},
                category='system_message',
                request=request
            )
            
            return Response(SystemMessageSerializer(system_message).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SystemMessageDetailView(APIView):
    """System message detail view."""
    
    def get(self, request, message_id):
        """Get system message details."""
        from .models import SystemMessage
        from .serializers import SystemMessageSerializer
        import uuid
        
        try:
            system_message = SystemMessage.objects.get(id=message_id)
            serializer = SystemMessageSerializer(system_message)
            return Response(serializer.data)
        except SystemMessage.DoesNotExist:
            return Response({'error': 'System message not found'}, status=status.HTTP_404_NOT_FOUND)
        except (ValueError, uuid.UUIDError):
            return Response({'error': 'Invalid message ID'}, status=status.HTTP_400_BAD_REQUEST)
    
    def put(self, request, message_id):
        """Update a system message."""
        from .models import SystemMessage
        from .serializers import SystemMessageCreateSerializer
        import uuid
        
        try:
            system_message = SystemMessage.objects.get(id=message_id)
            
            if system_message.is_sent:
                return Response({'error': 'Cannot update sent system message'}, status=status.HTTP_400_BAD_REQUEST)
            
            serializer = SystemMessageCreateSerializer(system_message, data=request.data, context={'request': request})
            if serializer.is_valid():
                updated_message = serializer.save()
                
                AuditLoggingService.log_admin_action(
                    action_type=AuditLog.ActionType.SYSTEM_MESSAGE_SENT,
                    description=f'System message updated: {updated_message.title}',
                    admin_user=request.user,
                    target_type=AuditLog.TargetType.SYSTEM,
                    target_id=str(updated_message.id),
                    category='system_message',
                    request=request
                )
                
                return Response(SystemMessageSerializer(updated_message).data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except SystemMessage.DoesNotExist:
            return Response({'error': 'System message not found'}, status=status.HTTP_404_NOT_FOUND)
        except (ValueError, uuid.UUIDError):
            return Response({'error': 'Invalid message ID'}, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, message_id):
        """Delete a system message."""
        from .models import SystemMessage
        import uuid
        
        try:
            system_message = SystemMessage.objects.get(id=message_id)
            
            AuditLoggingService.log_admin_action(
                action_type=AuditLog.ActionType.SYSTEM_MESSAGE_SENT,
                description=f'System message deleted: {system_message.title}',
                admin_user=request.user,
                target_type=AuditLog.TargetType.SYSTEM,
                target_id=str(system_message.id),
                category='system_message',
                request=request
            )
            
            system_message.delete()
            return Response({'message': 'System message deleted successfully'}, status=status.HTTP_204_NO_CONTENT)
        except SystemMessage.DoesNotExist:
            return Response({'error': 'System message not found'}, status=status.HTTP_404_NOT_FOUND)
        except (ValueError, uuid.UUIDError):
            return Response({'error': 'Invalid message ID'}, status=status.HTTP_400_BAD_REQUEST)


class SystemMessageSendView(APIView):
    """System message send view."""
    
    def post(self, request, message_id):
        """Send/broadcast a system message to target users/groups."""
        from .models import SystemMessage
        from .serializers import SystemMessageSendSerializer
        from chat.models import Conversation, Group
        from django.contrib.auth import get_user_model
        import uuid
        
        User = get_user_model()
        
        try:
            system_message = SystemMessage.objects.get(id=message_id)
            
            if system_message.is_sent:
                return Response({'error': 'Message already sent'}, status=status.HTTP_400_BAD_REQUEST)
            
            serializer = SystemMessageSendSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            target_data = serializer.validated_data
            broadcast_count = 0
            
            if system_message.target_type == SystemMessage.TargetType.ALL_USERS:
                users = User.objects.filter(is_active=True)
                broadcast_count = users.count()
                    
            elif system_message.target_type == SystemMessage.TargetType.ACTIVE_USERS:
                from django.utils import timezone
                from datetime import timedelta
                
                active_cutoff = timezone.now() - timedelta(days=7)
                users = User.objects.filter(is_active=True, last_login__gte=active_cutoff)
                broadcast_count = users.count()
                
            elif system_message.target_type == SystemMessage.TargetType.GROUP:
                target_group_id = target_data.get('target_group_id')
                if target_group_id:
                    try:
                        group = Group.objects.get(id=target_group_id)
                        broadcast_count = group.members.filter(status='active').count()
                    except Group.DoesNotExist:
                        return Response({'error': 'Target group not found'}, status=status.HTTP_404_NOT_FOUND)
                        
            elif system_message.target_type == SystemMessage.TargetType.USER:
                target_user_id = target_data.get('target_user_id')
                if target_user_id:
                    try:
                        user = User.objects.get(id=target_user_id)
                        if not user.is_active:
                            return Response({'error': 'Target user is not active'}, status=status.HTTP_400_BAD_REQUEST)
                        broadcast_count = 1
                    except User.DoesNotExist:
                        return Response({'error': 'Target user not found'}, status=status.HTTP_404_NOT_FOUND)
            
            system_message.send()
            
            AuditLoggingService.log_admin_action(
                action_type=AuditLog.ActionType.SYSTEM_MESSAGE_SENT,
                description=f'System message broadcasted: {system_message.title}',
                admin_user=request.user,
                target_type=AuditLog.TargetType.SYSTEM,
                target_id=str(system_message.id),
                metadata={'broadcast_count': broadcast_count},
                category='system_message',
                request=request
            )
            
            return Response({
                'message': 'System message sent successfully',
                'broadcast_count': broadcast_count,
                'message_id': str(system_message.id)
            })
            
        except SystemMessage.DoesNotExist:
            return Response({'error': 'System message not found'}, status=status.HTTP_404_NOT_FOUND)
        except (ValueError, uuid.UUIDError):
            return Response({'error': 'Invalid message ID'}, status=status.HTTP_400_BAD_REQUEST)


class TrashListView(APIView):
    """Trash list view."""
    permission_classes = [permissions.IsAdminUser]
    
    def get(self, request):
        from .serializers import TrashSerializer
        
        items = Trash.objects.all().order_by('-deleted_at')
        serializer = TrashSerializer(items, many=True)
        return Response(serializer.data)


class TrashRestoreView(APIView):
    """Trash restore view."""
    permission_classes = [permissions.IsAdminUser]
    
    def post(self, request, item_id):
        try:
            trash_item = Trash.objects.get(id=item_id)
            
            AuditLoggingService.log_admin_action(
                action_type=AuditLog.ActionType.ITEM_RESTORED,
                description=f'Item restored from trash: {trash_item.item_type} {trash_item.item_id}',
                admin_user=request.user,
                target_type=AuditLog.TargetType.SYSTEM,
                target_id=str(trash_item.item_id),
                metadata={'item_type': trash_item.item_type},
                category='trash',
                request=request
            )
            
            trash_item.delete()
            return Response({'message': 'Item restored successfully'})
        except Trash.DoesNotExist:
            return Response({'error': 'Trash item not found'}, status=status.HTTP_404_NOT_FOUND)


class TrashPermanentDeleteView(APIView):
    """Trash permanent delete view."""
    permission_classes = [permissions.IsAdminUser]
    
    def post(self, request, item_id):
        try:
            trash_item = Trash.objects.get(id=item_id)
            
            AuditLoggingService.log_admin_action(
                action_type=AuditLog.ActionType.PERMANENT_DELETE,
                description=f'Item permanently deleted: {trash_item.item_type} {trash_item.item_id}',
                admin_user=request.user,
                target_type=AuditLog.TargetType.SYSTEM,
                target_id=str(trash_item.item_id),
                metadata={'item_type': trash_item.item_type},
                category='trash',
                request=request,
                severity=AuditLog.SeverityLevel.WARNING
            )
            
            trash_item.delete()
            return Response({'message': 'Item permanently deleted'})
        except Trash.DoesNotExist:
            return Response({'error': 'Trash item not found'}, status=status.HTTP_404_NOT_FOUND)


class BackupListCreateView(APIView):
    """Backup list and create view."""
    permission_classes = [permissions.IsAdminUser]
    
    def get(self, request):
        from .serializers import BackupSerializer
        
        backups = Backup.objects.all().order_by('-created_at')
        serializer = BackupSerializer(backups, many=True)
        return Response(serializer.data)
    
    def post(self, request):
        from .serializers import BackupCreateSerializer, BackupSerializer
        
        serializer = BackupCreateSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            backup = serializer.save()
            
            AuditLoggingService.log_admin_action(
                action_type=AuditLog.ActionType.BACKUP_CREATED,
                description=f'Backup created: {backup.name}',
                admin_user=request.user,
                target_type=AuditLog.TargetType.SYSTEM,
                target_id=str(backup.id),
                metadata={'backup_type': backup.backup_type},
                category='backup',
                request=request
            )
            
            return Response(BackupSerializer(backup).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class BackupDetailView(APIView):
    """Backup detail view."""
    permission_classes = [permissions.IsAdminUser]
    
    def get(self, request, backup_id):
        from .serializers import BackupSerializer
        import uuid
        
        try:
            backup = Backup.objects.get(id=backup_id)
            serializer = BackupSerializer(backup)
            return Response(serializer.data)
        except Backup.DoesNotExist:
            return Response({'error': 'Backup not found'}, status=status.HTTP_404_NOT_FOUND)
        except (ValueError, uuid.UUIDError):
            return Response({'error': 'Invalid backup ID'}, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, backup_id):
        import uuid
        
        try:
            backup = Backup.objects.get(id=backup_id)
            
            AuditLoggingService.log_admin_action(
                action_type=AuditLog.ActionType.BACKUP_CREATED,
                description=f'Backup deleted: {backup.name}',
                admin_user=request.user,
                target_type=AuditLog.TargetType.SYSTEM,
                target_id=str(backup.id),
                category='backup',
                request=request
            )
            
            backup.delete()
            return Response({'message': 'Backup deleted'}, status=status.HTTP_204_NO_CONTENT)
        except Backup.DoesNotExist:
            return Response({'error': 'Backup not found'}, status=status.HTTP_404_NOT_FOUND)
        except (ValueError, uuid.UUIDError):
            return Response({'error': 'Invalid backup ID'}, status=status.HTTP_400_BAD_REQUEST)


class BackupDownloadView(APIView):
    """Backup download view."""
    permission_classes = [permissions.IsAdminUser]
    
    def get(self, request, backup_id):
        import uuid
        
        try:
            backup = Backup.objects.get(id=backup_id)
            
            AuditLoggingService.log_admin_action(
                action_type=AuditLog.ActionType.DATA_EXPORTED,
                description=f'Backup downloaded: {backup.name}',
                admin_user=request.user,
                target_type=AuditLog.TargetType.SYSTEM,
                target_id=str(backup.id),
                category='backup',
                request=request
            )
            
            return Response({'message': 'Backup download initiated', 'backup_id': str(backup.id)})
        except Backup.DoesNotExist:
            return Response({'error': 'Backup not found'}, status=status.HTTP_404_NOT_FOUND)
        except (ValueError, uuid.UUIDError):
            return Response({'error': 'Invalid backup ID'}, status=status.HTTP_400_BAD_REQUEST)


class BackupRestoreView(APIView):
    """Backup restore view."""
    permission_classes = [permissions.IsAdminUser]
    
    def post(self, request, backup_id):
        import uuid
        
        try:
            backup = Backup.objects.get(id=backup_id)
            
            AuditLoggingService.log_admin_action(
                action_type=AuditLog.ActionType.BACKUP_RESTORED,
                description=f'Backup restored: {backup.name}',
                admin_user=request.user,
                target_type=AuditLog.TargetType.SYSTEM,
                target_id=str(backup.id),
                metadata={'backup_type': backup.backup_type},
                category='backup',
                request=request,
                severity=AuditLog.SeverityLevel.WARNING
            )
            
            return Response({'message': 'Backup restore initiated', 'backup_id': str(backup.id)})
        except Backup.DoesNotExist:
            return Response({'error': 'Backup not found'}, status=status.HTTP_404_NOT_FOUND)
        except (ValueError, uuid.UUIDError):
            return Response({'error': 'Invalid backup ID'}, status=status.HTTP_400_BAD_REQUEST)


class DashboardStatsView(APIView):
    """Dashboard stats view."""
    
    def get(self, request):
        """Get dashboard statistics."""
        from django.contrib.auth import get_user_model
        from chat.models import Conversation, Message
        from django.utils import timezone
        from datetime import timedelta
        
        User = get_user_model()
        
        total_users = User.objects.count()
        active_users = User.objects.filter(is_active=True).count()
        total_conversations = Conversation.objects.count()
        total_messages = Message.objects.count()
        
        yesterday = timezone.now() - timedelta(days=1)
        recent_users = User.objects.filter(join_date__gte=yesterday).count()
        recent_messages = Message.objects.filter(timestamp__gte=yesterday).count()
        
        stats = {
            'users': {
                'total': total_users,
                'active': active_users,
                'recent_registrations': recent_users
            },
            'conversations': {
                'total': total_conversations
            },
            'messages': {
                'total': total_messages,
                'recent': recent_messages
            },
            'generated_at': timezone.now()
        }
        
        return Response(stats)


class SystemMonitoringView(APIView):
    """System monitoring view."""
    
    def get(self, request):
        return Response({'message': 'System monitoring endpoint - to be implemented'}, status=status.HTTP_501_NOT_IMPLEMENTED)


class GeneralAnalyticsProxyView(APIView):
    """Proxy view for general analytics data."""
    
    def get(self, request):
        """Proxy request to analytics app GeneralAnalyticsView."""
        from analytics.views import GeneralAnalyticsView
        
        analytics_view = GeneralAnalyticsView()
        response = analytics_view.get(request)
        
        return response


class MessageTemplateListCreateView(APIView):
    """Message template list and create view."""
    
    def get(self, request):
        """Get list of message templates."""
        from .models import MessageTemplate
        from .serializers import MessageTemplateSerializer
        
        templates = MessageTemplate.objects.all().order_by('-created_at')
        serializer = MessageTemplateSerializer(templates, many=True)
        return Response(serializer.data)
    
    def post(self, request):
        """Create a new message template."""
        from .models import MessageTemplate
        from .serializers import MessageTemplateCreateSerializer, MessageTemplateSerializer
        
        serializer = MessageTemplateCreateSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            template = serializer.save()
            
            AuditLoggingService.log_admin_action(
                action_type=AuditLog.ActionType.SYSTEM_MESSAGE_SENT,
                description=f'Message template created: {template.name}',
                admin_user=request.user,
                target_type=AuditLog.TargetType.SYSTEM,
                target_id=str(template.id),
                category='message_template',
                request=request
            )
            
            return Response(MessageTemplateSerializer(template).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MessageTemplateDetailView(APIView):
    """Message template detail view."""
    
    def get(self, request, template_id):
        """Get message template details."""
        from .models import MessageTemplate
        from .serializers import MessageTemplateSerializer
        import uuid
        
        try:
            template = MessageTemplate.objects.get(id=template_id)
            serializer = MessageTemplateSerializer(template)
            return Response(serializer.data)
        except MessageTemplate.DoesNotExist:
            return Response({'error': 'Message template not found'}, status=status.HTTP_404_NOT_FOUND)
        except (ValueError, uuid.UUIDError):
            return Response({'error': 'Invalid template ID'}, status=status.HTTP_400_BAD_REQUEST)
    
    def put(self, request, template_id):
        """Update a message template."""
        from .models import MessageTemplate
        from .serializers import MessageTemplateUpdateSerializer
        import uuid
        
        try:
            template = MessageTemplate.objects.get(id=template_id)
            serializer = MessageTemplateUpdateSerializer(template, data=request.data, context={'request': request})
            if serializer.is_valid():
                updated_template = serializer.save()
                
                AuditLoggingService.log_admin_action(
                    action_type=AuditLog.ActionType.SYSTEM_MESSAGE_SENT,
                    description=f'Message template updated: {updated_template.name}',
                    admin_user=request.user,
                    target_type=AuditLog.TargetType.SYSTEM,
                    target_id=str(updated_template.id),
                    category='message_template',
                    request=request
                )
                
                return Response(MessageTemplateSerializer(updated_template).data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except MessageTemplate.DoesNotExist:
            return Response({'error': 'Message template not found'}, status=status.HTTP_404_NOT_FOUND)
        except (ValueError, uuid.UUIDError):
            return Response({'error': 'Invalid template ID'}, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, template_id):
        """Delete a message template."""
        from .models import MessageTemplate
        import uuid
        
        try:
            template = MessageTemplate.objects.get(id=template_id)
            
            AuditLoggingService.log_admin_action(
                action_type=AuditLog.ActionType.SYSTEM_MESSAGE_SENT,
                description=f'Message template deleted: {template.name}',
                admin_user=request.user,
                target_type=AuditLog.TargetType.SYSTEM,
                target_id=str(template.id),
                category='message_template',
                request=request
            )
            
            template.delete()
            return Response({'message': 'Message template deleted successfully'}, status=status.HTTP_204_NO_CONTENT)
        except MessageTemplate.DoesNotExist:
            return Response({'error': 'Message template not found'}, status=status.HTTP_404_NOT_FOUND)
        except (ValueError, uuid.UUIDError):
            return Response({'error': 'Invalid template ID'}, status=status.HTTP_400_BAD_REQUEST)


class MessageTemplateUseView(APIView):
    """Message template use view - for incrementing usage count."""
    
    def post(self, request, template_id):
        """Mark a template as used (increment usage count)."""
        from .models import MessageTemplate
        import uuid
        
        try:
            template = MessageTemplate.objects.get(id=template_id)
            template.increment_usage()
            return Response({'message': 'Template usage recorded', 'usage_count': template.usage_count})
        except MessageTemplate.DoesNotExist:
            return Response({'error': 'Message template not found'}, status=status.HTTP_404_NOT_FOUND)
        except (ValueError, uuid.UUIDError):
            return Response({'error': 'Invalid template ID'}, status=status.HTTP_400_BAD_REQUEST)


class CreateUserView(APIView):
    """Create a new user."""
    permission_classes = [permissions.IsAdminUser]
    
    def post(self, request):
        """Create a new user."""
        from django.contrib.auth import get_user_model
        from django.contrib.auth.hashers import make_password
        
        User = get_user_model()
        
        try:
            username = request.data.get('username')
            email = request.data.get('email')
            password = request.data.get('password')
            first_name = request.data.get('first_name', '')
            last_name = request.data.get('last_name', '')
            role = request.data.get('role', 'user')
            status_val = request.data.get('status', 'active')
            
            if not username or not email or not password:
                return Response(
                    {'error': 'username, email, and password are required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if User.objects.filter(username=username).exists():
                return Response(
                    {'error': 'Username already exists'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if User.objects.filter(email=email).exists():
                return Response(
                    {'error': 'Email already exists'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            user = User.objects.create(
                username=username,
                email=email,
                password=make_password(password),
                first_name=first_name,
                last_name=last_name,
                role=role,
                status=status_val,
                is_active=True,
                email_verified=True
            )
            
            AuditLoggingService.log_admin_action(
                action_type=AuditLog.ActionType.USER_CREATED,
                description=f'User created: {username}',
                admin_user=request.user,
                target_type=AuditLog.TargetType.USER,
                target_id=str(user.id),
                metadata={'username': username, 'email': email},
                category='user_management',
                request=request
            )
            
            return Response({
                'id': str(user.id),
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role,
                'status': user.status,
                'created_at': user.created_at.isoformat()
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error creating user: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to create user'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SystemSettingsBulkUpdateView(APIView):
    """Bulk update system settings."""
    
    def post(self, request):
        """Bulk update multiple settings."""
        from .models import SystemSettings
        from .serializers import SystemSettingSerializer
        
        settings_data = request.data.get('settings', [])
        if not isinstance(settings_data, list):
            return Response({'error': 'settings must be a list'}, status=status.HTTP_400_BAD_REQUEST)
        
        updated_settings = []
        errors = []
        
        for setting_data in settings_data:
            key = setting_data.get('key')
            value = setting_data.get('value')
            
            if not key or value is None:
                errors.append({'key': key, 'error': 'key and value are required'})
                continue
            
            try:
                setting = SystemSettings.objects.get(key=key)
                setting.value = str(value)
                setting.updated_by = request.user
                setting.save()
                updated_settings.append(SystemSettingSerializer(setting).data)
            except SystemSettings.DoesNotExist:
                errors.append({'key': key, 'error': 'Setting not found'})
        
        if updated_settings and request.user.is_authenticated:
            AuditLoggingService.log_admin_action(
                action_type=AuditLog.ActionType.SYSTEM_SETTINGS_CHANGED,
                description=f'Bulk updated {len(updated_settings)} system settings',
                admin_user=request.user,
                target_type=AuditLog.TargetType.SYSTEM,
                target_id='bulk_update',
                metadata={'count': len(updated_settings)},
                category='system_settings',
                request=request
            )
        
        return Response({
            'updated': updated_settings,
            'errors': errors
        }, status=status.HTTP_200_OK if not errors else status.HTTP_207_MULTI_STATUS)


class AdminConversationListView(APIView):
    """Admin view for all conversations."""
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        """Get all conversations for admin dashboard."""
        from chat.models import Conversation, Message
        from django.db.models import Count, Q
        
        conversations = Conversation.objects.filter(
            is_deleted=False
        ).annotate(
            message_count=Count('messages', filter=Q(messages__is_deleted=False))
        ).order_by('-last_message_at', '-created_at')
        
        result = []
        for conv in conversations:
            last_msg = conv.last_message
            
            if conv.conversation_type == 'group':
                title = conv.group.name if conv.group else 'Unknown Group'
                conv_type = 'group'
                participants = conv.group.member_count if conv.group else 0
            else:
                participants_list = list(conv.participants.values_list('username', flat=True))
                title = ' & '.join(participants_list) if participants_list else 'Unknown'
                conv_type = 'private'
                participants = len(participants_list)
            
            result.append({
                'id': str(conv.id),
                'type': conv_type,
                'title': title,
                'participants': participants,
                'lastMessage': last_msg.content if last_msg else 'No messages',
                'lastActivity': conv.last_message_at.isoformat() if conv.last_message_at else conv.created_at.isoformat(),
                'messageCount': conv.message_count,
                'isActive': bool(conv.last_message_at and (timezone.now() - conv.last_message_at).total_seconds() < 3600),
                'createdAt': conv.created_at.isoformat()
            })
        
        return Response(result, status=status.HTTP_200_OK)
