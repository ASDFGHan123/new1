from django.urls import re_path
from chat.chat_consumers import ChatConsumer, GroupConsumer

websocket_urlpatterns = [
    re_path(r'ws/chat/(?P<conversation_id>[^/]+)/$', ChatConsumer.as_asgi()),
    re_path(r'ws/group/(?P<group_id>[^/]+)/$', GroupConsumer.as_asgi()),
]
