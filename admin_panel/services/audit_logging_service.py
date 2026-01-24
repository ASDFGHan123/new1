"""
Comprehensive audit logging service for tracking all admin actions across the OffChat application.
"""
import logging
import json
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from django.contrib.auth import get_user_model
from django.db import models
from django.utils import timezone
from django.core.paginator import Paginator
from django.db.models import Q, Count, Avg

from admin_panel.models import AuditLog
from utils.json_utils import prepare_metadata

User = get_user_model()
logger = logging.getLogger(__name__)


class AuditLoggingService:
    """
    Service for comprehensive audit logging across all admin actions.
    """
    
    @classmethod
    def log_admin_action(
        cls,
        action_type: str,
        description: str,
        admin_user: "User" = None,
        target_type: str = None,
        target_id: str = None,
        severity: str = AuditLog.SeverityLevel.INFO,
        category: str = 'admin',
        request=None,
        metadata: Dict[str, Any] = None
    ) -> AuditLog:
        """
        Log an admin action with full context information.
        
        Args:
            action_type: Type of action performed
            description: Human-readable description
            admin_user: Admin user performing the action
            target_type: Type of resource being acted upon
            target_id: ID of the resource
            severity: Severity level of the action
            category: Category for organizing logs
            request: Django request object for IP/UA info
            metadata: Additional action-specific data
            
        Returns:
            Created AuditLog instance
        """
        try:
            # Extract request information if available
            ip_address = None
            user_agent = None
            session_id = None
            
            if request:
                ip_address = cls._get_client_ip(request)
                user_agent = request.META.get('HTTP_USER_AGENT', None)
                session_key = request.session.session_key
                if session_key:
                    session_id = session_key
            
            # Add request metadata
            if metadata is None:
                metadata = {}
            
            if request:
                metadata.update({
                    'request_method': request.method,
                    'request_path': request.path,
                    'request_content_type': request.META.get('CONTENT_TYPE', ''),
                    'timestamp': timezone.now().isoformat(),
                })
            
            # Create audit log entry
            audit_log = AuditLog.log_action(
                action_type=action_type,
                description=description,
                actor=admin_user,
                target_type=target_type,
                target_id=target_id,
                severity=severity,
                category=category,
                ip_address=ip_address,
                user_agent=user_agent,
                session_id=session_id,
                metadata=prepare_metadata(metadata)
            )
            
            logger.info(f"Audit log created: {action_type} by {admin_user}")
            return audit_log
            
        except Exception as e:
            logger.error(f"Error creating audit log: {str(e)}")
            # Don't raise exception to avoid breaking the main action
            return None
    
    @classmethod
    def log_user_management_action(
        cls,
        action: str,
        target_user: "User",
        admin_user: "User",
        request=None,
        reason: str = '',
        additional_data: Dict[str, Any] = None
    ) -> AuditLog:
        """
        Log user management actions specifically.
        
        Args:
            action: Action performed (approve, suspend, ban, etc.)
            target_user: User being managed
            admin_user: Admin performing the action
            request: Django request object
            reason: Reason for the action
            additional_data: Additional action data
            
        Returns:
            Created AuditLog instance
        """
        action_map = {
            'created': AuditLog.ActionType.USER_CREATED,
            'updated': AuditLog.ActionType.USER_UPDATED,
            'deleted': AuditLog.ActionType.USER_DELETED,
            'approved': AuditLog.ActionType.USER_APPROVED,
            'suspended': AuditLog.ActionType.USER_SUSPENDED,
            'banned': AuditLog.ActionType.USER_BANNED,
            'activated': AuditLog.ActionType.USER_ACTIVATED,
            'deactivated': AuditLog.ActionType.USER_DEACTIVATED,
            'role_changed': AuditLog.ActionType.ROLE_CHANGED,
        }
        
        action_type = action_map.get(action, AuditLog.ActionType.USER_UPDATED)
        
        metadata = {
            'target_username': target_user.username,
            'target_email': target_user.email,
            'action': action,
        }
        
        if reason:
            metadata['reason'] = reason
        
        if additional_data:
            metadata.update(additional_data)
        
        description = f"User {action}: {target_user.username}"
        if reason:
            description += f" (Reason: {reason})"
        
        return cls.log_admin_action(
            action_type=action_type,
            description=description,
            admin_user=admin_user,
            target_type=AuditLog.TargetType.USER,
            target_id=str(target_user.id),
            request=request,
            metadata=metadata,
            severity=cls._get_action_severity(action)
        )
    
    @classmethod
    def log_chat_action(
        cls,
        action: str,
        target_type: str,
        target_id: str,
        user: "User" = None,
        request=None,
        additional_data: Dict[str, Any] = None
    ) -> AuditLog:
        """
        Log chat-related actions.
        
        Args:
            action: Action performed
            target_type: Type of chat resource (conversation, message, group)
            target_id: ID of the resource
            user: User performing the action
            request: Django request object
            additional_data: Additional action data
            
        Returns:
            Created AuditLog instance
        """
        action_map = {
            'conversation_created': AuditLog.ActionType.CONVERSATION_CREATED,
            'conversation_updated': AuditLog.ActionType.CONVERSATION_UPDATED,
            'conversation_deleted': AuditLog.ActionType.CONVERSATION_DELETED,
            'message_sent': AuditLog.ActionType.MESSAGE_SENT,
            'message_edited': AuditLog.ActionType.MESSAGE_EDITED,
            'message_deleted': AuditLog.ActionType.MESSAGE_DELETED,
            'message_forwarded': AuditLog.ActionType.MESSAGE_FORWARDED,
            'group_created': AuditLog.ActionType.GROUP_CREATED,
            'group_updated': AuditLog.ActionType.GROUP_UPDATED,
            'group_deleted': AuditLog.ActionType.GROUP_DELETED,
            'group_joined': AuditLog.ActionType.GROUP_JOINED,
            'group_left': AuditLog.ActionType.GROUP_LEFT,
            'member_added': AuditLog.ActionType.MEMBER_ADDED,
            'member_removed': AuditLog.ActionType.MEMBER_REMOVED,
            'member_role_changed': AuditLog.ActionType.MEMBER_ROLE_CHANGED,
        }
        
        action_type = action_map.get(action, AuditLog.ActionType.CONVERSATION_UPDATED)
        
        metadata = {
            'target_type': target_type,
            'target_id': target_id,
            'action': action,
        }
        
        if additional_data:
            metadata.update(additional_data)
        
        description = f"{target_type} {action.replace('_', ' ')}: {target_id}"
        
        return cls.log_admin_action(
            action_type=action_type,
            description=description,
            admin_user=user,
            target_type=target_type.upper(),
            target_id=target_id,
            request=request,
            metadata=metadata,
            category='chat'
        )
    
    @classmethod
    def log_file_action(
        cls,
        action: str,
        file_path: str,
        user: "User" = None,
        request=None,
        file_size: int = None,
        additional_data: Dict[str, Any] = None
    ) -> AuditLog:
        """
        Log file-related actions.
        
        Args:
            action: Action performed (uploaded, deleted, downloaded)
            file_path: Path to the file
            user: User performing the action
            request: Django request object
            file_size: Size of the file in bytes
            additional_data: Additional action data
            
        Returns:
            Created AuditLog instance
        """
        action_map = {
            'uploaded': AuditLog.ActionType.FILE_UPLOADED,
            'deleted': AuditLog.ActionType.FILE_DELETED,
            'downloaded': AuditLog.ActionType.FILE_DOWNLOADED,
        }
        
        action_type = action_map.get(action, AuditLog.ActionType.FILE_UPLOADED)
        
        metadata = {
            'file_path': file_path,
            'action': action,
        }
        
        if file_size:
            metadata['file_size'] = file_size
            metadata['file_size_mb'] = round(file_size / (1024 * 1024), 2)
        
        if additional_data:
            metadata.update(additional_data)
        
        description = f"File {action}: {file_path}"
        
        return cls.log_admin_action(
            action_type=action_type,
            description=description,
            admin_user=user,
            target_type=AuditLog.TargetType.FILE,
            target_id=file_path,
            request=request,
            metadata=metadata,
            category='file'
        )
    
    @classmethod
    def log_system_action(
        cls,
        action: str,
        description: str,
        admin_user: "User" = None,
        request=None,
        metadata: Dict[str, Any] = None
    ) -> AuditLog:
        """
        Log system-level actions.
        
        Args:
            action: Action performed
            description: Human-readable description
            admin_user: Admin user performing the action
            request: Django request object
            metadata: Additional action data
            
        Returns:
            Created AuditLog instance
        """
        action_map = {
            'settings_changed': AuditLog.ActionType.SYSTEM_SETTINGS_CHANGED,
            'backup_created': AuditLog.ActionType.BACKUP_CREATED,
            'backup_restored': AuditLog.ActionType.BACKUP_RESTORED,
            'system_message_sent': AuditLog.ActionType.SYSTEM_MESSAGE_SENT,
            'data_exported': AuditLog.ActionType.DATA_EXPORTED,
            'report_generated': AuditLog.ActionType.REPORT_GENERATED,
        }
        
        action_type = action_map.get(action, AuditLog.ActionType.SYSTEM_SETTINGS_CHANGED)
        
        if metadata is None:
            metadata = {}
        
        metadata['action'] = action
        
        return cls.log_admin_action(
            action_type=action_type,
            description=description,
            admin_user=admin_user,
            target_type=AuditLog.TargetType.SYSTEM,
            request=request,
            metadata=metadata,
            category='system'
        )
    
    @classmethod
    def log_security_action(
        cls,
        action: str,
        description: str,
        user: "User" = None,
        ip_address: str = None,
        user_agent: str = None,
        severity: str = AuditLog.SeverityLevel.WARNING,
        metadata: Dict[str, Any] = None
    ) -> AuditLog:
        """
        Log security-related actions.
        
        Args:
            action: Action performed
            description: Human-readable description
            user: User involved (if any)
            ip_address: Source IP address
            user_agent: User agent string
            severity: Severity level
            metadata: Additional action data
            
        Returns:
            Created AuditLog instance
        """
        action_map = {
            'suspicious_activity': AuditLog.ActionType.SUSPICIOUS_ACTIVITY,
            'security_breach': AuditLog.ActionType.SECURITY_BREACH,
            'rate_limit_exceeded': AuditLog.ActionType.RATE_LIMIT_EXCEEDED,
            'failed_login': AuditLog.ActionType.USER_FAILED_LOGIN,
            'password_changed': AuditLog.ActionType.PASSWORD_CHANGED,
        }
        
        action_type = action_map.get(action, AuditLog.ActionType.SUSPICIOUS_ACTIVITY)
        
        if metadata is None:
            metadata = {}
        
        metadata['action'] = action
        
        return AuditLog.log_action(
            action_type=action_type,
            description=description,
            actor=user,
            target_type=AuditLog.TargetType.AUTH,
            severity=severity,
            category='security',
            ip_address=ip_address,
            user_agent=user_agent,
            metadata=prepare_metadata(metadata)
        )
    
    @classmethod
    def get_audit_logs(cls, filters: Dict[str, Any]) -> Dict[str, Any]:
        """
        Get filtered audit logs with pagination.
        
        Args:
            filters: Filter parameters
            
        Returns:
            Dict with audit logs and pagination info
        """
        try:
            queryset = AuditLog.objects.select_related('actor').all()
            
            # Apply filters
            action_type = filters.get('action_type')
            if action_type:
                queryset = queryset.filter(action_type=action_type)
            
            actor_id = filters.get('actor_id')
            if actor_id:
                queryset = queryset.filter(actor_id=actor_id)
            
            target_type = filters.get('target_type')
            if target_type:
                queryset = queryset.filter(target_type=target_type)
            
            severity = filters.get('severity')
            if severity:
                queryset = queryset.filter(severity=severity)
            
            category = filters.get('category')
            if category:
                queryset = queryset.filter(category=category)
            
            date_from = filters.get('date_from')
            date_to = filters.get('date_to')
            if date_from:
                queryset = queryset.filter(timestamp__date__gte=date_from)
            if date_to:
                queryset = queryset.filter(timestamp__date__lte=date_to)
            
            search = filters.get('search', '').strip()
            if search:
                queryset = queryset.filter(
                    Q(description__icontains=search) |
                    Q(metadata__icontains=search)
                )
            
            # Apply ordering
            ordering = filters.get('ordering', '-timestamp')
            queryset = queryset.order_by(ordering)
            
            # Paginate
            page = int(filters.get('page', 1))
            per_page = int(filters.get('per_page', 50))
            paginator = Paginator(queryset, per_page)
            
            logs_page = paginator.get_page(page)
            
            # Serialize logs
            logs_data = []
            for log in logs_page:
                log_data = {
                    'id': str(log.id),
                    'action_type': log.action_type,
                    'description': log.description,
                    'actor': log.actor.username if log.actor else 'System',
                    'target_type': log.target_type,
                    'target_id': log.target_id,
                    'severity': log.severity,
                    'category': log.category,
                    'ip_address': log.ip_address,
                    'timestamp': log.timestamp,
                    'metadata': log.metadata,
                }
                logs_data.append(log_data)
            
            return {
                'logs': logs_data,
                'pagination': {
                    'page': logs_page.number,
                    'per_page': per_page,
                    'total_pages': paginator.num_pages,
                    'total_count': paginator.count,
                    'has_next': logs_page.has_next(),
                    'has_previous': logs_page.has_previous(),
                },
                'filters_applied': filters
            }
            
        except Exception as e:
            logger.error(f"Error getting audit logs: {str(e)}")
            raise
    
    @classmethod
    def get_audit_statistics(cls, date_range: int = 30) -> Dict[str, Any]:
        """
        Get audit log statistics for a given date range.
        
        Args:
            date_range: Number of days to include in statistics
            
        Returns:
            Dict with audit statistics
        """
        try:
            end_date = timezone.now()
            start_date = end_date - timedelta(days=date_range)
            
            # Base queryset for the date range
            queryset = AuditLog.objects.filter(timestamp__gte=start_date, timestamp__lte=end_date)
            
            # Action type statistics
            action_stats = dict(
                queryset.values('action_type').annotate(count=Count('id')).values_list('action_type', 'count')
            )
            
            # Severity statistics
            severity_stats = dict(
                queryset.values('severity').annotate(count=Count('id')).values_list('severity', 'count')
            )
            
            # Category statistics
            category_stats = dict(
                queryset.values('category').annotate(count=Count('id')).values_list('category', 'count')
            )
            
            # Top actors
            top_actors = list(
                queryset.values('actor__username').annotate(count=Count('id'))
                .order_by('-count')[:10]
                .values('actor__username', 'count')
            )
            
            # Daily activity (last 7 days)
            daily_activity = []
            for i in range(7):
                day_start = end_date - timedelta(days=i+1)
                day_end = end_date - timedelta(days=i)
                day_count = queryset.filter(timestamp__gte=day_start, timestamp__lt=day_end).count()
                daily_activity.append({
                    'date': day_start.date().isoformat(),
                    'count': day_count
                })
            daily_activity.reverse()
            
            return {
                'total_logs': queryset.count(),
                'action_stats': action_stats,
                'severity_stats': severity_stats,
                'category_stats': category_stats,
                'top_actors': top_actors,
                'daily_activity': daily_activity,
                'date_range': date_range,
                'generated_at': timezone.now().isoformat(),
            }
            
        except Exception as e:
            logger.error(f"Error getting audit statistics: {str(e)}")
            raise
    
    @classmethod
    def export_audit_logs(cls, filters: Dict[str, Any], format: str = 'json') -> Dict[str, Any]:
        """
        Export audit logs based on filters.
        
        Args:
            filters: Filter parameters
            format: Export format ('json', 'csv')
            
        Returns:
            Dict with export information
        """
        try:
            # Get filtered logs
            result = cls.get_audit_logs(filters)
            logs = result['logs']
            
            if format.lower() == 'json':
                export_data = {
                    'export_info': {
                        'format': 'json',
                        'total_records': len(logs),
                        'exported_at': timezone.now().isoformat(),
                        'filters_applied': filters
                    },
                    'data': logs
                }
                return export_data
            
            elif format.lower() == 'csv':
                # For CSV export, we'd need to implement CSV formatting
                # This is a simplified version
                csv_data = []
                for log in logs:
                    csv_data.append({
                        'id': log['id'],
                        'timestamp': log['timestamp'],
                        'action_type': log['action_type'],
                        'description': log['description'],
                        'actor': log['actor'],
                        'severity': log['severity'],
                        'ip_address': log['ip_address'],
                    })
                
                return {
                    'format': 'csv',
                    'data': csv_data,
                    'total_records': len(csv_data),
                    'exported_at': timezone.now().isoformat(),
                    'filters_applied': filters
                }
            
            else:
                raise ValueError(f"Unsupported export format: {format}")
                
        except Exception as e:
            logger.error(f"Error exporting audit logs: {str(e)}")
            raise
    
    @classmethod
    def _get_client_ip(cls, request) -> Optional[str]:
        """Extract client IP address from request."""
        try:
            # Check for X-Forwarded-For header first (for proxy/load balancer)
            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
            if x_forwarded_for:
                # Get the first IP from the comma-separated list
                ip = x_forwarded_for.split(',')[0].strip()
                return ip
            
            # Fall back to REMOTE_ADDR
            remote_addr = request.META.get('REMOTE_ADDR')
            return remote_addr
            
        except Exception as e:
            logger.error(f"Error extracting client IP: {str(e)}")
            return None
    
    @classmethod
    def _get_action_severity(cls, action: str) -> str:
        """Determine severity level based on action type."""
        high_severity_actions = ['banned', 'suspended', 'deleted']
        medium_severity_actions = ['deactivated', 'role_changed']
        
        if action in high_severity_actions:
            return AuditLog.SeverityLevel.WARNING
        elif action in medium_severity_actions:
            return AuditLog.SeverityLevel.INFO
        else:
            return AuditLog.SeverityLevel.LOW


# Middleware for automatic request logging
class AuditLoggingMiddleware:
    """
    Middleware to automatically log certain types of requests.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Log suspicious requests or admin actions
        response = self.get_response(request)
        
        # Only log for admin panel endpoints and certain conditions
        if request.path.startswith('/api/admin/') or request.path.startswith('/management/'):
            # Log the admin action
            try:
                if hasattr(request, 'user') and request.user.is_authenticated:
                    AuditLoggingService.log_admin_action(
                        action_type=AuditLog.ActionType.SYSTEM_SETTINGS_CHANGED,
                        description=f"Admin API access: {request.method} {request.path}",
                        admin_user=request.user,
                        request=request,
                        metadata={
                            'request_status_code': response.status_code,
                            'response_time': getattr(response, 'response_time', None),
                        },
                        category='admin_api'
                    )
            except Exception as e:
                logger.error(f"Error logging admin API access: {str(e)}")
        
        return response
