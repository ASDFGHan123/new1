"""
WebSocket routing configuration for chat app.
"""
from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/chat/(?P<conversation_id>\w+)/$', consumers.ChatConsumer.as_asgi()),
    re_path(r'ws/chat/individual/(?P<user_id>\w+)/$', consumers.IndividualChatConsumer.as_asgi()),
    re_path(r'ws/chat/group/(?P<group_id>\w+)/$', consumers.GroupChatConsumer.as_asgi()),
    re_path(r'ws/user/status/$', consumers.UserStatusConsumer.as_asgi()),
    re_path(r'ws/admin/monitor/$', consumers.AdminMonitorConsumer.as_asgi()),
]