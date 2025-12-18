#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Test script to verify username display fix in chat list
"""
import os
import django
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'offchat_backend.settings.development')
django.setup()

from django.contrib.auth import get_user_model
from chat.models import Conversation, ConversationParticipant
from chat.serializers import ConversationSerializer

User = get_user_model()

def test_username_display():
    """Test that usernames are properly displayed in conversations"""
    
    print("=" * 60)
    print("Testing Username Display Fix")
    print("=" * 60)
    
    # Get all conversations
    conversations = Conversation.objects.filter(
        conversation_type='individual',
        is_deleted=False
    )[:5]
    
    if not conversations.exists():
        print("\n[!] No individual conversations found. Creating test data...")
        
        # Create test users if needed
        users = User.objects.filter(is_active=True)[:2]
        if len(users) < 2:
            print("[X] Not enough users in database")
            return False
        
        user1, user2 = users[0], users[1]
        conv = Conversation.objects.create(
            conversation_type='individual',
            title=f"Chat between {user1.username} and {user2.username}"
        )
        conv.add_participant(user1)
        conv.add_participant(user2)
        conversations = [conv]
    
    print(f"\n[OK] Found {conversations.count()} conversations\n")
    
    all_pass = True
    for i, conv in enumerate(conversations, 1):
        print(f"Conversation {i}:")
        print(f"  ID: {conv.id}")
        print(f"  Type: {conv.conversation_type}")
        
        # Serialize the conversation
        serializer = ConversationSerializer(conv)
        data = serializer.data
        
        participants = data.get('participants', [])
        print(f"  Participants: {len(participants)}")
        
        for j, participant in enumerate(participants, 1):
            username = participant.get('username', 'MISSING')
            user_id = participant.get('id', 'MISSING')
            
            # Check if username is valid
            is_valid = username and username != 'Unknown User' and username != 'Unknown'
            status = "[OK]" if is_valid else "[X]"
            
            print(f"    {status} Participant {j}: {username} (ID: {user_id})")
            
            if not is_valid:
                all_pass = False
        
        print()
    
    print("=" * 60)
    if all_pass:
        print("[OK] All usernames are displaying correctly!")
        print("[OK] Fix is working as expected")
    else:
        print("[X] Some usernames are still showing as 'Unknown'")
        print("[X] Fix may need adjustment")
    print("=" * 60)
    
    return all_pass

if __name__ == '__main__':
    success = test_username_display()
    sys.exit(0 if success else 1)
