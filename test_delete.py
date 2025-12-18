#!/usr/bin/env python
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'offchat_backend.settings.development')
django.setup()

from chat.models import Conversation
import traceback

try:
    conv = Conversation.objects.filter(is_deleted=False).first()
    if conv:
        print(f'Testing soft_delete on {conv.id}')
        print(f'Type: {conv.conversation_type}')
        conv.soft_delete()
        print('Success')
    else:
        print('No conversations found')
except Exception as e:
    print(f'Error: {e}')
    traceback.print_exc()
