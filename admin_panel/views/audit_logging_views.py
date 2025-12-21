"""
Audit logging API views for admin panel.
"""
import logging
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.core.exceptions import ValidationError

from admin_panel.services.audit_logging_service import AuditLoggingService
from users.views import IsAdminUser

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def audit_logs_list_view(request):
    """
    Get paginated list of audit logs with filtering options.
    """
    try:
        # Get query parameters
        filters = {
            'page': request.GET.get('page', 1),
            'per_page': request.GET.get('per_page', 50),
            'action_type': request.GET.get('action_type', ''),
            'actor_id': request.GET.get('actor_id', ''),
            'target_type': request.GET.get('target_type', ''),
            'severity': request.GET.get('severity', ''),
            'category': request.GET.get('category', ''),
            'date_from': request.GET.get('date_from', ''),
            'date_to': request.GET.get('date_to', ''),
            'search': request.GET.get('search', ''),
            'ordering': request.GET.get('ordering', '-timestamp'),
        }
        
        result = AuditLoggingService.get_audit_logs(filters)
        return Response(result, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error getting audit logs: {str(e)}")
        return Response(
            {'error': 'Failed to retrieve audit logs'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAdminUser])
def audit_log_detail_view(request, log_id):
    """
    Get detailed audit log information.
    """
    try:
        from admin_panel.models import AuditLog
        
        audit_log = AuditLog.objects.get(id=log_id)
        log_data = {
            'id': str(audit_log.id),
            'action_type': audit_log.action_type,
            'description': audit_log.description,
            'actor': {
                'id': audit_log.actor.id if audit_log.actor else None,
                'username': audit_log.actor.username if audit_log.actor else 'System',
                'email': audit_log.actor.email if audit_log.actor else None,
            } if audit_log.actor else {'id': None, 'username': 'System', 'email': None},
            'target_type': audit_log.target_type,
            'target_id': audit_log.target_id,
            'severity': audit_log.severity,
            'category': audit_log.category,
            'ip_address': audit_log.ip_address,
            'user_agent': audit_log.user_agent,
            'session_id': audit_log.session_id,
            'metadata': audit_log.metadata,
            'timestamp': audit_log.timestamp,
        }
        
        return Response(log_data, status=status.HTTP_200_OK)
        
    except AuditLog.DoesNotExist:
        return Response(
            {'error': 'Audit log not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error getting audit log detail: {str(e)}")
        return Response(
            {'error': 'Failed to retrieve audit log detail'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAdminUser])
def audit_statistics_view(request):
    """
    Get audit log statistics and analytics.
    """
    try:
        date_range = int(request.GET.get('date_range', 30))
        result = AuditLoggingService.get_audit_statistics(date_range)
        return Response(result, status=status.HTTP_200_OK)
        
    except ValueError:
        return Response(
            {'error': 'Invalid date range parameter'},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        logger.error(f"Error getting audit statistics: {str(e)}")
        return Response(
            {'error': 'Failed to retrieve audit statistics'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAdminUser])
def audit_export_view(request):
    """
    Export audit logs based on filters.
    """
    try:
        filters = request.data.get('filters', {})
        format_type = request.data.get('format', 'json').lower()
        
        # Add pagination parameters for export
        filters.update({
            'page': 1,
            'per_page': 10000,  # Large number for export
        })
        
        result = AuditLoggingService.export_audit_logs(filters, format_type)
        return Response(result, status=status.HTTP_200_OK)
        
    except ValueError as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        logger.error(f"Error exporting audit logs: {str(e)}")
        return Response(
            {'error': 'Failed to export audit logs'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAdminUser])
def audit_action_types_view(request):
    """
    Get available audit action types for filtering.
    """
    try:
        from admin_panel.models import AuditLog
        
        action_types = [
            {'value': choice[0], 'label': choice[1]} 
            for choice in AuditLog.ActionType.choices
        ]
        
        return Response({'action_types': action_types}, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error getting action types: {str(e)}")
        return Response(
            {'error': 'Failed to retrieve action types'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAdminUser])
def audit_severity_levels_view(request):
    """
    Get available severity levels for filtering.
    """
    try:
        from admin_panel.models import AuditLog
        
        severity_levels = [
            {'value': choice[0], 'label': choice[1]} 
            for choice in AuditLog.SeverityLevel.choices
        ]
        
        return Response({'severity_levels': severity_levels}, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error getting severity levels: {str(e)}")
        return Response(
            {'error': 'Failed to retrieve severity levels'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAdminUser])
def audit_categories_view(request):
    """
    Get available audit categories for filtering.
    """
    try:
        from admin_panel.models import AuditLog
        
        # Get unique categories from existing logs
        categories = AuditLog.objects.values_list('category', flat=True).distinct()
        category_choices = [
            {'value': cat, 'label': cat.replace('_', ' ').title()} 
            for cat in categories if cat
        ]
        
        # Add standard categories
        standard_categories = [
            {'value': 'admin', 'label': 'Admin'},
            {'value': 'user', 'label': 'User'},
            {'value': 'chat', 'label': 'Chat'},
            {'value': 'file', 'label': 'File'},
            {'value': 'system', 'label': 'System'},
            {'value': 'security', 'label': 'Security'},
        ]
        
        # Combine and deduplicate
        all_categories = {cat['value']: cat for cat in standard_categories}
        for cat in category_choices:
            all_categories[cat['value']] = cat
        
        return Response({'categories': list(all_categories.values())}, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error getting categories: {str(e)}")
        return Response(
            {'error': 'Failed to retrieve categories'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAdminUser])
def audit_dashboard_view(request):
    """
    Get audit dashboard summary data.
    """
    try:
        # Get recent audit activity (last 24 hours)
        recent_filters = {
            'date_from': request.GET.get('date_from', ''),
            'date_to': request.GET.get('date_to', ''),
            'page': 1,
            'per_page': 10,
            'ordering': '-timestamp',
        }
        
        # Get statistics
        stats = AuditLoggingService.get_audit_statistics(7)  # Last 7 days
        
        # Get recent critical/security logs
        critical_filters = {
            'severity': 'critical',
            'page': 1,
            'per_page': 5,
            'ordering': '-timestamp',
        }
        critical_logs_result = AuditLoggingService.get_audit_logs(critical_filters)
        
        # Get security-related logs
        security_filters = {
            'category': 'security',
            'page': 1,
            'per_page': 5,
            'ordering': '-timestamp',
        }
        security_logs_result = AuditLoggingService.get_audit_logs(security_filters)
        
        dashboard_data = {
            'summary_stats': {
                'total_logs_7_days': stats['total_logs'],
                'critical_logs_7_days': stats['severity_stats'].get('critical', 0),
                'security_logs_7_days': stats['category_stats'].get('security', 0),
                'top_action': max(stats['action_stats'].items(), key=lambda x: x[1])[0] if stats['action_stats'] else None,
            },
            'recent_logs': recent_filters,  # Return filters so frontend can fetch
            'critical_logs': critical_logs_result['logs'],
            'security_logs': security_logs_result['logs'],
            'daily_activity': stats['daily_activity'],
            'severity_distribution': stats['severity_stats'],
            'category_distribution': stats['category_stats'],
            'generated_at': stats['generated_at'],
        }
        
        return Response(dashboard_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error getting audit dashboard: {str(e)}")
        return Response(
            {'error': 'Failed to retrieve audit dashboard data'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAdminUser])
def manual_audit_log_view(request):
    """
    Manually create an audit log entry (for testing or special cases).
    """
    try:
        data = request.data
        required_fields = ['action_type', 'description']
        
        for field in required_fields:
            if field not in data:
                return Response(
                    {'error': f"Field '{field}' is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Create audit log
        audit_log = AuditLoggingService.log_admin_action(
            action_type=data['action_type'],
            description=data['description'],
            admin_user=request.user,
            target_type=data.get('target_type'),
            target_id=data.get('target_id'),
            severity=data.get('severity', 'info'),
            category=data.get('category', 'manual'),
            request=request,
            metadata=data.get('metadata')
        )
        
        if audit_log:
            return Response({
                'message': 'Audit log created successfully',
                'log_id': str(audit_log.id)
            }, status=status.HTTP_201_CREATED)
        else:
            return Response(
                {'error': 'Failed to create audit log'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
    except Exception as e:
        logger.error(f"Error creating manual audit log: {str(e)}")
        return Response(
            {'error': 'Failed to create audit log'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def audit_cleanup_view(request):
    """
    Clean up old audit logs based on retention policy.
    """
    try:
        retention_days = int(request.data.get('retention_days', 365))
        dry_run = request.data.get('dry_run', False)
        
        from admin_panel.models import AuditLog
        from django.utils import timezone
        from datetime import timedelta
        
        cutoff_date = timezone.now() - timedelta(days=retention_days)
        
        if dry_run:
            # Just count how many would be deleted
            logs_to_delete = AuditLog.objects.filter(timestamp__lt=cutoff_date)
            count = logs_to_delete.count()
            
            return Response({
                'message': f'Dry run: {count} audit logs would be deleted',
                'count': count,
                'cutoff_date': cutoff_date.isoformat(),
                'dry_run': True
            }, status=status.HTTP_200_OK)
        else:
            # Actually delete the logs
            logs_to_delete = AuditLog.objects.filter(timestamp__lt=cutoff_date)
            count, _ = logs_to_delete.delete()
            
            # Log this cleanup action
            AuditLoggingService.log_admin_action(
                action_type=AuditLog.ActionType.SYSTEM_SETTINGS_CHANGED,
                description=f'Audit log cleanup: {count} logs deleted (retention: {retention_days} days)',
                admin_user=request.user,
                request=request,
                metadata={
                    'cleanup_count': count,
                    'retention_days': retention_days,
                    'cutoff_date': cutoff_date.isoformat(),
                },
                category='system_maintenance'
            )
            
            return Response({
                'message': f'Cleanup completed: {count} audit logs deleted',
                'count': count,
                'cutoff_date': cutoff_date.isoformat(),
                'dry_run': False
            }, status=status.HTTP_200_OK)
        
    except ValueError:
        return Response(
            {'error': 'Invalid retention_days parameter'},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        logger.error(f"Error during audit cleanup: {str(e)}")
        return Response(
            {'error': 'Failed to perform audit cleanup'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )