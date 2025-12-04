"""
URL configuration for analytics app.
"""
from django.urls import path
from . import views

urlpatterns = [
    # Analytics endpoints
    path('', views.GeneralAnalyticsView.as_view(), name='general_analytics'),  # General analytics for admin dashboard
    path('users/<uuid:user_id>/', views.UserAnalyticsView.as_view(), name='user_analytics'),
    path('users/<uuid:user_id>/engagement/', views.UserEngagementView.as_view(), name='user_engagement'),
    path('conversations/<uuid:conversation_id>/', views.ConversationAnalyticsView.as_view(), name='conversation_analytics'),
    path('system/', views.SystemAnalyticsView.as_view(), name='system_analytics'),
    path('system/overview/', views.SystemOverviewView.as_view(), name='system_overview'),
    path('system/performance/', views.PerformanceMetricsView.as_view(), name='performance_metrics'),
    path('messages/<uuid:message_id>/metrics/', views.MessageMetricsView.as_view(), name='message_metrics'),
    path('reports/users/', views.UserReportView.as_view(), name='user_report'),
    path('reports/activity/', views.ActivityReportView.as_view(), name='activity_report'),
    path('reports/engagement/', views.EngagementReportView.as_view(), name='engagement_report'),
    path('export/users/', views.ExportUserDataView.as_view(), name='export_user_data'),
    path('export/activity/', views.ExportActivityDataView.as_view(), name='export_activity_data'),
]