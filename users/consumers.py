"""
WebSocket consumer for real-time user presence tracking.
"""
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework_simplejwt.tokens import AccessToken
import json

User = get_user_model()


class PresenceConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Get token from query string
        query_string = self.scope.get("query_string", b"").decode()
        token = None
        
        if "token=" in query_string:
            token = query_string.split("token=")[1].split("&")[0]
        
        if not token:
            await self.close()
            return
        
        try:
            access_token = AccessToken(token)
            user_id = access_token['user_id']
            self.user = await self.get_user(user_id)
            
            if not self.user:
                await self.close()
                return
        except Exception as e:
            print(f"Token validation error: {e}")
            await self.close()
            return
        
        self.user_id = str(self.user.id)
        self.group_name = f"presence_{self.user_id}"
        
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.channel_layer.group_add("presence_broadcast", self.channel_name)
        await self.accept()
        
        # Set user online
        await self.set_user_online()
        
        # Broadcast user online
        await self.channel_layer.group_send(
            "presence_broadcast",
            {
                "type": "user_status_change",
                "user_id": self.user_id,
                "username": self.user.username,
                "online_status": "online",
            }
        )
    
    async def disconnect(self, close_code):
        if hasattr(self, 'user_id'):
            await self.set_user_offline()
            await self.channel_layer.group_send(
                "presence_broadcast",
                {
                    "type": "user_status_change",
                    "user_id": self.user_id,
                    "username": self.user.username,
                    "online_status": "offline",
                }
            )
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
        
        await self.channel_layer.group_discard("presence_broadcast", self.channel_name)
    
    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            if data.get("type") == "ping":
                await self.update_last_seen()
                await self.send(text_data=json.dumps({"type": "pong"}))
        except:
            pass
    
    async def user_status_change(self, event):
        await self.send(text_data=json.dumps({
            "type": "user_status_change",
            "user_id": event["user_id"],
            "username": event["username"],
            "online_status": event["online_status"],
        }))
    
    @database_sync_to_async
    def get_user(self, user_id):
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            return None
    
    @database_sync_to_async
    def set_user_online(self):
        user = User.objects.get(id=self.user.id)
        user.set_online()
    
    @database_sync_to_async
    def set_user_offline(self):
        user = User.objects.get(id=self.user.id)
        user.set_offline()
    
    @database_sync_to_async
    def update_last_seen(self):
        user = User.objects.get(id=self.user.id)
        user.update_last_seen()
