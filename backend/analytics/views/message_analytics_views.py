"""
Message analytics API views for OffChat application.
"""
import logging
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response

from analytics.services.message_analytics_service import MessageAnalyticsService

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def message_analytics_view(request):
    """
    Get comprehensive message analytics with filtering options.
    """
    try:
        # Get query parameters
        filters = {
            'date_from': request.GET.get('date_from', ''),
            'date_to': request.GET.get('date_to', ''),
            'conversation_id': request.GET.get('conversation_id', ''),
            'user_id': request.GET.get('user_id', ''),
            'message_type': request.GET.get('message_type', ''),
        }
        
        result = MessageAnalyticsService.get_message_analytics(filters)
        return Response(result, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error getting message analytics: {str(e)}")
        return Response(
            {'error': 'Failed to retrieve message analytics'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def conversation_analytics_view(request):
    """
    Get conversation-specific analytics.
    """
    try:
        conversation_id = request.GET.get('conversation_id')
        date_range = int(request.GET.get('date_range', 30))
        
        result = MessageAnalyticsService.get_conversation_analytics(
            conversation_id=conversation_id,
            date_range=date_range
        )
        return Response(result, status=status.HTTP_200_OK)
        
    except ValueError:
        return Response(
            {'error': 'Invalid date_range parameter'},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        logger.error(f"Error getting conversation analytics: {str(e)}")
        return Response(
            {'error': 'Failed to retrieve conversation analytics'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_engagement_analytics_view(request):
    """
    Get user engagement analytics.
    """
    try:
        user_id = request.GET.get('user_id')
        if user_id:
            user_id = int(user_id)
        
        date_range = int(request.GET.get('date_range', 30))
        
        result = MessageAnalyticsService.get_user_engagement_analytics(
            user_id=user_id,
            date_range=date_range
        )
        return Response(result, status=status.HTTP_200_OK)
        
    except ValueError:
        return Response(
            {'error': 'Invalid user_id or date_range parameter'},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        logger.error(f"Error getting user engagement analytics: {str(e)}")
        return Response(
            {'error': 'Failed to retrieve user engagement analytics'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def real_time_metrics_view(request):
    """
    Get real-time system metrics and monitoring data.
    """
    try:
        result = MessageAnalyticsService.get_real_time_metrics()
        return Response(result, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error getting real-time metrics: {str(e)}")
        return Response(
            {'error': 'Failed to retrieve real-time metrics'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAdminUser])
def system_health_view(request):
    """
    Get system health monitoring data and recommendations.
    """
    try:
        result = MessageAnalyticsService.monitor_message_health()
        return Response(result, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error getting system health: {str(e)}")
        return Response(
            {'error': 'Failed to retrieve system health data'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAdminUser])
def generate_report_view(request):
    """
    Generate comprehensive analytics report.
    """
    try:
        report_type = request.data.get('report_type', 'daily')
        filters = request.data.get('filters', {})
        
        result = MessageAnalyticsService.generate_analytics_report(report_type, filters)
        return Response(result, status=status.HTTP_200_OK)
        
    except ValueError as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        logger.error(f"Error generating report: {str(e)}")
        return Response(
            {'error': 'Failed to generate analytics report'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def message_trends_view(request):
    """
    Get message trends and patterns over time.
    """
    try:
        # Get trend data for different time periods
        periods = {
            'hourly': request.GET.get('hourly', 'false').lower() == 'true',
            'daily': request.GET.get('daily', 'true').lower() == 'true',
            'weekly': request.GET.get('weekly', 'true').lower() == 'true',
            'monthly': request.GET.get('monthly', 'true').lower() == 'true',
        }
        
        user_id = request.GET.get('user_id')
        if user_id:
            user_id = int(user_id)
        
        conversation_id = request.GET.get('conversation_id')
        
        # Get base message queryset
        messages = MessageAnalyticsService._get_filtered_messages({
            'user_id': user_id,
            'conversation_id': conversation_id,
        })
        
        trends_data = {}
        
        if periods['hourly']:
            trends_data['hourly'] = MessageAnalyticsService._get_hourly_message_stats(messages)
        
        if periods['daily']:
            trends_data['daily'] = MessageAnalyticsService._get_daily_message_stats(messages, 30)
        
        if periods['weekly']:
            trends_data['weekly'] = MessageAnalyticsService._get_weekly_message_stats(messages)
        
        if periods['monthly']:
            trends_data['monthly'] = MessageAnalyticsService._get_monthly_message_stats(messages)
        
        return Response({
            'trends': trends_data,
            'filters': {
                'user_id': user_id,
                'conversation_id': conversation_id,
                'periods': periods,
            },
            'generated_at': timezone.now().isoformat(),
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error getting message trends: {str(e)}")
        return Response(
            {'error': 'Failed to retrieve message trends'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_activity_dashboard_view(request):
    """
    Get user activity dashboard for specific users or overall.
    """
    try:
        user_id = request.GET.get('user_id')
        date_range = int(request.GET.get('date_range', 7))
        
        if user_id:
            # Specific user dashboard
            user_id = int(user_id)
            result = MessageAnalyticsService.get_user_engagement_analytics(user_id, date_range)
        else:
            # Overall user activity dashboard
            result = MessageAnalyticsService._get_overall_user_activity_dashboard(date_range)
        
        return Response(result, status=status.HTTP_200_OK)
        
    except ValueError:
        return Response(
            {'error': 'Invalid user_id or date_range parameter'},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        logger.error(f"Error getting user activity dashboard: {str(e)}")
        return Response(
            {'error': 'Failed to retrieve user activity dashboard'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAdminUser])
def system_performance_metrics_view(request):
    """
    Get detailed system performance metrics.
    """
    try:
        metric_type = request.GET.get('metric_type')
        category = request.GET.get('category')
        date_from = request.GET.get('date_from')
        date_to = request.GET.get('date_to')
        
        from analytics.models import PerformanceMetrics
        from django.utils import timezone
        from datetime import timedelta
        
        # Build queryset
        queryset = PerformanceMetrics.objects.all()
        
        if metric_type:
            queryset = queryset.filter(metric_type=metric_type)
        
        if category:
            queryset = queryset.filter(category=category)
        
        if date_from:
            queryset = queryset.filter(timestamp__date__gte=date_from)
        
        if date_to:
            queryset = queryset.filter(timestamp__date__lte=date_to)
        
        # Get metrics summary
        metrics_summary = {
            'total_metrics': queryset.count(),
            'average_response_time': round(queryset.aggregate(avg=Avg('value'))['avg'] or 0, 2),
            'min_response_time': queryset.aggregate(min=Min('value'))['min'] or 0,
            'max_response_time': queryset.aggregate(max=Max('value'))['max'] or 0,
        }
        
        # Get distribution by metric type
        metric_types = dict(
            queryset.values('metric_type').annotate(count=Count('id')).values_list('metric_type', 'count')
        )
        
        # Get distribution by category
        categories = dict(
            queryset.values('category').annotate(count=Count('id')).values_list('category', 'count')
        )
        
        # Get recent performance data
        recent_metrics = queryset.order_by('-timestamp')[:100]
        
        recent_data = []
        for metric in recent_metrics:
            recent_data.append({
                'id': str(metric.id),
                'metric_type': metric.metric_type,
                'category': metric.category,
                'value': metric.value,
                'endpoint': metric.endpoint,
                'method': metric.method,
                'timestamp': metric.timestamp,
            })
        
        return Response({
            'summary': metrics_summary,
            'distribution': {
                'by_metric_type': metric_types,
                'by_category': categories,
            },
            'recent_metrics': recent_data,
            'filters_applied': {
                'metric_type': metric_type,
                'category': category,
                'date_from': date_from,
                'date_to': date_to,
            },
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error getting performance metrics: {str(e)}")
        return Response(
            {'error': 'Failed to retrieve performance metrics'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAdminUser])
def record_performance_metric_view(request):
    """
    Record a new performance metric.
    """
    try:
        data = request.data
        required_fields = ['metric_type', 'value', 'category']
        
        for field in required_fields:
            if field not in data:
                return Response(
                    {'error': f"Field '{field}' is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        from analytics.models import PerformanceMetrics
        
        # Create performance metric
        metric = PerformanceMetrics.objects.create(
            metric_type=data['metric_type'],
            value=data['value'],
            category=data['category'],
            endpoint=data.get('endpoint', ''),
            method=data.get('method', ''),
            user=request.user if request.user.is_authenticated else None,
            context=data.get('context', {}),
        )
        
        return Response({
            'message': 'Performance metric recorded successfully',
            'metric_id': str(metric.id)
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        logger.error(f"Error recording performance metric: {str(e)}")
        return Response(
            {'error': 'Failed to record performance metric'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def message_health_status_view(request):
    """
    Get a simplified message system health status for monitoring dashboards.
    """
    try:
        # Get key health indicators
        health_data = MessageAnalyticsService.monitor_message_health()
        
        # Return simplified status for dashboard widgets
        simplified_status = {
            'status': health_data['status'],
            'health_score': health_data['health_score'],
            'key_metrics': {
                'message_volume_status': health_data['health_indicators']['message_volume']['status'],
                'system_performance': health_data['health_indicators']['system_performance']['status'],
                'user_activity': health_data['health_indicators']['user_activity']['status'],
            },
            'anomaly_count': len(health_data['anomalies']),
            'recommendation_count': len(health_data['recommendations']),
            'last_updated': health_data['timestamp'],
        }
        
        return Response(simplified_status, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error getting message health status: {str(e)}")
        return Response(
            {'error': 'Failed to retrieve health status'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# Helper function to get filtered messages (used in trends view)
def _get_filtered_messages(filters):
    """Helper function to get filtered messages for trends analysis."""
    from chat.models import Message
    from django.utils import timezone
    from datetime import timedelta
    
    messages = Message.objects.filter(is_deleted=False)
    
    user_id = filters.get('user_id')
    if user_id:
        messages = messages.filter(sender_id=user_id)
    
    conversation_id = filters.get('conversation_id')
    if conversation_id:
        messages = messages.filter(conversation_id=conversation_id)
    
    return messages


# Import required modules for the helper function
from django.db.models import Avg, Min, Max, Count
from datetime import datetime
from django.utils import timezone