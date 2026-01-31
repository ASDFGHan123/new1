"""
URL configuration for chat app with video support.
"""
from django.urls import path
from . import views
from .views_video import VideoUploadView, VideoDownloadView

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
    
    # Video endpoints
    path('videos/upload/', VideoUploadView.as_view(), name='video_upload'),
    path('videos/<uuid:attachment_id>/download/', VideoDownloadView.as_view(), name='video_download'),
    
    # Search endpoints
    path('search/', views.SearchView.as_view(), name='search'),
    
    # User status and notifications endpoints
    path('status/', views.UserStatusView.as_view(), name='user_status'),
    path('notifications/', views.RealTimeNotificationView.as_view(), name='notifications'),
]
