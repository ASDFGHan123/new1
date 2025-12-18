import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'offchat_backend.settings.development')
django.setup()

from chat.models import Conversation
from django.contrib.auth import get_user_model

User = get_user_model()

# Get admin user
admin = User.objects.get(username='admin')
print(f"Admin user: {admin.id} - {admin.username}")

# Get a conversation with admin as participant
conv = Conversation.objects.filter(
    participants=admin,
    conversation_type='individual'
).first()

if conv:
    print(f"\nConversation: {conv.id}")
    print(f"All participants:")
    for p in conv.participants.all():
        print(f"  - {p.id}: {p.username}")
    
    print(f"\nParticipants excluding admin:")
    for p in conv.participants.exclude(id=admin.id):
        print(f"  - {p.id}: {p.username}")
else:
    print("No conversation found")
