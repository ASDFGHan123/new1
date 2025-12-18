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

# Get admin user
admin = User.objects.get(username='admin')
print(f"Admin user: {admin.id} - {admin.username}")

# Get NON-DELETED conversations for admin
conversations = Conversation.objects.filter(
    participants=admin,
    conversation_type='individual',
    is_deleted=False
)

print(f"\nNon-deleted conversations for admin: {conversations.count()}")

if conversations.exists():
    conv = conversations.first()
    print(f"\nConversation ID: {conv.id}")
    print(f"Is Deleted: {conv.is_deleted}")
    
    # Create a mock request
    factory = RequestFactory()
    request = factory.get('/')
    request.user = admin
    
    # Serialize it
    serializer = ConversationSerializer(conv, context={'request': request})
    data = serializer.data
    
    print(f"\nParticipants from API:")
    for p in data.get('participants', []):
        print(f"  - ID: {p['id']}, Username: {p['username']}")
else:
    print("No non-deleted conversations found for admin")
