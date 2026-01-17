"""
WebSocket routing configuration.
"""
from django.urls import re_path
from users.consumers import UserStatusConsumer

websocket_urlpatterns = [
    re_path(r'ws/user-status/$', UserStatusConsumer.as_asgi()),
]
