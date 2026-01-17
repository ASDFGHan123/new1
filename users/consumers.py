"""
WebSocket consumers for real-time user status tracking.
"""
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from users.models import User
from django.utils import timezone


class UserStatusConsumer(AsyncWebsocketConsumer):
    """Track user online/offline status in real-time."""
    
    async def connect(self):
        """Handle WebSocket connection."""
        self.user = self.scope["user"]
        
        if not self.user.is_authenticated:
            await self.close()
            return
        
        self.user_id = str(self.user.id)
        self.group_name = f"user_status_{self.user_id}"
        
        # Join user status group
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        
        # Set user as online
        await self.set_user_online()
        
        # Broadcast user came online
        await self.channel_layer.group_send(
            "all_users_status",
            {
                "type": "user_status_changed",
                "user_id": self.user_id,
                "status": "online",
                "timestamp": timezone.now().isoformat()
            }
        )
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection."""
        if self.user.is_authenticated:
            # Set user as offline
            await self.set_user_offline()
            
            # Broadcast user went offline
            await self.channel_layer.group_send(
                "all_users_status",
                {
                    "type": "user_status_changed",
                    "user_id": self.user_id,
                    "status": "offline",
                    "timestamp": timezone.now().isoformat()
                }
            )
        
        # Leave group
        await self.channel_layer.group_discard(self.group_name, self.channel_name)
    
    async def receive(self, text_data):
        """Handle incoming WebSocket messages."""
        try:
            data = json.loads(text_data)
            message_type = data.get("type")
            
            if message_type == "ping":
                # Keep-alive ping
                await self.send(json.dumps({"type": "pong"}))
                await self.update_last_seen()
            
            elif message_type == "set_away":
                await self.set_user_away()
            
            elif message_type == "set_online":
                await self.set_user_online()
        
        except json.JSONDecodeError:
            pass
    
    async def user_status_changed(self, event):
        """Broadcast user status change to all connected clients."""
        await self.send(json.dumps({
            "type": "user_status_changed",
            "user_id": event["user_id"],
            "status": event["status"],
            "timestamp": event["timestamp"]
        }))
    
    @database_sync_to_async
    def set_user_online(self):
        """Set user as online."""
        User.objects.filter(id=self.user.id).update(
            online_status='online',
            last_seen=timezone.now()
        )
    
    @database_sync_to_async
    def set_user_offline(self):
        """Set user as offline."""
        User.objects.filter(id=self.user.id).update(
            online_status='offline',
            last_seen=timezone.now()
        )
    
    @database_sync_to_async
    def set_user_away(self):
        """Set user as away."""
        User.objects.filter(id=self.user.id).update(
            online_status='away'
        )
    
    @database_sync_to_async
    def update_last_seen(self):
        """Update user's last seen timestamp."""
        User.objects.filter(id=self.user.id).update(
            last_seen=timezone.now()
        )
