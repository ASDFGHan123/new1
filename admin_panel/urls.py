"""
URL configuration for admin_panel app.
"""
from django.urls import path
from rest_framework.routers import DefaultRouter
from admin_panel import views_settings
from admin_panel import moderation_views
from admin_panel import views_audit
from admin_panel import views_dashboard
from admin_panel import views_conversations
from admin_panel import views_message_templates
from admin_panel import views_message_history
from admin_panel import views_backups
from admin_panel.moderator_management_views import AdminModeratorViewSet
from admin_panel.views_permissions import MyPermissionsView
from admin_panel.views_permissions_ui import AvailablePermissionsView, SetModeratorPermissionsView

router = DefaultRouter()
router.register(r'pending-users', moderation_views.PendingUsersViewSet, basename='pending-users')
router.register(r'audit-logs', views_audit.AuditLogViewSet, basename='audit-logs')
router.register(r'message-templates', views_message_templates.MessageTemplateViewSet, basename='message-templates')
router.register(r'message-history', views_message_history.MessageHistoryViewSet, basename='message-history')
router.register(r'backups', views_backups.BackupViewSet, basename='backups')
router.register(r'moderators', AdminModeratorViewSet, basename='admin-moderator')

urlpatterns = [
    # Permissions endpoint
    path('my-permissions/', MyPermissionsView.as_view(), name='my_permissions'),

    # Permission management UI
    path('permissions/available/', AvailablePermissionsView.as_view(), name='available_permissions'),
    path('permissions/moderators/', ModeratorsWithPermissionsView.as_view(), name='moderators_with_permissions'),
    path('permissions/set/<int:user_id>/', SetModeratorPermissionsView.as_view(), name='set_moderator_permissions'),

    # Dashboard endpoints
    path('dashboard/stats/', views_dashboard.DashboardStatsView.as_view(), name='dashboard_stats'),
    
    # Conversations endpoints
    path('conversations/', views_conversations.AdminConversationsView.as_view(), name='admin_conversations'),
    
    # System settings endpoints - bulk update must come before detail
    path('settings/bulk/update/', views_settings.SystemSettingsBulkUpdateView.as_view(), name='system_settings_bulk_update'),
    path('settings/', views_settings.SystemSettingsListView.as_view(), name='system_settings_list'),
    path('settings/<str:key>/', views_settings.SystemSettingDetailView.as_view(), name='system_setting_detail'),
    path('settings/<str:key>/update/', views_settings.SystemSettingUpdateView.as_view(), name='system_setting_update'),
] + router.urls
