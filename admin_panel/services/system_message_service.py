"""
System message management service for OffChat application.
Provides comprehensive functionality for creating, managing, and broadcasting system messages.
"""
import logging
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db.models import Q
from django.core.paginator import Paginator

from admin_panel.models import SystemMessage, AuditLog
from admin_panel.services.audit_logging_service import AuditLoggingService

User = get_user_model()
logger = logging.getLogger(__name__)


class SystemMessageService:
    """
    Service for comprehensive system message management and broadcasting.
    """
    
    @classmethod
    def create_system_message(
        cls,
        title: str,
        content: str,
        message_type: str,
        target_type: str,
        admin_user,
        priority: int = 1,
        is_persistent: bool = False,
        expires_at: datetime = None,
        target_group_id: str = None,
        target_user_id: str = None
    ) -> SystemMessage:
        """
        Create a new system message.
        
        Args:
            title: Message title
            content: Message content
            message_type: Type of message (announcement, warning, etc.)
            target_type: Target audience (all_users, group, user, etc.)
            admin_user: Admin user creating the message
            priority: Message priority (1=Low, 2=Normal, 3=High)
            is_persistent: Whether message persists until dismissed
            expires_at: Optional expiration date
            target_group_id: ID of target group (if target_type is group)
            target_user_id: ID of target user (if target_type is user)
            
        Returns:
            Created SystemMessage instance
        """
        try:
            # Create the system message
            system_message = SystemMessage.objects.create(
                title=title,
                content=content,
                message_type=message_type,
                target_type=target_type,
                priority=priority,
                is_persistent=is_persistent,
                expires_at=expires_at,
                created_by=admin_user
            )
            
            # Set specific targets if applicable
            if target_group_id and target_type == SystemMessage.TargetType.GROUP:
                try:
                    system_message.target_group_id = target_group_id
                except Exception as e:
                    logger.warning(f"Invalid target group ID: {target_group_id}, error: {e}")
            
            if target_user_id and target_type == SystemMessage.TargetType.USER:
                try:
                    system_message.target_user_id = target_user_id
                except Exception as e:
                    logger.warning(f"Invalid target user ID: {target_user_id}, error: {e}")
            
            system_message.save()
            
            # Log the creation
            AuditLoggingService.log_admin_action(
                action_type=AuditLog.ActionType.SYSTEM_MESSAGE_SENT,
                description=f'System message created: {title}',
                admin_user=admin_user,
                target_type=AuditLog.TargetType.SYSTEM,
                target_id=str(system_message.id),
                metadata={
                    'message_type': message_type,
                    'target_type': target_type,
                    'priority': priority,
                },
                category='system_message'
            )
            
            logger.info(f"System message created: {system_message.id}")
            return system_message
            
        except Exception as e:
            logger.error(f"Error creating system message: {str(e)}")
            raise
    
    @classmethod
    def broadcast_message(
        cls,
        message_id: str,
        admin_user,
        custom_targets: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Broadcast a system message to its target audience.
        
        Args:
            message_id: ID of the system message to broadcast
            admin_user: Admin user performing the broadcast
            custom_targets: Optional custom targeting data
            
        Returns:
            Dict with broadcast result information
        """
        try:
            system_message = SystemMessage.objects.get(id=message_id)
            
            # Check if already sent
            if system_message.is_sent:
                return {
                    'success': False,
                    'error': 'Message already sent',
                    'message_id': message_id
                }
            
            # Calculate target audience
            target_info = cls._calculate_target_audience(system_message, custom_targets)
            broadcast_count = target_info['count']
            
            # Simulate broadcasting (in real implementation, this would create notifications)
            success = cls._execute_broadcast(system_message, target_info)
            
            if success:
                # Mark as sent
                system_message.send()
                
                # Log the broadcast
                AuditLoggingService.log_admin_action(
                    action_type=AuditLog.ActionType.SYSTEM_MESSAGE_SENT,
                    description=f'System message broadcasted: {system_message.title}',
                    admin_user=admin_user,
                    target_type=AuditLog.TargetType.SYSTEM,
                    target_id=str(system_message.id),
                    metadata={
                        'broadcast_count': broadcast_count,
                        'target_type': system_message.target_type,
                        'message_type': system_message.message_type,
                        'priority': system_message.priority,
                        'targets': target_info['details'],
                    },
                    category='system_message'
                )
                
                return {
                    'success': True,
                    'message_id': message_id,
                    'broadcast_count': broadcast_count,
                    'target_details': target_info['details']
                }
            else:
                return {
                    'success': False,
                    'error': 'Broadcast failed',
                    'message_id': message_id
                }
                
        except SystemMessage.DoesNotExist:
            return {
                'success': False,
                'error': 'System message not found',
                'message_id': message_id
            }
        except Exception as e:
            logger.error(f"Error broadcasting system message {message_id}: {str(e)}")
            return {
                'success': False,
                'error': f'Broadcast error: {str(e)}',
                'message_id': message_id
            }
    
    @classmethod
    def get_system_messages(cls, filters: Dict[str, Any]) -> Dict[str, Any]:
        """
        Get system messages with filtering and pagination.
        
        Args:
            filters: Filter parameters
            
        Returns:
            Dict with system messages and pagination info
        """
        try:
            queryset = SystemMessage.objects.select_related('created_by').all()
            
            # Apply filters
            message_type = filters.get('message_type')
            if message_type:
                queryset = queryset.filter(message_type=message_type)
            
            target_type = filters.get('target_type')
            if target_type:
                queryset = queryset.filter(target_type=target_type)
            
            is_sent = filters.get('is_sent')
            if is_sent is not None:
                queryset = queryset.filter(is_sent=is_sent)
            
            priority = filters.get('priority')
            if priority:
                queryset = queryset.filter(priority=priority)
            
            date_from = filters.get('date_from')
            date_to = filters.get('date_to')
            if date_from:
                queryset = queryset.filter(created_at__date__gte=date_from)
            if date_to:
                queryset = queryset.filter(created_at__date__lte=date_to)
            
            search = filters.get('search', '').strip()
            if search:
                queryset = queryset.filter(
                    Q(title__icontains=search) |
                    Q(content__icontains=search)
                )
            
            # Apply ordering
            ordering = filters.get('ordering', '-created_at')
            queryset = queryset.order_by(ordering)
            
            # Paginate
            page = int(filters.get('page', 1))
            per_page = int(filters.get('per_page', 20))
            paginator = Paginator(queryset, per_page)
            
            messages_page = paginator.get_page(page)
            
            # Serialize messages
            messages_data = []
            for message in messages_page:
                message_data = {
                    'id': str(message.id),
                    'title': message.title,
                    'content': message.content,
                    'message_type': message.message_type,
                    'target_type': message.target_type,
                    'priority': message.priority,
                    'is_persistent': message.is_persistent,
                    'is_sent': message.is_sent,
                    'sent_at': message.sent_at,
                    'expires_at': message.expires_at,
                    'created_by': {
                        'id': message.created_by.id,
                        'username': message.created_by.username,
                    },
                    'created_at': message.created_at,
                }
                messages_data.append(message_data)
            
            return {
                'messages': messages_data,
                'pagination': {
                    'page': messages_page.number,
                    'per_page': per_page,
                    'total_pages': paginator.num_pages,
                    'total_count': paginator.count,
                    'has_next': messages_page.has_next(),
                    'has_previous': messages_page.has_previous(),
                },
                'filters_applied': filters
            }
            
        except Exception as e:
            logger.error(f"Error getting system messages: {str(e)}")
            raise
    
    @classmethod
    def _calculate_target_audience(cls, system_message: SystemMessage, custom_targets: Dict[str, Any] = None) -> Dict[str, Any]:
        """Calculate the target audience for a system message."""
        target_type = system_message.target_type
        
        if target_type == SystemMessage.TargetType.ALL_USERS:
            users = User.objects.filter(is_active=True)
            return {
                'count': users.count(),
                'details': {'type': 'all_users', 'active_users': users.count()}
            }
            
        elif target_type == SystemMessage.TargetType.ACTIVE_USERS:
            active_cutoff = timezone.now() - timedelta(days=7)
            users = User.objects.filter(is_active=True, last_login__gte=active_cutoff)
            return {
                'count': users.count(),
                'details': {'type': 'active_users', 'recently_active': users.count()}
            }
            
        elif target_type == SystemMessage.TargetType.GROUP:
            if system_message.target_group:
                members = system_message.target_group.members.filter(status='active')
                return {
                    'count': members.count(),
                    'details': {
                        'type': 'group',
                        'group_id': str(system_message.target_group.id),
                        'group_name': system_message.target_group.name,
                        'members': members.count()
                    }
                }
            else:
                return {'count': 0, 'details': {'type': 'group', 'error': 'No target group specified'}}
                
        elif target_type == SystemMessage.TargetType.USER:
            if system_message.target_user and system_message.target_user.is_active:
                return {
                    'count': 1,
                    'details': {
                        'type': 'user',
                        'user_id': str(system_message.target_user.id),
                        'username': system_message.target_user.username
                    }
                }
            else:
                return {'count': 0, 'details': {'type': 'user', 'error': 'No active target user specified'}}
        
        return {'count': 0, 'details': {'type': 'unknown', 'error': 'Invalid target type'}}
    
    @classmethod
    def _execute_broadcast(cls, system_message: SystemMessage, target_info: Dict[str, Any]) -> bool:
        """
        Execute the actual broadcast of a system message.
        In a real implementation, this would create notifications, send emails, etc.
        """
        try:
            # Simulate successful broadcast
            logger.info(f"Broadcasting system message {system_message.id} to {target_info['count']} recipients")
            
            # In a real implementation, you would:
            # 1. Create notification records
            # 2. Send push notifications
            # 3. Send emails
            # 4. Update user interfaces
            
            return True
            
        except Exception as e:
            logger.error(f"Error executing broadcast for message {system_message.id}: {str(e)}")
            return False