"""
URL configuration for admin_panel app.
"""
from django.urls import path
from rest_framework.routers import DefaultRouter
from admin_panel import views_settings
from admin_panel import moderation_views
from admin_panel import views_audit

router = DefaultRouter()
router.register(r'pending-users', moderation_views.PendingUsersViewSet, basename='pending-users')
router.register(r'audit-logs', views_audit.AuditLogViewSet, basename='audit-logs')

urlpatterns = [
    # System settings endpoints - bulk update must come before detail
    path('settings/bulk/update/', views_settings.SystemSettingsBulkUpdateView.as_view(), name='system_settings_bulk_update'),
    path('settings/', views_settings.SystemSettingsListView.as_view(), name='system_settings_list'),
    path('settings/<str:key>/', views_settings.SystemSettingDetailView.as_view(), name='system_setting_detail'),
    path('settings/<str:key>/update/', views_settings.SystemSettingUpdateView.as_view(), name='system_setting_update'),
] + router.urls
