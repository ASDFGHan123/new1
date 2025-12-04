"""
URL configuration for admin_panel app.
"""
from django.urls import path
from . import views

urlpatterns = [
    # Audit log endpoints
    path('audit-logs/', views.AuditLogListView.as_view(), name='audit_logs_list'),
    path('audit-logs/<uuid:log_id>/', views.AuditLogDetailView.as_view(), name='audit_log_detail'),
    path('audit-logs/export/', views.AuditLogExportView.as_view(), name='audit_export'),
    
    # System message endpoints
    path('system-messages/', views.SystemMessageListCreateView.as_view(), name='system_message_list_create'),
    path('system-messages/<uuid:message_id>/', views.SystemMessageDetailView.as_view(), name='system_message_detail'),
    path('system-messages/<uuid:message_id>/send/', views.SystemMessageSendView.as_view(), name='system_message_send'),
    
    # Message template endpoints
    path('message-templates/', views.MessageTemplateListCreateView.as_view(), name='message_template_list_create'),
    path('message-templates/<uuid:template_id>/', views.MessageTemplateDetailView.as_view(), name='message_template_detail'),
    path('message-templates/<uuid:template_id>/use/', views.MessageTemplateUseView.as_view(), name='message_template_use'),
    
    # Trash endpoints
    path('trash/', views.TrashListView.as_view(), name='trash_list'),
    path('trash/<uuid:item_id>/restore/', views.TrashRestoreView.as_view(), name='trash_restore'),
    path('trash/<uuid:item_id>/permanent-delete/', views.TrashPermanentDeleteView.as_view(), name='trash_permanent_delete'),
    
    # Backup endpoints
    path('backups/', views.BackupListCreateView.as_view(), name='backup_list_create'),
    path('backups/<uuid:backup_id>/', views.BackupDetailView.as_view(), name='backup_detail'),
    path('backups/<uuid:backup_id>/download/', views.BackupDownloadView.as_view(), name='backup_download'),
    path('backups/<uuid:backup_id>/restore/', views.BackupRestoreView.as_view(), name='backup_restore'),
    
    # System settings endpoints
    path('settings/', views.SystemSettingsListView.as_view(), name='system_settings_list'),
    path('settings/<str:key>/', views.SystemSettingDetailView.as_view(), name='system_setting_detail'),
    path('settings/<str:key>/update/', views.SystemSettingUpdateView.as_view(), name='system_setting_update'),
    
    # Dashboard data endpoints
    path('dashboard/stats/', views.DashboardStatsView.as_view(), name='dashboard_stats'),
    path('dashboard/monitoring/', views.SystemMonitoringView.as_view(), name='system_monitoring'),
    
    # Analytics endpoint (delegates to analytics app)
    path('analytics/', views.GeneralAnalyticsProxyView.as_view(), name='general_analytics'),
]