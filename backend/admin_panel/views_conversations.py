"""
Admin conversation management views.
"""
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from chat.models import Conversation, Message
from django.db.models import Count, Q
import logging

logger = logging.getLogger(__name__)


class AdminConversationsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get all conversations in the system for admin."""
        try:
            conversations = Conversation.objects.filter(
                is_deleted=False
            ).prefetch_related('participants', 'messages').annotate(
                message_count=Count('messages', filter=Q(messages__is_deleted=False))
            ).order_by('-last_message_at')
            
            data = []
            for conv in conversations:
                participants = list(conv.participants.values('id', 'username', 'email'))
                participant_names = [p['username'] for p in participants]
                
                # Get last message
                last_message = conv.messages.filter(is_deleted=False).order_by('-timestamp').first()
                last_msg_content = last_message.content if last_message else 'No messages'
                
                data.append({
                    'id': str(conv.id),
                    'type': conv.conversation_type,
                    'title': conv.title or ', '.join(participant_names),
                    'participants': len(participants),
                    'participant_names': participant_names,
                    'participant_list': participants,
                    'message_count': conv.message_count,
                    'last_message': last_msg_content,
                    'last_message_at': conv.last_message_at.isoformat() if conv.last_message_at else None,
                    'created_at': conv.created_at.isoformat(),
                    'is_active': conv.conversation_status == 'active',
                    'conversation_status': conv.conversation_status,
                })
            
            return Response({
                'conversations': data,
                'count': len(data)
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error getting admin conversations: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to retrieve conversations', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
