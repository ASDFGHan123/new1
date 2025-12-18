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

# Get a user to use as request.user
user = User.objects.first()
print(f"Current user: {user.id} - {user.username}")

# Create a mock request
factory = RequestFactory()
request = factory.get('/')
request.user = user

# Get conversations for this user
conversations = Conversation.objects.filter(
    participants=user,
    conversation_type='individual'
).first()

if conversations:
    print(f"\nConversation ID: {conversations.id}")
    print(f"Conversation Type: {conversations.conversation_type}")
    
    # Serialize it
    serializer = ConversationSerializer(conversations, context={'request': request})
    data = serializer.data
    
    print(f"\nSerialized Data:")
    print(json.dumps(data, indent=2, default=str))
    
    print(f"\nParticipants from API:")
    for p in data.get('participants', []):
        print(f"  - ID: {p['id']}, Username: {p['username']}")
else:
    print("No individual conversations found")
