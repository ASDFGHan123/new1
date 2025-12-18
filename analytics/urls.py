
from django.urls import path
from . import views

urlpatterns = [
    # Simple dashboard endpoints
    path('dashboard/stats/', views.dashboard_stats, name='dashboard_stats'),
    path('data/', views.analytics_data, name='analytics_data'),
    path('audit-logs/', views.audit_logs, name='audit_logs'),
]

# Try to import message analytics views, but don't fail if they don't exist
try:
    from .views import message_analytics_views
    
    # Add existing analytics endpoints if available
    urlpatterns += [
        path('', message_analytics_views.message_analytics_view, name='general_analytics'),
        path('users/<uuid:user_id>/', message_analytics_views.user_engagement_analytics_view, name='user_analytics'),
        path('users/<uuid:user_id>/engagement/', message_analytics_views.user_engagement_analytics_view, name='user_engagement'),
        path('conversations/<uuid:conversation_id>/', message_analytics_views.conversation_analytics_view, name='conversation_analytics'),
        path('system/', message_analytics_views.system_health_view, name='system_analytics'),
        path('system/overview/', message_analytics_views.real_time_metrics_view, name='system_overview'),
        path('system/performance/', message_analytics_views.system_performance_metrics_view, name='performance_metrics'),
        path('messages/<uuid:message_id>/metrics/', message_analytics_views.message_trends_view, name='message_metrics'),
        path('reports/users/', message_analytics_views.user_activity_dashboard_view, name='user_report'),
        path('reports/activity/', message_analytics_views.generate_report_view, name='activity_report'),
        path('reports/engagement/', message_analytics_views.message_trends_view, name='engagement_report'),
        path('export/users/', message_analytics_views.user_activity_dashboard_view, name='export_user_data'),
        path('export/activity/', message_analytics_views.generate_report_view, name='export_activity_data'),
    ]
except ImportError:
    # If message analytics views can't be imported, just use the basic endpoints
    pass
