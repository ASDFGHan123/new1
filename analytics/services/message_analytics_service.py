"""
Message analytics and monitoring service for OffChat application.
Provides comprehensive analytics for messages, conversations, and user engagement.
"""
import logging
import json
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from django.contrib.auth import get_user_model
from django.db import models
from django.db.models import Q, Count, Avg, Sum, Max, Min, F, DurationField
from django.utils import timezone
from django.core.paginator import Paginator

from chat.models import Message, Conversation, Group, Attachment
from analytics.models import (
    UserAnalytics, ConversationAnalytics, SystemAnalytics, 
    MessageMetrics, UserEngagement, PerformanceMetrics
)

User = get_user_model()
logger = logging.getLogger(__name__)


class MessageAnalyticsService:
    """
    Service for comprehensive message analytics and monitoring.
    """
    
    @classmethod
    def get_message_analytics(cls, filters: Dict[str, Any]) -> Dict[str, Any]:
        """
        Get comprehensive message analytics based on filters.
        
        Args:
            filters: Filter parameters including date range, conversation, user, etc.
            
        Returns:
            Dict with message analytics data
        """
        try:
            # Base message queryset
            messages = Message.objects.filter(is_deleted=False)
            
            # Apply filters
            date_from = filters.get('date_from')
            date_to = filters.get('date_to')
            if date_from:
                messages = messages.filter(timestamp__date__gte=date_from)
            if date_to:
                messages = messages.filter(timestamp__date__lte=date_to)
            
            conversation_id = filters.get('conversation_id')
            if conversation_id:
                messages = messages.filter(conversation_id=conversation_id)
            
            user_id = filters.get('user_id')
            if user_id:
                messages = messages.filter(sender_id=user_id)
            
            message_type = filters.get('message_type')
            if message_type:
                messages = messages.filter(message_type=message_type)
            
            # Basic message statistics
            total_messages = messages.count()
            
            # Message type distribution
            message_type_stats = dict(
                messages.values('message_type').annotate(count=Count('id')).values_list('message_type', 'count')
            )
            
            # Daily message counts (last 30 days)
            daily_stats = cls._get_daily_message_stats(messages, 30)
            
            # Hourly distribution
            hourly_stats = cls._get_hourly_message_stats(messages)
            
            # User activity stats
            user_activity_stats = cls._get_user_activity_stats(messages)
            
            # Conversation activity
            conversation_stats = cls._get_conversation_activity_stats(messages)
            
            # Message content analysis
            content_stats = cls._get_message_content_stats(messages)
            
            # Response time analysis
            response_stats = cls._get_response_time_stats(messages)
            
            return {
                'summary': {
                    'total_messages': total_messages,
                    'date_range': {
                        'from': date_from,
                        'to': date_to
                    },
                    'filters_applied': filters
                },
                'distribution': {
                    'by_type': message_type_stats,
                    'hourly': hourly_stats,
                    'daily': daily_stats,
                },
                'user_activity': user_activity_stats,
                'conversation_activity': conversation_stats,
                'content_analysis': content_stats,
                'response_analysis': response_stats,
                'generated_at': timezone.now().isoformat(),
            }
            
        except Exception as e:
            logger.error(f"Error getting message analytics: {str(e)}")
            raise
    
    @classmethod
    def get_conversation_analytics(cls, conversation_id: str = None, date_range: int = 30) -> Dict[str, Any]:
        """
        Get analytics for specific conversation or all conversations.
        
        Args:
            conversation_id: Optional conversation ID to analyze
            date_range: Number of days to analyze
            
        Returns:
            Dict with conversation analytics
        """
        try:
            base_date = timezone.now() - timedelta(days=date_range)
            
            if conversation_id:
                # Specific conversation analysis
                messages = Message.objects.filter(
                    conversation_id=conversation_id,
                    timestamp__gte=base_date,
                    is_deleted=False
                )
                
                conversation = Conversation.objects.get(id=conversation_id)
                
                # Basic stats
                total_messages = messages.count()
                unique_senders = messages.values('sender').distinct().count()
                
                # Activity timeline
                activity_timeline = cls._get_conversation_activity_timeline(messages)
                
                # Message patterns
                message_patterns = cls._analyze_message_patterns(messages)
                
                # Participant analysis
                participant_analysis = cls._analyze_participant_activity(messages)
                
                return {
                    'conversation_info': {
                        'id': str(conversation.id),
                        'type': conversation.conversation_type,
                        'title': str(conversation),
                    },
                    'summary': {
                        'total_messages': total_messages,
                        'unique_senders': unique_senders,
                        'date_range_days': date_range,
                    },
                    'activity_timeline': activity_timeline,
                    'message_patterns': message_patterns,
                    'participant_analysis': participant_analysis,
                }
            else:
                # Overall conversation analytics
                conversations = Conversation.objects.filter(is_deleted=False)
                
                conversation_stats = []
                for conv in conversations:
                    conv_messages = Message.objects.filter(
                        conversation=conv,
                        timestamp__gte=base_date,
                        is_deleted=False
                    )
                    
                    if conv_messages.exists():
                        stats = {
                            'conversation_id': str(conv.id),
                            'conversation_name': str(conv),
                            'message_count': conv_messages.count(),
                            'unique_senders': conv_messages.values('sender').distinct().count(),
                            'last_activity': conv_messages.order_by('-timestamp').first().timestamp,
                        }
                        conversation_stats.append(stats)
                
                # Sort by message count
                conversation_stats.sort(key=lambda x: x['message_count'], reverse=True)
                
                return {
                    'summary': {
                        'total_conversations': len(conversation_stats),
                        'most_active_conversations': conversation_stats[:10],
                    },
                    'conversation_rankings': conversation_stats[:50],
                }
                
        except Exception as e:
            logger.error(f"Error getting conversation analytics: {str(e)}")
            raise
    
    @classmethod
    def get_user_engagement_analytics(cls, user_id: int = None, date_range: int = 30) -> Dict[str, Any]:
        """
        Get user engagement analytics.
        
        Args:
            user_id: Optional specific user ID
            date_range: Number of days to analyze
            
        Returns:
            Dict with user engagement analytics
        """
        try:
            base_date = timezone.now() - timedelta(days=date_range)
            
            if user_id:
                # Specific user engagement
                user = User.objects.get(id=user_id)
                messages = Message.objects.filter(
                    sender=user,
                    timestamp__gte=base_date,
                    is_deleted=False
                )
                
                # Basic engagement metrics
                total_messages = messages.count()
                conversations_participated = messages.values('conversation').distinct().count()
                
                # Activity patterns
                daily_activity = cls._get_user_daily_activity(user, base_date)
                hourly_activity = cls._get_user_hourly_activity(user, base_date)
                
                # Message characteristics
                message_chars = cls._analyze_user_message_characteristics(messages)
                
                # Response patterns
                response_patterns = cls._analyze_user_response_patterns(user, base_date)
                
                return {
                    'user_info': {
                        'id': user.id,
                        'username': user.username,
                        'join_date': user.join_date,
                    },
                    'engagement_summary': {
                        'total_messages': total_messages,
                        'conversations_participated': conversations_participated,
                        'average_messages_per_day': round(total_messages / date_range, 2),
                    },
                    'activity_patterns': {
                        'daily': daily_activity,
                        'hourly': hourly_activity,
                    },
                    'message_characteristics': message_chars,
                    'response_patterns': response_patterns,
                }
            else:
                # Overall user engagement analytics
                users = User.objects.filter(is_active=True)
                
                engagement_data = []
                for user in users:
                    user_messages = Message.objects.filter(
                        sender=user,
                        timestamp__gte=base_date,
                        is_deleted=False
                    )
                    
                    if user_messages.exists():
                        data = {
                            'user_id': user.id,
                            'username': user.username,
                            'message_count': user_messages.count(),
                            'conversations_count': user_messages.values('conversation').distinct().count(),
                            'last_activity': user_messages.order_by('-timestamp').first().timestamp,
                            'engagement_score': cls._calculate_user_engagement_score(user, user_messages.count(), date_range),
                        }
                        engagement_data.append(data)
                
                # Sort by engagement score
                engagement_data.sort(key=lambda x: x['engagement_score'], reverse=True)
                
                return {
                    'summary': {
                        'total_active_users': len(engagement_data),
                        'average_messages_per_user': round(sum(d['message_count'] for d in engagement_data) / len(engagement_data), 2),
                    },
                    'top_engaged_users': engagement_data[:20],
                    'engagement_distribution': cls._get_engagement_distribution(engagement_data),
                }
                
        except Exception as e:
            logger.error(f"Error getting user engagement analytics: {str(e)}")
            raise
    
    @classmethod
    def get_real_time_metrics(cls) -> Dict[str, Any]:
        """
        Get real-time system metrics and monitoring data.
        
        Returns:
            Dict with real-time metrics
        """
        try:
            now = timezone.now()
            last_hour = now - timedelta(hours=1)
            last_24h = now - timedelta(hours=24)
            
            # Message metrics
            messages_last_hour = Message.objects.filter(
                timestamp__gte=last_hour,
                is_deleted=False
            ).count()
            
            messages_last_24h = Message.objects.filter(
                timestamp__gte=last_24h,
                is_deleted=False
            ).count()
            
            # Active users (users who sent messages in last hour)
            active_users_last_hour = Message.objects.filter(
                timestamp__gte=last_hour,
                is_deleted=False
            ).values('sender').distinct().count()
            
            # Active conversations
            active_conversations = Message.objects.filter(
                timestamp__gte=last_hour,
                is_deleted=False
            ).values('conversation').distinct().count()
            
            # System performance (if available)
            performance_data = cls._get_recent_performance_metrics()
            
            # Recent alerts or issues
            recent_alerts = cls._get_recent_system_alerts()
            
            return {
                'timestamp': now.isoformat(),
                'message_metrics': {
                    'messages_last_hour': messages_last_hour,
                    'messages_last_24h': messages_last_24h,
                    'messages_per_minute': round(messages_last_hour / 60, 2),
                },
                'user_metrics': {
                    'active_users_last_hour': active_users_last_hour,
                },
                'conversation_metrics': {
                    'active_conversations': active_conversations,
                },
                'performance': performance_data,
                'alerts': recent_alerts,
                'system_health': cls._calculate_system_health_score(
                    messages_last_hour, active_users_last_hour, performance_data
                ),
            }
            
        except Exception as e:
            logger.error(f"Error getting real-time metrics: {str(e)}")
            raise
    
    @classmethod
    def generate_analytics_report(cls, report_type: str, filters: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate comprehensive analytics report.
        
        Args:
            report_type: Type of report ('daily', 'weekly', 'monthly', 'custom')
            filters: Report filters and parameters
            
        Returns:
            Dict with generated report data
        """
        try:
            date_range = filters.get('date_range', 30)
            
            if report_type == 'daily':
                # Daily report
                return cls._generate_daily_report(filters)
            elif report_type == 'weekly':
                # Weekly report
                return cls._generate_weekly_report(filters)
            elif report_type == 'monthly':
                # Monthly report
                return cls._generate_monthly_report(filters)
            elif report_type == 'custom':
                # Custom date range report
                return cls._generate_custom_report(filters)
            else:
                raise ValueError(f"Unknown report type: {report_type}")
                
        except Exception as e:
            logger.error(f"Error generating analytics report: {str(e)}")
            raise
    
    @classmethod
    def monitor_message_health(cls) -> Dict[str, Any]:
        """
        Monitor message system health and detect anomalies.
        
        Returns:
            Dict with health monitoring data
        """
        try:
            now = timezone.now()
            last_hour = now - timedelta(hours=1)
            last_day = now - timedelta(days=1)
            last_week = now - timedelta(weeks=1)
            
            # Compare current activity with historical patterns
            current_hour_messages = Message.objects.filter(
                timestamp__gte=last_hour,
                is_deleted=False
            ).count()
            
            avg_hour_messages = cls._get_average_hourly_messages()
            
            # Health indicators
            health_indicators = {
                'message_volume': {
                    'current': current_hour_messages,
                    'average': avg_hour_messages,
                    'status': 'normal' if current_hour_messages > avg_hour_messages * 0.5 else 'low',
                },
                'system_performance': cls._assess_system_performance(),
                'error_rates': cls._assess_error_rates(),
                'user_activity': cls._assess_user_activity(),
            }
            
            # Detect anomalies
            anomalies = cls._detect_anomalies(health_indicators)
            
            # Generate recommendations
            recommendations = cls._generate_health_recommendations(health_indicators, anomalies)
            
            return {
                'timestamp': now.isoformat(),
                'health_score': cls._calculate_health_score(health_indicators),
                'health_indicators': health_indicators,
                'anomalies': anomalies,
                'recommendations': recommendations,
                'status': 'healthy' if anomalies else 'attention_needed',
            }
            
        except Exception as e:
            logger.error(f"Error monitoring message health: {str(e)}")
            raise
    
    # Helper methods for analytics calculations
    
    @classmethod
    def _get_daily_message_stats(cls, messages, days: int) -> List[Dict[str, Any]]:
        """Get daily message statistics."""
        stats = []
        for i in range(days):
            date = timezone.now().date() - timedelta(days=i)
            day_messages = messages.filter(timestamp__date=date)
            stats.append({
                'date': date.isoformat(),
                'message_count': day_messages.count(),
            })
        return list(reversed(stats))
    
    @classmethod
    def _get_hourly_message_stats(cls, messages) -> Dict[str, int]:
        """Get hourly message distribution."""
        hours = {}
        for hour in range(24):
            hour_messages = messages.filter(timestamp__hour=hour)
            hours[hour] = hour_messages.count()
        return hours
    
    @classmethod
    def _get_user_activity_stats(cls, messages) -> Dict[str, Any]:
        """Get user activity statistics."""
        # Top senders
        top_senders = messages.values('sender__username').annotate(
            message_count=Count('id')
        ).order_by('-message_count')[:10]
        
        # Most active users by hour
        hourly_activity = {}
        for hour in range(24):
            hourly_activity[hour] = messages.filter(timestamp__hour=hour).values('sender').distinct().count()
        
        return {
            'top_senders': list(top_senders),
            'hourly_active_users': hourly_activity,
        }
    
    @classmethod
    def _get_conversation_activity_stats(cls, messages) -> Dict[str, Any]:
        """Get conversation activity statistics."""
        # Most active conversations
        top_conversations = messages.values('conversation__id', 'conversation__title').annotate(
            message_count=Count('id')
        ).order_by('-message_count')[:10]
        
        # Conversation types
        conv_types = messages.values('conversation__conversation_type').annotate(
            count=Count('id')
        )
        
        return {
            'top_conversations': list(top_conversations),
            'by_type': {item['conversation__conversation_type']: item['count'] for item in conv_types},
        }
    
    @classmethod
    def _get_message_content_stats(cls, messages) -> Dict[str, Any]:
        """Get message content analysis."""
        # Average message length
        avg_length = messages.aggregate(avg_length=Avg(models.functions.Length('content')))['avg_length'] or 0
        
        # Message types with attachments
        with_attachments = messages.filter(attachments__isnull=False).count()
        
        # Message length distribution
        length_ranges = {
            '0-10': messages.filter(content__length__lte=10).count(),
            '11-50': messages.filter(content__length__gt=10, content__length__lte=50).count(),
            '51-200': messages.filter(content__length__gt=50, content__length__lte=200).count(),
            '201+': messages.filter(content__length__gt=200).count(),
        }
        
        return {
            'average_length': round(avg_length, 2),
            'with_attachments': with_attachments,
            'length_distribution': length_ranges,
        }
    
    @classmethod
    def _get_response_time_stats(cls, messages) -> Dict[str, Any]:
        """Get response time analysis."""
        # This is a simplified version - in a real implementation,
        # you would track reply relationships and calculate actual response times
        reply_count = messages.filter(reply_to__isnull=False).count()
        total_count = messages.count()
        
        return {
            'reply_rate': round((reply_count / total_count) * 100, 2) if total_count > 0 else 0,
            'average_response_time': 0,  # Placeholder
        }
    
    @classmethod
    def _get_conversation_activity_timeline(cls, messages) -> List[Dict[str, Any]]:
        """Get conversation activity timeline."""
        daily_activity = cls._get_daily_message_stats(messages, 30)
        return daily_activity
    
    @classmethod
    def _analyze_message_patterns(cls, messages) -> Dict[str, Any]:
        """Analyze message patterns in a conversation."""
        # Message frequency over time
        hourly_distribution = cls._get_hourly_message_stats(messages)
        
        # Peak activity hours
        peak_hours = sorted(hourly_distribution.items(), key=lambda x: x[1], reverse=True)[:3]
        
        return {
            'peak_hours': [{'hour': h, 'count': c} for h, c in peak_hours],
            'activity_pattern': 'regular' if max(hourly_distribution.values()) > min(hourly_distribution.values()) * 2 else 'consistent',
        }
    
    @classmethod
    def _analyze_participant_activity(cls, messages) -> Dict[str, Any]:
        """Analyze participant activity in a conversation."""
        participant_stats = messages.values('sender__username').annotate(
            message_count=Count('id'),
            first_message=models.Min('timestamp'),
            last_message=models.Max('timestamp')
        ).order_by('-message_count')
        
        return {
            'participants': list(participant_stats),
            'participant_count': len(participant_stats),
            'activity_distribution': 'concentrated' if participant_stats and participant_stats[0]['message_count'] > sum(p['message_count'] for p in participant_stats) * 0.7 else 'distributed',
        }
    
    @classmethod
    def _get_user_daily_activity(cls, user, base_date) -> List[Dict[str, Any]]:
        """Get daily activity for a specific user."""
        daily_stats = []
        for i in range(30):
            date = (timezone.now() - timedelta(days=i)).date()
            day_messages = Message.objects.filter(
                sender=user,
                timestamp__date=date,
                is_deleted=False
            )
            daily_stats.append({
                'date': date.isoformat(),
                'message_count': day_messages.count(),
            })
        return list(reversed(daily_stats))
    
    @classmethod
    def _get_user_hourly_activity(cls, user, base_date) -> Dict[str, int]:
        """Get hourly activity for a specific user."""
        messages = Message.objects.filter(
            sender=user,
            timestamp__gte=base_date,
            is_deleted=False
        )
        
        hourly_activity = {}
        for hour in range(24):
            hourly_activity[hour] = messages.filter(timestamp__hour=hour).count()
        
        return hourly_activity
    
    @classmethod
    def _analyze_user_message_characteristics(cls, messages) -> Dict[str, Any]:
        """Analyze message characteristics for a user."""
        avg_length = messages.aggregate(avg_length=Avg(models.functions.Length('content')))['avg_length'] or 0
        
        # Most common message type
        message_types = messages.values('message_type').annotate(count=Count('id'))
        most_common_type = max(message_types, key=lambda x: x['count']) if message_types else None
        
        return {
            'average_message_length': round(avg_length, 2),
            'most_common_message_type': most_common_type['message_type'] if most_common_type else None,
            'total_characters': sum(len(m.content) for m in messages),
        }
    
    @classmethod
    def _analyze_user_response_patterns(cls, user, base_date) -> Dict[str, Any]:
        """Analyze response patterns for a user."""
        # Simplified response pattern analysis
        messages = Message.objects.filter(
            sender=user,
            timestamp__gte=base_date,
            is_deleted=False
        )
        
        reply_messages = messages.filter(reply_to__isnull=False)
        
        return {
            'total_replies': reply_messages.count(),
            'reply_rate': round((reply_messages.count() / messages.count()) * 100, 2) if messages.count() > 0 else 0,
        }
    
    @classmethod
    def _calculate_user_engagement_score(cls, user, message_count, days) -> float:
        """Calculate user engagement score."""
        # Simple engagement scoring
        base_score = min(message_count * 2, 50)
        consistency_bonus = min(days * 0.5, 20)
        activity_bonus = min(message_count / days * 5, 30)
        
        return round(base_score + consistency_bonus + activity_bonus, 2)
    
    @classmethod
    def _get_engagement_distribution(cls, engagement_data) -> Dict[str, Any]:
        """Get engagement score distribution."""
        scores = [data['engagement_score'] for data in engagement_data]
        
        return {
            'high_engagement': len([s for s in scores if s > 70]),
            'medium_engagement': len([s for s in scores if 30 <= s <= 70]),
            'low_engagement': len([s for s in scores if s < 30]),
            'average_score': round(sum(scores) / len(scores), 2) if scores else 0,
        }
    
    @classmethod
    def _get_recent_performance_metrics(cls) -> Dict[str, Any]:
        """Get recent performance metrics."""
        last_hour = timezone.now() - timedelta(hours=1)
        metrics = PerformanceMetrics.objects.filter(timestamp__gte=last_hour)
        
        if metrics.exists():
            return {
                'average_response_time': round(metrics.aggregate(avg=Avg('value'))['avg'], 2),
                'slowest_endpoint': metrics.order_by('-value').first().endpoint if metrics else None,
                'total_requests': metrics.count(),
            }
        else:
            return {
                'average_response_time': 0,
                'slowest_endpoint': None,
                'total_requests': 0,
            }
    
    @classmethod
    def _get_recent_system_alerts(cls) -> List[Dict[str, Any]]:
        """Get recent system alerts."""
        # This would typically check audit logs for critical events
        from admin_panel.models import AuditLog
        
        last_hour = timezone.now() - timedelta(hours=1)
        alerts = AuditLog.objects.filter(
            timestamp__gte=last_hour,
            severity=AuditLog.SeverityLevel.CRITICAL
        )
        
        return [
            {
                'timestamp': alert.timestamp.isoformat(),
                'action': alert.action_type,
                'description': alert.description,
            }
            for alert in alerts[:10]
        ]
    
    @classmethod
    def _calculate_system_health_score(cls, messages_last_hour, active_users, performance_data) -> Dict[str, Any]:
        """Calculate overall system health score."""
        # Simple health scoring algorithm
        score = 100
        
        # Deduct points for various issues
        if performance_data.get('average_response_time', 0) > 1000:
            score -= 20
        elif performance_data.get('average_response_time', 0) > 500:
            score -= 10
        
        if messages_last_hour < 10:
            score -= 15
        
        if active_users < 1:
            score -= 10
        
        score = max(0, score)
        
        return {
            'score': score,
            'status': 'healthy' if score >= 80 else 'attention_needed' if score >= 60 else 'critical',
        }
    
    @classmethod
    def _generate_daily_report(cls, filters) -> Dict[str, Any]:
        """Generate daily analytics report."""
        today = timezone.now().date()
        yesterday = today - timedelta(days=1)
        
        today_messages = Message.objects.filter(timestamp__date=today, is_deleted=False)
        yesterday_messages = Message.objects.filter(timestamp__date=yesterday, is_deleted=False)
        
        return {
            'report_type': 'daily',
            'date': today.isoformat(),
            'summary': {
                'messages_today': today_messages.count(),
                'messages_yesterday': yesterday_messages.count(),
                'change_percent': round(((today_messages.count() - yesterday_messages.count()) / yesterday_messages.count()) * 100, 2) if yesterday_messages.count() > 0 else 0,
            },
            'top_users': cls._get_user_activity_stats(today_messages)['top_senders'][:5],
            'generated_at': timezone.now().isoformat(),
        }
    
    @classmethod
    def _generate_weekly_report(cls, filters) -> Dict[str, Any]:
        """Generate weekly analytics report."""
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=7)
        
        messages = Message.objects.filter(
            timestamp__date__gte=start_date,
            timestamp__date__lte=end_date,
            is_deleted=False
        )
        
        return {
            'report_type': 'weekly',
            'date_range': {
                'start': start_date.isoformat(),
                'end': end_date.isoformat(),
            },
            'summary': {
                'total_messages': messages.count(),
                'daily_average': round(messages.count() / 7, 2),
                'peak_day': cls._get_daily_message_stats(messages, 7)[-1],  # Last day (highest activity)
            },
            'user_engagement': cls._get_user_activity_stats(messages),
            'generated_at': timezone.now().isoformat(),
        }
    
    @classmethod
    def _generate_monthly_report(cls, filters) -> Dict[str, Any]:
        """Generate monthly analytics report."""
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=30)
        
        messages = Message.objects.filter(
            timestamp__date__gte=start_date,
            timestamp__date__lte=end_date,
            is_deleted=False
        )
        
        return {
            'report_type': 'monthly',
            'date_range': {
                'start': start_date.isoformat(),
                'end': end_date.isoformat(),
            },
            'summary': {
                'total_messages': messages.count(),
                'daily_average': round(messages.count() / 30, 2),
                'weekly_trend': cls._get_daily_message_stats(messages, 30),
            },
            'comprehensive_analysis': cls.get_message_analytics({
                'date_from': start_date.isoformat(),
                'date_to': end_date.isoformat(),
            }),
            'generated_at': timezone.now().isoformat(),
        }
    
    @classmethod
    def _generate_custom_report(cls, filters) -> Dict[str, Any]:
        """Generate custom date range report."""
        return {
            'report_type': 'custom',
            'filters': filters,
            'analysis': cls.get_message_analytics(filters),
            'generated_at': timezone.now().isoformat(),
        }
    
    # Additional helper methods for monitoring and health assessment
    @classmethod
    def _get_average_hourly_messages(cls) -> float:
        """Get average messages per hour over the last 7 days."""
        end_date = timezone.now()
        start_date = end_date - timedelta(days=7)
        
        total_messages = Message.objects.filter(
            timestamp__gte=start_date,
            timestamp__lte=end_date,
            is_deleted=False
        ).count()
        
        return total_messages / (7 * 24)
    
    @classmethod
    def _assess_system_performance(cls) -> Dict[str, Any]:
        """Assess system performance health."""
        last_hour = timezone.now() - timedelta(hours=1)
        metrics = PerformanceMetrics.objects.filter(timestamp__gte=last_hour)
        
        if metrics.exists():
            avg_response_time = metrics.aggregate(avg=Avg('value'))['avg']
            return {
                'status': 'good' if avg_response_time < 500 else 'warning' if avg_response_time < 1000 else 'critical',
                'average_response_time': round(avg_response_time, 2),
            }
        
        return {'status': 'unknown', 'average_response_time': 0}
    
    @classmethod
    def _assess_error_rates(cls) -> Dict[str, Any]:
        """Assess system error rates."""
        last_hour = timezone.now() - timedelta(hours=1)
        # This would typically check error logs, failed requests, etc.
        # For now, we'll use audit logs as a proxy
        from admin_panel.models import AuditLog
        
        critical_events = AuditLog.objects.filter(
            timestamp__gte=last_hour,
            severity=AuditLog.SeverityLevel.CRITICAL
        ).count()
        
        return {
            'status': 'good' if critical_events == 0 else 'warning' if critical_events < 5 else 'critical',
            'critical_events_last_hour': critical_events,
        }
    
    @classmethod
    def _assess_user_activity(cls) -> Dict[str, Any]:
        """Assess user activity health."""
        last_hour = timezone.now() - timedelta(hours=1)
        active_users = Message.objects.filter(
            timestamp__gte=last_hour,
            is_deleted=False
        ).values('sender').distinct().count()
        
        return {
            'status': 'good' if active_users >= 5 else 'warning' if active_users >= 1 else 'low',
            'active_users_last_hour': active_users,
        }
    
    @classmethod
    def _detect_anomalies(cls, health_indicators) -> List[Dict[str, Any]]:
        """Detect system anomalies."""
        anomalies = []
        
        # Check for unusual message volume
        message_volume = health_indicators.get('message_volume', {})
        if message_volume.get('status') == 'low':
            anomalies.append({
                'type': 'low_message_volume',
                'severity': 'warning',
                'description': 'Message volume is significantly below average',
                'current': message_volume.get('current'),
                'average': message_volume.get('average'),
            })
        
        return anomalies
    
    @classmethod
    def _generate_health_recommendations(cls, health_indicators, anomalies) -> List[str]:
        """Generate health improvement recommendations."""
        recommendations = []
        
        if anomalies:
            for anomaly in anomalies:
                if anomaly['type'] == 'low_message_volume':
                    recommendations.append("Consider implementing user engagement campaigns to increase activity")
                elif anomaly['severity'] == 'critical':
                    recommendations.append("Immediate attention required for critical system issues")
        
        if not recommendations:
            recommendations.append("System is operating normally")
        
        return recommendations
    
    @classmethod
    def _calculate_health_score(cls, health_indicators) -> int:
        """Calculate overall system health score."""
        score = 100
        
        for indicator in health_indicators.values():
            if isinstance(indicator, dict):
                if indicator.get('status') == 'critical':
                    score -= 30
                elif indicator.get('status') == 'warning':
                    score -= 10
                elif indicator.get('status') == 'low':
                    score -= 15
        
        return max(0, score)