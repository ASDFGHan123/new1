import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'offchat_backend.settings.development')
django.setup()

from chat.models import Conversation
from chat.serializers import ConversationSerializer
from django.contrib.auth import get_user_model
from django.test import RequestFactory

User = get_user_model()

admin = User.objects.get(username='admin')

# Get the test conversation we just created
conv = Conversation.objects.get(id='1ccf237e-1243-4d73-8f93-221771bd2acf')

print(f"Conversation: {conv.id}")
print(f"All participants:")
for p in conv.participants.all():
    print(f"  - {p.id}: {p.username}")

# Create a mock request
factory = RequestFactory()
request = factory.get('/')
request.user = admin

# Serialize it
serializer = ConversationSerializer(conv, context={'request': request})
data = serializer.data

print(f"\nSerialized participants:")
for p in data.get('participants', []):
    print(f"  - ID: {p['id']}, Username: {p['username']}")
