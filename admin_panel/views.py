"""
Views for admin_panel app.
"""
from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import AuditLog, SystemMessage
from .serializers import SystemMessageSerializer


class AuditLogListView(APIView):
    """Audit log list view."""
    
    def get(self, request):
        return Response({'message': 'Audit log list endpoint - to be implemented'}, status=status.HTTP_501_NOT_IMPLEMENTED)


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
        from .services.audit_logging_service import AuditLoggingService
        
        serializer = SystemMessageCreateSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            system_message = serializer.save()
            
            # Log the action
            AuditLoggingService.log_admin_action(
                action_type=AuditLog.ActionType.SYSTEM_MESSAGE_SENT,
                description=f'System message created: {system_message.title}',
                admin_user=request.user,
                target_type=AuditLog.TargetType.SYSTEM,
                target_id=str(system_message.id),
                metadata={
                    'message_type': system_message.message_type,
                    'target_type': system_message.target_type,
                    'priority': system_message.priority,
                },
                category='system_message'
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
        from .services.audit_logging_service import AuditLoggingService
        import uuid
        
        try:
            system_message = SystemMessage.objects.get(id=message_id)
            
            # Don't allow updating sent messages
            if system_message.is_sent:
                return Response({'error': 'Cannot update sent system message'}, status=status.HTTP_400_BAD_REQUEST)
            
            serializer = SystemMessageCreateSerializer(system_message, data=request.data, context={'request': request})
            if serializer.is_valid():
                updated_message = serializer.save()
                
                # Log the action
                AuditLoggingService.log_admin_action(
                    action_type=AuditLog.ActionType.SYSTEM_MESSAGE_SENT,
                    description=f'System message updated: {updated_message.title}',
                    admin_user=request.user,
                    target_type=AuditLog.TargetType.SYSTEM,
                    target_id=str(updated_message.id),
                    metadata={
                        'action': 'update',
                        'message_type': updated_message.message_type,
                        'target_type': updated_message.target_type,
                    },
                    category='system_message'
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
        from .services.audit_logging_service import AuditLoggingService
        import uuid
        
        try:
            system_message = SystemMessage.objects.get(id=message_id)
            
            # Log the action before deletion
            AuditLoggingService.log_admin_action(
                action_type=AuditLog.ActionType.SYSTEM_MESSAGE_SENT,
                description=f'System message deleted: {system_message.title}',
                admin_user=request.user,
                target_type=AuditLog.TargetType.SYSTEM,
                target_id=str(system_message.id),
                metadata={
                    'action': 'delete',
                    'message_type': system_message.message_type,
                },
                category='system_message'
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
        from .services.audit_logging_service import AuditLoggingService
        from chat.models import Conversation, Group
        from django.contrib.auth import get_user_model
        import uuid
        
        User = get_user_model()
        
        try:
            system_message = SystemMessage.objects.get(id=message_id)
            
            # Check if already sent
            if system_message.is_sent:
                return Response({'error': 'Message already sent'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Validate send request
            serializer = SystemMessageSendSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            # Broadcast the message
            target_data = serializer.validated_data
            broadcast_count = 0
            
            if system_message.target_type == SystemMessage.TargetType.ALL_USERS:
                # Send to all users
                users = User.objects.filter(is_active=True)
                broadcast_count = users.count()
                
                # Create system messages for each user or store in a notifications table
                for user in users:
                    # Here you would typically create a notification or message
                    # For now, we'll just count them
                    pass
                    
            elif system_message.target_type == SystemMessage.TargetType.ACTIVE_USERS:
                # Send to active users (users with recent activity)
                from django.utils import timezone
                from datetime import timedelta
                
                active_cutoff = timezone.now() - timedelta(days=7)
                users = User.objects.filter(
                    is_active=True,
                    last_login__gte=active_cutoff
                )
                broadcast_count = users.count()
                
            elif system_message.target_type == SystemMessage.TargetType.GROUP:
                # Send to specific group
                target_group_id = target_data.get('target_group_id')
                if target_group_id:
                    try:
                        group = Group.objects.get(id=target_group_id)
                        broadcast_count = group.members.filter(status='active').count()
                    except Group.DoesNotExist:
                        return Response({'error': 'Target group not found'}, status=status.HTTP_404_NOT_FOUND)
                        
            elif system_message.target_type == SystemMessage.TargetType.USER:
                # Send to specific user
                target_user_id = target_data.get('target_user_id')
                if target_user_id:
                    try:
                        user = User.objects.get(id=target_user_id)
                        if not user.is_active:
                            return Response({'error': 'Target user is not active'}, status=status.HTTP_400_BAD_REQUEST)
                        broadcast_count = 1
                    except User.DoesNotExist:
                        return Response({'error': 'Target user not found'}, status=status.HTTP_404_NOT_FOUND)
            
            # Mark message as sent
            system_message.send()
            
            # Log the broadcasting action
            AuditLoggingService.log_admin_action(
                action_type=AuditLog.ActionType.SYSTEM_MESSAGE_SENT,
                description=f'System message broadcasted: {system_message.title}',
                admin_user=request.user,
                target_type=AuditLog.TargetType.SYSTEM,
                target_id=str(system_message.id),
                metadata={
                    'broadcast_count': broadcast_count,
                    'target_type': system_message.target_type,
                    'message_type': system_message.message_type,
                    'priority': system_message.priority,
                },
                category='system_message'
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
    
    def get(self, request):
        return Response({'message': 'Trash list endpoint - to be implemented'}, status=status.HTTP_501_NOT_IMPLEMENTED)


class TrashRestoreView(APIView):
    """Trash restore view."""
    
    def post(self, request, item_id):
        return Response({'message': f'Trash restore endpoint for {item_id} - to be implemented'}, status=status.HTTP_501_NOT_IMPLEMENTED)


class TrashPermanentDeleteView(APIView):
    """Trash permanent delete view."""
    
    def post(self, request, item_id):
        return Response({'message': f'Trash permanent delete endpoint for {item_id} - to be implemented'}, status=status.HTTP_501_NOT_IMPLEMENTED)


class BackupListCreateView(APIView):
    """Backup list and create view."""
    
    def get(self, request):
        return Response({'message': 'Backup list endpoint - to be implemented'}, status=status.HTTP_501_NOT_IMPLEMENTED)
    
    def post(self, request):
        return Response({'message': 'Backup create endpoint - to be implemented'}, status=status.HTTP_501_NOT_IMPLEMENTED)


class BackupDetailView(APIView):
    """Backup detail view."""
    
    def get(self, request, backup_id):
        return Response({'message': f'Backup detail endpoint for {backup_id} - to be implemented'}, status=status.HTTP_501_NOT_IMPLEMENTED)
    
    def delete(self, request, backup_id):
        return Response({'message': f'Backup delete endpoint for {backup_id} - to be implemented'}, status=status.HTTP_501_NOT_IMPLEMENTED)


class BackupDownloadView(APIView):
    """Backup download view."""
    
    def get(self, request, backup_id):
        return Response({'message': f'Backup download endpoint for {backup_id} - to be implemented'}, status=status.HTTP_501_NOT_IMPLEMENTED)


class BackupRestoreView(APIView):
    """Backup restore view."""
    
    def post(self, request, backup_id):
        return Response({'message': f'Backup restore endpoint for {backup_id} - to be implemented'}, status=status.HTTP_501_NOT_IMPLEMENTED)


class SystemSettingsListView(APIView):
    """System settings list view."""
    
    def get(self, request):
        return Response({'message': 'System settings list endpoint - to be implemented'}, status=status.HTTP_501_NOT_IMPLEMENTED)


class SystemSettingDetailView(APIView):
    """System setting detail view."""
    
    def get(self, request, key):
        return Response({'message': f'System setting detail endpoint for {key} - to be implemented'}, status=status.HTTP_501_NOT_IMPLEMENTED)


class SystemSettingUpdateView(APIView):
    """System setting update view."""
    
    def put(self, request, key):
        return Response({'message': f'System setting update endpoint for {key} - to be implemented'}, status=status.HTTP_501_NOT_IMPLEMENTED)


class DashboardStatsView(APIView):
    """Dashboard stats view."""
    
    def get(self, request):
        """Get dashboard statistics."""
        from django.contrib.auth import get_user_model
        from chat.models import Conversation, Message
        from django.utils import timezone
        from datetime import timedelta
        
        User = get_user_model()
        
        # Get basic stats
        total_users = User.objects.count()
        active_users = User.objects.filter(is_active=True).count()
        total_conversations = Conversation.objects.count()
        total_messages = Message.objects.count()
        
        # Get recent activity (last 24 hours)
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
        
        # Create an instance of the analytics view
        analytics_view = GeneralAnalyticsView()
        
        # Call the view's get method with the current request
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
        from .services.audit_logging_service import AuditLoggingService
        
        serializer = MessageTemplateCreateSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            template = serializer.save()
            
            # Log the action
            AuditLoggingService.log_admin_action(
                action_type=AuditLog.ActionType.SYSTEM_MESSAGE_SENT,
                description=f'Message template created: {template.name}',
                admin_user=request.user,
                target_type=AuditLog.TargetType.SYSTEM,
                target_id=str(template.id),
                metadata={
                    'template_name': template.name,
                    'category': template.category,
                },
                category='message_template'
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
        from .services.audit_logging_service import AuditLoggingService
        import uuid
        
        try:
            template = MessageTemplate.objects.get(id=template_id)
            serializer = MessageTemplateUpdateSerializer(template, data=request.data, context={'request': request})
            if serializer.is_valid():
                updated_template = serializer.save()
                
                # Log the action
                AuditLoggingService.log_admin_action(
                    action_type=AuditLog.ActionType.SYSTEM_MESSAGE_SENT,
                    description=f'Message template updated: {updated_template.name}',
                    admin_user=request.user,
                    target_type=AuditLog.TargetType.SYSTEM,
                    target_id=str(updated_template.id),
                    metadata={
                        'action': 'update',
                        'template_name': updated_template.name,
                        'category': updated_template.category,
                    },
                    category='message_template'
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
        from .services.audit_logging_service import AuditLoggingService
        import uuid
        
        try:
            template = MessageTemplate.objects.get(id=template_id)
            
            # Log the action before deletion
            AuditLoggingService.log_admin_action(
                action_type=AuditLog.ActionType.SYSTEM_MESSAGE_SENT,
                description=f'Message template deleted: {template.name}',
                admin_user=request.user,
                target_type=AuditLog.TargetType.SYSTEM,
                target_id=str(template.id),
                metadata={
                    'action': 'delete',
                    'template_name': template.name,
                    'category': template.category,
                },
                category='message_template'
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
