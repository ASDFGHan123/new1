"""
Django Channels consumers for real-time chat functionality.
"""
import json
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.utils import timezone
from .models import Conversation, Message, Group, GroupMember
from users.models import UserActivity

User = get_user_model()


class ChatConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for general chat functionality.
    """
    
    async def connect(self):
        self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']
        self.conversation_group_name = f'chat_{self.conversation_id}'
        
        # Join conversation group
        await self.channel_layer.group_add(
            self.conversation_group_name,
            self.channel_name
        )
        
        await self.accept()
    
    async def disconnect(self, close_code):
        # Leave conversation group
        await self.channel_layer.group_discard(
            self.conversation_group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message_type = text_data_json['type']
        
        if message_type == 'typing':
            await self.channel_layer.group_send(
                self.conversation_group_name,
                {
                    'type': 'user_typing',
                    'user_id': self.scope["user"].id,
                    'username': self.scope["user"].username,
                }
            )
        
        elif message_type == 'stop_typing':
            await self.channel_layer.group_send(
                self.conversation_group_name,
                {
                    'type': 'user_stop_typing',
                    'user_id': self.scope["user"].id,
                }
            )
    
    async def user_typing(self, event):
        await self.send(text_data=json.dumps({
            'type': 'typing',
            'user_id': event['user_id'],
            'username': event['username'],
        }))
    
    async def user_stop_typing(self, event):
        await self.send(text_data=json.dumps({
            'type': 'stop_typing',
            'user_id': event['user_id'],
        }))
    
    async def new_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'new_message',
            'message': event['message'],
        }))


class IndividualChatConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for individual chat between two users.
    """
    
    async def connect(self):
        self.user_id = self.scope['url_route']['kwargs']['user_id']
        self.user = self.scope["user"]
        
        # Create individual conversation room name
        user_ids = sorted([self.user.id, int(self.user_id)])
        self.room_group_name = f'individual_{user_ids[0]}_{user_ids[1]}'
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
    
    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message_type = text_data_json['type']
        
        if message_type == 'send_message':
            await self.handle_send_message(text_data_json)
        
        elif message_type == 'typing':
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'user_typing',
                    'user_id': self.user.id,
                    'username': self.user.username,
                }
            )
        
        elif message_type == 'stop_typing':
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'user_stop_typing',
                    'user_id': self.user.id,
                }
            )
    
    async def handle_send_message(self, text_data_json):
        content = text_data_json['content']
        message_type = text_data_json.get('message_type', 'text')
        
        # Find or create conversation
        conversation = await self.get_or_create_individual_conversation()
        
        if conversation:
            # Create message
            message = await self.create_message(conversation, content, message_type)
            
            # Send message to room group
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'new_message',
                    'message': {
                        'id': str(message['id']),
                        'content': message['content'],
                        'sender': {
                            'id': message['sender']['id'],
                            'username': message['sender']['username'],
                        },
                        'timestamp': message['timestamp'],
                        'message_type': message['message_type'],
                    },
                }
            )
    
    async def new_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'new_message',
            'message': event['message'],
        }))
    
    async def user_typing(self, event):
        await self.send(text_data=json.dumps({
            'type': 'typing',
            'user_id': event['user_id'],
            'username': event['username'],
        }))
    
    async def user_stop_typing(self, event):
        await self.send(text_data=json.dumps({
            'type': 'stop_typing',
            'user_id': event['user_id'],
        }))
    
    @database_sync_to_async
    def get_or_create_individual_conversation(self):
        """Get or create individual conversation between two users."""
        try:
            other_user = User.objects.get(id=self.user_id)
            
            # Check if conversation already exists
            conversations = Conversation.objects.filter(
                conversation_type='individual',
                participants=self.user
            ).filter(
                participants=other_user
            )
            
            if conversations.exists():
                return conversations.first()
            
            # Create new conversation
            conversation = Conversation.objects.create(
                conversation_type='individual'
            )
            conversation.participants.add(self.user, other_user)
            
            return conversation
            
        except User.DoesNotExist:
            return None
    
    @database_sync_to_async
    def create_message(self, conversation, content, message_type):
        """Create a new message."""
        message = Message.objects.create(
            conversation=conversation,
            sender=self.user,
            content=content,
            message_type=message_type
        )
        
        return {
            'id': message.id,
            'content': message.content,
            'sender': {
                'id': message.sender.id,
                'username': message.sender.username,
            },
            'timestamp': message.timestamp.isoformat(),
            'message_type': message.message_type,
        }


class GroupChatConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for group chat functionality.
    """
    
    async def connect(self):
        self.group_id = self.scope['url_route']['kwargs']['group_id']
        self.user = self.scope["user"]
        
        # Check if user is member of the group
        is_member = await self.check_group_membership()
        
        if not is_member:
            await self.close()
            return
        
        self.room_group_name = f'group_{self.group_id}'
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        # Update user's online status
        await self.update_user_status(True)
        
        await self.accept()
    
    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        
        # Update user's offline status
        await self.update_user_status(False)
    
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message_type = text_data_json['type']
        
        if message_type == 'send_message':
            await self.handle_send_message(text_data_json)
        
        elif message_type == 'typing':
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'user_typing',
                    'user_id': self.user.id,
                    'username': self.user.username,
                }
            )
        
        elif message_type == 'stop_typing':
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'user_stop_typing',
                    'user_id': self.user.id,
                }
            )
    
    async def handle_send_message(self, text_data_json):
        content = text_data_json['content']
        message_type = text_data_json.get('message_type', 'text')
        
        # Create message in group
        message = await self.create_group_message(content, message_type)
        
        if message:
            # Send message to room group
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'new_message',
                    'message': {
                        'id': str(message['id']),
                        'content': message['content'],
                        'sender': {
                            'id': message['sender']['id'],
                            'username': message['sender']['username'],
                        },
                        'timestamp': message['timestamp'],
                        'message_type': message['message_type'],
                    },
                }
            )
    
    async def new_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'new_message',
            'message': event['message'],
        }))
    
    async def user_typing(self, event):
        await self.send(text_data=json.dumps({
            'type': 'typing',
            'user_id': event['user_id'],
            'username': event['username'],
        }))
    
    async def user_stop_typing(self, event):
        await self.send(text_data=json.dumps({
            'type': 'stop_typing',
            'user_id': event['user_id'],
        }))
    
    @database_sync_to_async
    def check_group_membership(self):
        """Check if user is a member of the group."""
        try:
            group = Group.objects.get(id=self.group_id)
            return group.is_member(self.user)
        except Group.DoesNotExist:
            return False
    
    @database_sync_to_async
    def create_group_message(self, content, message_type):
        """Create a new message in the group."""
        try:
            group = Group.objects.get(id=self.group_id)
            
            # Get or create conversation for this group
            conversation = group.conversation
            if not conversation:
                conversation = Conversation.objects.create(
                    conversation_type='group',
                    group=group,
                    title=group.name
                )
            
            # Create message
            message = Message.objects.create(
                conversation=conversation,
                sender=self.user,
                content=content,
                message_type=message_type
            )
            
            return {
                'id': message.id,
                'content': message.content,
                'sender': {
                    'id': message.sender.id,
                    'username': message.sender.username,
                },
                'timestamp': message.timestamp.isoformat(),
                'message_type': message.message_type,
            }
            
        except Group.DoesNotExist:
            return None
    
    async def update_user_status(self, is_online):
        """Update user's online status."""
        cache_key = f'user_online_{self.user.id}'
        if is_online:
            cache.set(cache_key, True, timeout=300)  # 5 minutes
        else:
            cache.delete(cache_key)


class UserStatusConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for user online/offline status tracking.
    """
    
    async def connect(self):
        self.user = self.scope["user"]
        
        # Join user status group
        await self.channel_layer.group_add(
            f'user_status_{self.user.id}',
            self.channel_name
        )
        
        # Update online status
        await self.update_online_status(True)
        
        # Broadcast user's online status to friends/contacts
        await self.broadcast_online_status()
        
        await self.accept()
    
    async def disconnect(self, close_code):
        # Update offline status
        await self.update_online_status(False)
        
        # Broadcast user's offline status
        await self.broadcast_offline_status()
        
        # Leave user status group
        await self.channel_layer.group_discard(
            f'user_status_{self.user.id}',
            self.channel_name
        )
    
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        status_type = text_data_json.get('type')
        
        if status_type == 'get_friends_status':
            friends_status = await self.get_friends_online_status()
            await self.send(text_data=json.dumps({
                'type': 'friends_status',
                'friends': friends_status,
            }))
    
    async def user_online(self, event):
        await self.send(text_data=json.dumps({
            'type': 'user_online',
            'user_id': event['user_id'],
            'username': event['username'],
        }))
    
    async def user_offline(self, event):
        await self.send(text_data=json.dumps({
            'type': 'user_offline',
            'user_id': event['user_id'],
        }))
    
    @database_sync_to_async
    def update_online_status(self, is_online):
        """Update user's online status in cache and database."""
        cache_key = f'user_online_{self.user.id}'
        
        if is_online:
            cache.set(cache_key, True, timeout=300)  # 5 minutes timeout
            # Update last seen
            self.user.last_seen = timezone.now()
            self.user.save(update_fields=['last_seen'])
        else:
            cache.delete(cache_key)
            # Update last seen
            self.user.last_seen = timezone.now()
            self.user.save(update_fields=['last_seen'])
    
    @database_sync_to_async
    def broadcast_online_status(self):
        """Broadcast user's online status to their contacts."""
        # Get user's conversations and groups
        conversations = Conversation.objects.filter(
            participants=self.user
        ).select_related()
        
        groups = Group.objects.filter(
            members__user=self.user,
            members__status='active'
        ).select_related()
        
        # Broadcast to all participants in individual conversations
        for conversation in conversations:
            if conversation.conversation_type == 'individual':
                for participant in conversation.participants.exclude(id=self.user.id):
                    asyncio.create_task(self.send_status_to_user(
                        participant.id,
                        'user_online',
                        {
                            'user_id': self.user.id,
                            'username': self.user.username,
                        }
                    ))
        
        # Broadcast to all group members
        for group in groups:
            asyncio.create_task(self.send_status_to_group(
                group.id,
                'user_online',
                {
                    'user_id': self.user.id,
                    'username': self.user.username,
                }
            ))
    
    @database_sync_to_async
    def broadcast_offline_status(self):
        """Broadcast user's offline status to their contacts."""
        # Similar to broadcast_online_status but with offline status
        conversations = Conversation.objects.filter(
            participants=self.user
        ).select_related()
        
        groups = Group.objects.filter(
            members__user=self.user,
            members__status='active'
        ).select_related()
        
        for conversation in conversations:
            if conversation.conversation_type == 'individual':
                for participant in conversation.participants.exclude(id=self.user.id):
                    asyncio.create_task(self.send_status_to_user(
                        participant.id,
                        'user_offline',
                        {'user_id': self.user.id}
                    ))
        
        for group in groups:
            asyncio.create_task(self.send_status_to_group(
                group.id,
                'user_offline',
                {'user_id': self.user.id}
            ))
    
    async def send_status_to_user(self, user_id, status_type, data):
        """Send status update to a specific user."""
        await self.channel_layer.group_send(
            f'user_status_{user_id}',
            {
                'type': status_type,
                **data,
            }
        )
    
    async def send_status_to_group(self, group_id, status_type, data):
        """Send status update to a group."""
        await self.channel_layer.group_send(
            f'group_{group_id}',
            {
                'type': status_type,
                **data,
            }
        )
    
    @database_sync_to_async
    def get_friends_online_status(self):
        """Get online status of user's friends/contacts."""
        friends_status = []
        
        # Get users from conversations
        conversations = Conversation.objects.filter(
            participants=self.user
        ).select_related()
        
        contacted_users = set()
        for conversation in conversations:
            if conversation.conversation_type == 'individual':
                for participant in conversation.participants.exclude(id=self.user.id):
                    contacted_users.add(participant.id)
        
        # Get online status from cache
        for user_id in contacted_users:
            cache_key = f'user_online_{user_id}'
            is_online = cache.get(cache_key, False)
            
            if is_online:
                try:
                    user = User.objects.get(id=user_id)
                    friends_status.append({
                        'user_id': user_id,
                        'username': user.username,
                        'is_online': True,
                    })
                except User.DoesNotExist:
                    continue
        
        return friends_status


class AdminMonitorConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for admin monitoring and real-time updates.
    """
    
    async def connect(self):
        self.user = self.scope["user"]
        
        # Check if user is admin
        if not self.user.is_staff:
            await self.close()
            return
        
        # Join admin monitoring group
        await self.channel_layer.group_add(
            'admin_monitor',
            self.channel_name
        )
        
        await self.accept()
    
    async def disconnect(self, close_code):
        # Leave admin monitoring group
        await self.channel_layer.group_discard(
            'admin_monitor',
            self.channel_name
        )
    
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        # Handle admin-specific messages if needed
    
    async def system_notification(self, event):
        await self.send(text_data=json.dumps({
            'type': 'system_notification',
            'message': event['message'],
            'level': event.get('level', 'info'),
        }))
    
    async def user_activity(self, event):
        await self.send(text_data=json.dumps({
            'type': 'user_activity',
            'activity': event['activity'],
        }))
    
    async def chat_statistics(self, event):
        await self.send(text_data=json.dumps({
            'type': 'chat_statistics',
            'statistics': event['statistics'],
        }))