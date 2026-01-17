import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone
from chat.models import Conversation, Message, Group
from users.models import User


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']
        self.user = self.scope['user']
        self.room_group_name = f'chat_{self.conversation_id}'

        if not self.user.is_authenticated:
            await self.close()
            return

        is_participant = await self.check_participant()
        if not is_participant:
            await self.close()
            return

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()
        await self.update_user_status('online')

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
        await self.update_user_status('offline')

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get('type')

        if message_type == 'chat_message':
            await self.handle_chat_message(data)
        elif message_type == 'typing':
            await self.handle_typing(data)
        elif message_type == 'read_receipt':
            await self.handle_read_receipt(data)

    async def handle_chat_message(self, data):
        content = data.get('content', '')
        if not content.strip():
            return

        message = await self.save_message(content)
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message_id': str(message.id),
                'sender': self.user.username,
                'content': content,
                'timestamp': message.timestamp.isoformat(),
            }
        )

    async def handle_typing(self, data):
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'typing_indicator',
                'user': self.user.username,
                'is_typing': data.get('is_typing', True),
            }
        )

    async def handle_read_receipt(self, data):
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'read_receipt',
                'user': self.user.username,
                'message_id': data.get('message_id'),
            }
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'message_id': event['message_id'],
            'sender': event['sender'],
            'content': event['content'],
            'timestamp': event['timestamp'],
        }))

    async def typing_indicator(self, event):
        await self.send(text_data=json.dumps({
            'type': 'typing_indicator',
            'user': event['user'],
            'is_typing': event['is_typing'],
        }))

    async def read_receipt(self, event):
        await self.send(text_data=json.dumps({
            'type': 'read_receipt',
            'user': event['user'],
            'message_id': event['message_id'],
        }))

    @database_sync_to_async
    def check_participant(self):
        try:
            conversation = Conversation.objects.get(id=self.conversation_id)
            return conversation.is_participant(self.user)
        except Conversation.DoesNotExist:
            return False

    @database_sync_to_async
    def save_message(self, content):
        conversation = Conversation.objects.get(id=self.conversation_id)
        message = Message.objects.create(
            conversation=conversation,
            sender=self.user,
            content=content,
            message_type='text'
        )
        conversation.update_activity()
        self.user.increment_message_count()
        return message

    @database_sync_to_async
    def update_user_status(self, status):
        user = User.objects.get(id=self.user.id)
        if status == 'online':
            user.set_online()
        else:
            user.set_offline()


class GroupConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.group_id = self.scope['url_route']['kwargs']['group_id']
        self.user = self.scope['user']
        self.room_group_name = f'group_{self.group_id}'

        if not self.user.is_authenticated:
            await self.close()
            return

        is_member = await self.check_member()
        if not is_member:
            await self.close()
            return

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get('type')

        if message_type == 'group_message':
            await self.handle_group_message(data)
        elif message_type == 'member_joined':
            await self.handle_member_joined()
        elif message_type == 'member_left':
            await self.handle_member_left()

    async def handle_group_message(self, data):
        content = data.get('content', '')
        if not content.strip():
            return

        message = await self.save_group_message(content)
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'group_message',
                'message_id': str(message.id),
                'sender': self.user.username,
                'content': content,
                'timestamp': message.timestamp.isoformat(),
            }
        )

    async def handle_member_joined(self):
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'member_joined',
                'user': self.user.username,
            }
        )

    async def handle_member_left(self):
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'member_left',
                'user': self.user.username,
            }
        )

    async def group_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'group_message',
            'message_id': event['message_id'],
            'sender': event['sender'],
            'content': event['content'],
            'timestamp': event['timestamp'],
        }))

    async def member_joined(self, event):
        await self.send(text_data=json.dumps({
            'type': 'member_joined',
            'user': event['user'],
        }))

    async def member_left(self, event):
        await self.send(text_data=json.dumps({
            'type': 'member_left',
            'user': event['user'],
        }))

    @database_sync_to_async
    def check_member(self):
        try:
            group = Group.objects.get(id=self.group_id)
            return group.is_member(self.user)
        except Group.DoesNotExist:
            return False

    @database_sync_to_async
    def save_group_message(self, content):
        group = Group.objects.get(id=self.group_id)
        conversation = group.conversation
        message = Message.objects.create(
            conversation=conversation,
            sender=self.user,
            content=content,
            message_type='text'
        )
        conversation.update_activity()
        self.user.increment_message_count()
        return message
