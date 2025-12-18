import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'offchat_backend.settings.development')
django.setup()

from chat.models import Conversation
from django.contrib.auth import get_user_model

User = get_user_model()

admin = User.objects.get(username='admin')
conv = Conversation.objects.filter(
    participants=admin,
    conversation_type='individual',
    is_deleted=False
).first()

if conv:
    print(f"Conversation: {conv.id}")
    print(f"All participants:")
    for p in conv.participants.all():
        print(f"  - {p.id}: {p.username}")
    
    print(f"\nParticipants excluding admin (ID {admin.id}):")
    for p in conv.participants.exclude(id=admin.id):
        print(f"  - {p.id}: {p.username}")
