"""
URL configuration for users app.
"""
from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)
from rest_framework.routers import DefaultRouter
from django.contrib.auth.models import Group, Permission
from rest_framework import viewsets, serializers
from rest_framework.permissions import IsAuthenticated
from . import views
from .views import user_management_views
from .views.simple_users_view import get_all_users_with_status
from .views.status_refresh_view import refresh_user_status_view
from .views.debug_heartbeat_view import debug_user_heartbeat_view
from .trash_views import TrashViewSet
from .notification_views import NotificationViewSet
from .organization_views import DepartmentViewSet, OfficeViewSet, DepartmentOfficeUserViewSet
from . import data_tools_views

class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = ['id', 'codename', 'name', 'content_type']

class GroupSerializer(serializers.ModelSerializer):
    permissions = serializers.PrimaryKeyRelatedField(many=True, queryset=Permission.objects.all())
    class Meta:
        model = Group
        fields = ['id', 'name', 'permissions']

class PermissionViewSet(viewsets.ModelViewSet):
    queryset = Permission.objects.all()
    serializer_class = PermissionSerializer
    permission_classes = [IsAuthenticated]

class GroupViewSet(viewsets.ModelViewSet):
    queryset = Group.objects.all()
    serializer_class = GroupSerializer
    permission_classes = [IsAuthenticated]

router = DefaultRouter()
router.register(r'trash', TrashViewSet, basename='trash')
router.register(r'permissions', PermissionViewSet, basename='permission')
router.register(r'groups', GroupViewSet, basename='group')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'departments', DepartmentViewSet, basename='department')
router.register(r'offices', OfficeViewSet, basename='office')
router.register(r'department-office-users', DepartmentOfficeUserViewSet, basename='department_office_user')

urlpatterns = router.urls + [
    # Authentication endpoints
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('verify/', TokenVerifyView.as_view(), name='token_verify'),
    
    # User management endpoints
    path('profile/', views.UserProfileView.as_view(), name='user_profile'),
    path('profile/avatar/', views.UserAvatarView.as_view(), name='user_avatar'),
    path('profile/upload-image/', user_management_views.upload_profile_image_view, name='upload_profile_image'),
    path('activity/', views.UserActivityView.as_view(), name='user_activity'),
    path('statistics/', views.UserStatisticsView.as_view(), name='user_statistics'),
    
    # Online status endpoints
    path('heartbeat/', user_management_views.user_heartbeat_view, name='user_heartbeat'),
    path('refresh-status/', refresh_user_status_view, name='refresh_user_status'),
    path('debug/heartbeat/<str:username>/', debug_user_heartbeat_view, name='debug_user_heartbeat'),
    path('all-users/', get_all_users_with_status, name='get_all_users_with_status'),

    # Data tools endpoints (Admin)
    path('data/export/', data_tools_views.export_user_data_view, name='export_user_data'),
    path('data/delete/', data_tools_views.delete_user_data_view, name='delete_user_data'),
    
    # Comprehensive user management endpoints (Admin) - Temporarily disabled for migration
    # path('management/list/', user_management_views.users_list_view, name='users_list'),
    # path('management/create/', user_management_views.create_user_view, name='create_user'),
    # path('management/<int:user_id>/', user_management_views.user_detail_view, name='user_detail'),
    # path('management/<int:user_id>/update/', user_management_views.update_user_view, name='update_user'),
    # path('management/<int:user_id>/delete/', user_management_views.delete_user_view, name='delete_user'),
    # path('management/<int:user_id>/approve/', user_management_views.approve_user_view, name='approve_user'),
    # path('management/<int:user_id>/suspend/', user_management_views.suspend_user_view, name='suspend_user'),
    # path('management/<int:user_id>/ban/', user_management_views.ban_user_view, name='ban_user'),
    # path('management/<int:user_id>/activate/', user_management_views.activate_user_view, name='activate_user'),
    # path('management/<int:user_id>/change-role/', user_management_views.change_user_role_view, name='change_user_role'),
    # path('management/<int:user_id>/activities/', user_management_views.user_activities_view, name='user_activities'),
    # path('management/bulk-update/', user_management_views.bulk_update_users_view, name='bulk_update_users'),
    # path('management/statistics/', user_management_views.user_statistics_view, name='user_statistics'),
    # path('management/roles/', user_management_views.user_roles_view, name='user_roles'),
    # path('management/statuses/', user_management_views.user_statuses_view, name='user_statuses'),
    
    # Legacy admin endpoints (for backward compatibility)
    path('admin/users/', views.AdminUserCreateView.as_view(), name='admin_user_create'),
    path('admin/users/<int:user_id>/', views.AdminUserDetailView.as_view(), name='admin_user_detail'),
    path('admin/users/<int:user_id>/approve/', views.AdminApproveUserView.as_view(), name='admin_approve_user'),
    path('admin/users/<int:user_id>/suspend/', views.AdminSuspendUserView.as_view(), name='admin_suspend_user'),
    path('admin/users/<int:user_id>/ban/', views.AdminBanUserView.as_view(), name='admin_ban_user'),
    path('admin/users/<int:user_id>/activate/', views.AdminActivateUserView.as_view(), name='admin_activate_user'),
    path('admin/users/<int:user_id>/force-logout/', views.AdminForceLogoutView.as_view(), name='admin_force_logout'),
    path('admin/users/<int:user_id>/set-online-status/', user_management_views.set_user_online_status_view, name='set_user_online_status'),
    path('admin/users/<int:user_id>/online-status/', user_management_views.get_user_online_status_view, name='get_user_online_status'),
    path('admin/users/online/', user_management_views.get_online_users_view, name='get_online_users'),
]
