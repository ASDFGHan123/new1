import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'offchat_backend.settings.development')
django.setup()

from chat.models import Conversation
from django.contrib.auth import get_user_model

User = get_user_model()

admin = User.objects.get(username='admin')
naveed = User.objects.get(username='NaveedAhmad')

print(f"Admin: {admin.id}")
print(f"NaveedAhmad: {naveed.id}")

# Create a test conversation
conv = Conversation.objects.create(conversation_type='individual')
conv.add_participant(admin)
conv.add_participant(naveed)

print(f"\nCreated conversation: {conv.id}")
print(f"Participants:")
for p in conv.participants.all():
    print(f"  - {p.id}: {p.username}")
