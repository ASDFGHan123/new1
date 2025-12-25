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
from .trash_views import TrashViewSet

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
    path('admin/users/', views.AdminUserListView.as_view(), name='admin_user_list'),
    path('admin/users/<int:user_id>/', views.AdminUserDetailView.as_view(), name='admin_user_detail'),
    path('admin/users/<int:user_id>/approve/', views.AdminApproveUserView.as_view(), name='admin_approve_user'),
    path('admin/users/<int:user_id>/suspend/', views.AdminSuspendUserView.as_view(), name='admin_suspend_user'),
    path('admin/users/<int:user_id>/ban/', views.AdminBanUserView.as_view(), name='admin_ban_user'),
    path('admin/users/<int:user_id>/activate/', views.AdminActivateUserView.as_view(), name='admin_activate_user'),
    path('admin/users/<int:user_id>/force-logout/', views.AdminForceLogoutView.as_view(), name='admin_force_logout'),
]
