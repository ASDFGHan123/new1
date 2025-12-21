"""
URL configuration for admin_panel app.
"""
from django.urls import path
from . import views
from . import moderation_views

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
    
    # System settings endpoints - bulk update must come before detail
    path('settings/bulk/update/', views.SystemSettingsBulkUpdateView.as_view(), name='system_settings_bulk_update'),
    path('settings/', views.SystemSettingsListView.as_view(), name='system_settings_list'),
    path('settings/<str:key>/', views.SystemSettingDetailView.as_view(), name='system_setting_detail'),
    path('settings/<str:key>/update/', views.SystemSettingUpdateView.as_view(), name='system_setting_update'),
    
    # Dashboard data endpoints
    path('dashboard/stats/', views.DashboardStatsView.as_view(), name='dashboard_stats'),
    path('dashboard/monitoring/', views.SystemMonitoringView.as_view(), name='system_monitoring'),
    
    # Analytics endpoint (delegates to analytics app)
    path('analytics/', views.GeneralAnalyticsProxyView.as_view(), name='general_analytics'),
    
    # User creation endpoint
    path('users/create/', views.CreateUserView.as_view(), name='create_user'),
    
    # Conversations endpoint
    path('conversations/', views.AdminConversationListView.as_view(), name='admin_conversations_list'),
    
    # Flagged messages
    path('flagged-messages/', moderation_views.FlaggedMessageViewSet.as_view({'get': 'list', 'post': 'create'}), name='flagged_messages_list'),
    path('flagged-messages/<uuid:pk>/', moderation_views.FlaggedMessageViewSet.as_view({'get': 'retrieve', 'put': 'update', 'delete': 'destroy'}), name='flagged_message_detail'),
    path('flagged-messages/<uuid:pk>/approve/', moderation_views.FlaggedMessageViewSet.as_view({'post': 'approve'}), name='flagged_message_approve'),
    path('flagged-messages/<uuid:pk>/reject/', moderation_views.FlaggedMessageViewSet.as_view({'post': 'reject'}), name='flagged_message_reject'),
    path('flagged-messages/<uuid:pk>/remove/', moderation_views.FlaggedMessageViewSet.as_view({'post': 'remove'}), name='flagged_message_remove'),
    path('flagged-messages/stats/', moderation_views.FlaggedMessageViewSet.as_view({'get': 'stats'}), name='flagged_messages_stats'),
    
    # User moderation
    path('user-moderation/', moderation_views.UserModerationViewSet.as_view({'get': 'list', 'post': 'create'}), name='user_moderation_list'),
    path('user-moderation/<uuid:pk>/', moderation_views.UserModerationViewSet.as_view({'get': 'retrieve', 'put': 'update', 'delete': 'destroy'}), name='user_moderation_detail'),
    path('user-moderation/<uuid:pk>/lift/', moderation_views.UserModerationViewSet.as_view({'post': 'lift'}), name='user_moderation_lift'),
    path('user-moderation/active/', moderation_views.UserModerationViewSet.as_view({'get': 'active'}), name='user_moderation_active'),
    path('user-moderation/stats/', moderation_views.UserModerationViewSet.as_view({'get': 'stats'}), name='user_moderation_stats'),
    
    # Content review
    path('content-reviews/', moderation_views.ContentReviewViewSet.as_view({'get': 'list', 'post': 'create'}), name='content_reviews_list'),
    path('content-reviews/<uuid:pk>/', moderation_views.ContentReviewViewSet.as_view({'get': 'retrieve', 'put': 'update', 'delete': 'destroy'}), name='content_review_detail'),
    path('content-reviews/<uuid:pk>/approve/', moderation_views.ContentReviewViewSet.as_view({'post': 'approve'}), name='content_review_approve'),
    path('content-reviews/<uuid:pk>/reject/', moderation_views.ContentReviewViewSet.as_view({'post': 'reject'}), name='content_review_reject'),
    path('content-reviews/<uuid:pk>/start-review/', moderation_views.ContentReviewViewSet.as_view({'post': 'start_review'}), name='content_review_start'),
    path('content-reviews/pending/', moderation_views.ContentReviewViewSet.as_view({'get': 'pending'}), name='content_reviews_pending'),
    path('content-reviews/stats/', moderation_views.ContentReviewViewSet.as_view({'get': 'stats'}), name='content_reviews_stats'),
    
    # Pending users - use int:pk for User model IDs
    path('pending-users/', moderation_views.PendingUsersViewSet.as_view({'get': 'list'}), name='pending_users_list'),
    path('pending-users/<int:pk>/approve/', moderation_views.PendingUsersViewSet.as_view({'post': 'approve'}), name='pending_user_approve'),
    path('pending-users/<int:pk>/reject/', moderation_views.PendingUsersViewSet.as_view({'post': 'reject'}), name='pending_user_reject'),
    path('pending-users/stats/', moderation_views.PendingUsersViewSet.as_view({'get': 'stats'}), name='pending_users_stats'),
]
