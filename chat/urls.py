"""
URL configuration for chat app.
"""
from django.urls import path
from . import views
# from .views.file_cleanup_views import (
#     storage_info_view,
#     cleanup_orphaned_files_view,
#     cleanup_temp_uploads_view,
#     cleanup_deleted_message_attachments_view,
#     comprehensive_cleanup_view,
#     optimize_storage_view,
#     cleanup_logs_view,
#     schedule_cleanup_view
# )

urlpatterns = [
    # Conversation endpoints
    path('conversations/', views.ConversationListCreateView.as_view(), name='conversation_list_create'),
    path('conversations/<uuid:conversation_id>/', views.ConversationDetailView.as_view(), name='conversation_detail'),
    path('conversations/<uuid:conversation_id>/messages/', views.MessageListCreateView.as_view(), name='message_list_create'),
    path('conversations/<uuid:conversation_id>/messages/<uuid:message_id>/', views.MessageDetailView.as_view(), name='message_detail'),
    path('conversations/<uuid:conversation_id>/read/', views.MarkAsReadView.as_view(), name='mark_as_read'),
    
    # Group endpoints
    path('groups/', views.GroupListCreateView.as_view(), name='group_list_create'),
    path('groups/<uuid:group_id>/', views.GroupDetailView.as_view(), name='group_detail'),
    path('groups/<uuid:group_id>/members/', views.GroupMemberListView.as_view(), name='group_member_list'),
    path('groups/<uuid:group_id>/members/<uuid:user_id>/', views.GroupMemberManageView.as_view(), name='group_member_manage'),
    path('groups/<uuid:group_id>/join/', views.JoinGroupView.as_view(), name='join_group'),
    path('groups/<uuid:group_id>/leave/', views.LeaveGroupView.as_view(), name='leave_group'),
    
    # File upload endpoints
    path('upload/', views.FileUploadView.as_view(), name='file_upload'),
    path('attachments/<uuid:attachment_id>/', views.AttachmentDetailView.as_view(), name='attachment_detail'),
    
    # Search endpoints
    path('search/', views.SearchView.as_view(), name='search'),
    
    # User status and notifications endpoints
    path('status/', views.UserStatusView.as_view(), name='user_status'),
    path('notifications/', views.RealTimeNotificationView.as_view(), name='notifications'),
    
    # File cleanup and storage management endpoints (temporarily disabled)
    # path('storage/info/', file_cleanup_views.storage_info_view, name='storage_info'),
    # path('storage/cleanup/orphaned/', file_cleanup_views.cleanup_orphaned_files_view, name='cleanup_orphaned_files'),
    # path('storage/cleanup/temp/', file_cleanup_views.cleanup_temp_uploads_view, name='cleanup_temp_uploads'),
    # path('storage/cleanup/deleted/', file_cleanup_views.cleanup_deleted_message_attachments_view, name='cleanup_deleted_attachments'),
    # path('storage/cleanup/comprehensive/', file_cleanup_views.comprehensive_cleanup_view, name='comprehensive_cleanup'),
    # path('storage/optimize/', file_cleanup_views.optimize_storage_view, name='optimize_storage'),
    # path('storage/logs/', file_cleanup_views.cleanup_logs_view, name='cleanup_logs'),
    # path('storage/schedule/', file_cleanup_views.schedule_cleanup_view, name='schedule_cleanup'),
]