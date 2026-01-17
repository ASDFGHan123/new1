from django.urls import path
from chat.views import (
    ConversationListCreateView, ConversationDetailView,
    MessageListCreateView, MessageDetailView,
    GroupListCreateView, GroupDetailView,
    GroupMemberListView, GroupMemberManageView,
    JoinGroupView, LeaveGroupView,
    FileUploadView, AttachmentDetailView,
    SearchView, UserStatusView,
    MarkAsReadView, RealTimeNotificationView
)

urlpatterns = [
    # Conversations
    path('conversations/', ConversationListCreateView.as_view(), name='conversation-list-create'),
    path('conversations/<str:conversation_id>/', ConversationDetailView.as_view(), name='conversation-detail'),
    path('conversations/<str:conversation_id>/mark-as-read/', MarkAsReadView.as_view(), name='mark-as-read'),
    
    # Messages
    path('conversations/<str:conversation_id>/messages/', MessageListCreateView.as_view(), name='message-list-create'),
    path('conversations/<str:conversation_id>/messages/<str:message_id>/', MessageDetailView.as_view(), name='message-detail'),
    
    # Groups
    path('groups/', GroupListCreateView.as_view(), name='group-list-create'),
    path('groups/<str:group_id>/', GroupDetailView.as_view(), name='group-detail'),
    path('groups/<str:group_id>/members/', GroupMemberListView.as_view(), name='group-members'),
    path('groups/<str:group_id>/members/<str:user_id>/', GroupMemberManageView.as_view(), name='group-member-manage'),
    path('groups/<str:group_id>/join/', JoinGroupView.as_view(), name='group-join'),
    path('groups/<str:group_id>/leave/', LeaveGroupView.as_view(), name='group-leave'),
    
    # Files
    path('attachments/upload/', FileUploadView.as_view(), name='file-upload'),
    path('attachments/<str:attachment_id>/', AttachmentDetailView.as_view(), name='attachment-detail'),
    
    # Search
    path('search/', SearchView.as_view(), name='search'),
    
    # User Status
    path('user-status/', UserStatusView.as_view(), name='user-status'),
    
    # Notifications
    path('notifications/', RealTimeNotificationView.as_view(), name='notifications'),
]
