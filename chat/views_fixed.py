"""
Views for chat app - FIXED VERSION
"""
from rest_framework import status, permissions, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django.views.decorators.http import require_http_methods
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from django.utils import timezone
from .models import Group, GroupMember, Conversation, Message, Attachment, ConversationParticipant
from .serializers import (
    ConversationSerializer, ConversationCreateSerializer,
    MessageSerializer, MessageCreateSerializer, MessageUpdateSerializer,
    GroupSerializer, GroupCreateSerializer, GroupMemberSerializer,
    AttachmentSerializer, SearchSerializer
)
from users.models import UserActivity, User


class IsConversationParticipant(permissions.BasePermission):
    """
    Permission that checks if user is a participant in the conversation.
    """
    
    def has_object_permission(self, request, view, obj):
        if request.user.is_authenticated:
            return obj.is_participant(request.user) or request.user.is_staff
        return False


class IsGroupMember(permissions.BasePermission):
    """
    Permission that checks if user is a member of the group.
    """
    
    def has_object_permission(self, request, view, obj):
        if request.user.is_authenticated:
            return obj.is_member(request.user)
        return False


class IsGroupAdmin(permissions.BasePermission):
    """
    Permission that checks if user is an admin of the group.
    """
    
    def has_object_permission(self, request, view, obj):
        if request.user.is_authenticated:
            return obj.can_manage(request.user)
        return False


class MessageListCreateView(APIView):
    """Message list and create view."""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, conversation_id):
        try:
            conversation = Conversation.objects.get(id=conversation_id)
            
            # Check if user is participant or staff
            if not conversation.is_participant(request.user) and not request.user.is_staff:
                return Response({
                    'error': 'Permission denied'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Get messages for this conversation
            messages = conversation.messages.filter(is_deleted=False).order_by('-timestamp')
            
            # Apply pagination
            from rest_framework.pagination import PageNumberPagination
            paginator = PageNumberPagination()
            paginator.page_size = 50
            result_page = paginator.paginate_queryset(messages, request)
            
            serializer = MessageSerializer(result_page, many=True)
            return paginator.get_paginated_response(serializer.data)
        
        except Conversation.DoesNotExist:
            return Response({
                'error': 'Conversation not found'
            }, status=status.HTTP_404_NOT_FOUND)
    
    def post(self, request, conversation_id):
        try:
            conversation = Conversation.objects.get(id=conversation_id)
            
            # Check if user is participant or staff
            if not conversation.is_participant(request.user) and not request.user.is_staff:
                return Response({
                    'error': 'Permission denied'
                }, status=status.HTTP_403_FORBIDDEN)
            
            serializer = MessageCreateSerializer(
                data=request.data,
                context={'request': request, 'conversation_id': conversation_id}
            )
            if serializer.is_valid():
                message = serializer.save()
                
                # Log user activity
                UserActivity.objects.create(
                    user=request.user,
                    action='message_sent',
                    description=f'Sent message in {conversation}',
                    ip_address=self.get_client_ip(request),
                    user_agent=request.META.get('HTTP_USER_AGENT', '')
                )
                
                serializer = MessageSerializer(message)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        except Conversation.DoesNotExist:
            return Response({
                'error': 'Conversation not found'
            }, status=status.HTTP_404_NOT_FOUND)
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class MessageDetailView(APIView):
    """Message detail view."""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, conversation_id, message_id):
        try:
            conversation = Conversation.objects.get(id=conversation_id)
            
            if not conversation.is_participant(request.user) and not request.user.is_staff:
                return Response({
                    'error': 'Permission denied'
                }, status=status.HTTP_403_FORBIDDEN)
            
            message = Message.objects.get(id=message_id, conversation=conversation)
            serializer = MessageSerializer(message)
            return Response(serializer.data)
        
        except (Conversation.DoesNotExist, Message.DoesNotExist):
            return Response({
                'error': 'Message or conversation not found'
            }, status=status.HTTP_404_NOT_FOUND)
    
    def put(self, request, conversation_id, message_id):
        try:
            conversation = Conversation.objects.get(id=conversation_id)
            
            if not conversation.is_participant(request.user) and not request.user.is_staff:
                return Response({
                    'error': 'Permission denied'
                }, status=status.HTTP_403_FORBIDDEN)
            
            message = Message.objects.get(id=message_id, conversation=conversation)
            
            # Check if user can edit this message
            if message.sender != request.user:
                return Response({
                    'error': 'You can only edit your own messages'
                }, status=status.HTTP_403_FORBIDDEN)
            
            serializer = MessageUpdateSerializer(message, data=request.data, context={'request': request})
            if serializer.is_valid():
                updated_message = serializer.save()
                
                # Log user activity
                UserActivity.objects.create(
                    user=request.user,
                    action='message_edited',
                    description=f'Edited message in {conversation}',
                    ip_address=self.get_client_ip(request),
                    user_agent=request.META.get('HTTP_USER_AGENT', '')
                )
                
                serializer = MessageSerializer(updated_message)
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        except (Conversation.DoesNotExist, Message.DoesNotExist):
            return Response({
                'error': 'Message or conversation not found'
            }, status=status.HTTP_404_NOT_FOUND)
    
    def delete(self, request, conversation_id, message_id):
        try:
            conversation = Conversation.objects.get(id=conversation_id)
            
            if not conversation.is_participant(request.user) and not request.user.is_staff:
                return Response({
                    'error': 'Permission denied'
                }, status=status.HTTP_403_FORBIDDEN)
            
            message = Message.objects.get(id=message_id, conversation=conversation)
            
            # Check if user can delete this message
            if message.sender != request.user and not request.user.has_perm('chat.delete_message'):
                return Response({
                    'error': 'You can only delete your own messages or need appropriate permissions'
                }, status=status.HTTP_403_FORBIDDEN)
            
            message.delete_message()
            
            # Log user activity
            UserActivity.objects.create(
                user=request.user,
                action='message_deleted',
                description=f'Deleted message in {conversation}',
                ip_address=self.get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            
            return Response({
                'message': 'Message deleted successfully'
            }, status=status.HTTP_200_OK)
        
        except (Conversation.DoesNotExist, Message.DoesNotExist):
            return Response({
                'error': 'Message or conversation not found'
            }, status=status.HTTP_404_NOT_FOUND)
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
