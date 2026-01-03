"""
Views for chat app.
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


class ConversationListCreateView(APIView):
    """Conversation list and create view."""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        try:
            conversations = Conversation.objects.filter(
                is_deleted=False
            ).filter(
                Q(participants=request.user) |
                Q(conversation_type='group', group__members__user=request.user, group__members__status='active')
            ).distinct().order_by('-last_message_at', '-created_at')
            
            from rest_framework.pagination import PageNumberPagination
            paginator = PageNumberPagination()
            paginator.page_size = 20
            result_page = paginator.paginate_queryset(conversations, request)
            
            serializer = ConversationSerializer(result_page, many=True, context={'request': request})
            return paginator.get_paginated_response(serializer.data)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error fetching conversations: {str(e)}", exc_info=True)
            return Response({
                'error': 'Failed to load conversations',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def post(self, request):
        serializer = ConversationCreateSerializer(
            data=request.data,
            context={'request': request}
        )
        if serializer.is_valid():
            conversation = serializer.save()
            
            # Log user activity
            UserActivity.objects.create(
                user=request.user,
                action='conversation_created',
                description=f'Created {conversation.conversation_type} conversation',
                ip_address=self.get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            
            serializer = ConversationSerializer(conversation, context={'request': request})
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class ConversationDetailView(APIView):
    """Conversation detail view."""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, conversation_id):
        try:
            conversation = Conversation.objects.get(id=conversation_id)
            # Check if user is participant for GET
            if not conversation.is_participant(request.user) and not request.user.is_staff:
                return Response({
                    'error': 'Permission denied'
                }, status=status.HTTP_403_FORBIDDEN)
            
            serializer = ConversationSerializer(conversation, context={'request': request})
            return Response(serializer.data)
        
        except Conversation.DoesNotExist:
            return Response({
                'error': 'Conversation not found'
            }, status=status.HTTP_404_NOT_FOUND)
    
    def put(self, request, conversation_id):
        try:
            conversation = Conversation.objects.get(id=conversation_id)
            # Check if user is participant for PUT
            if not conversation.is_participant(request.user) and not request.user.is_staff:
                return Response({
                    'error': 'Permission denied'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Only allow updating title and description for group conversations
            if conversation.conversation_type == 'group' and conversation.group.can_manage(request.user):
                serializer = ConversationSerializer(conversation, data=request.data, partial=True)
                if serializer.is_valid():
                    serializer.save()
                    return Response(serializer.data)
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response({
                    'error': 'Permission denied or not applicable for individual conversations'
                }, status=status.HTTP_403_FORBIDDEN)
        
        except Conversation.DoesNotExist:
            return Response({
                'error': 'Conversation not found'
            }, status=status.HTTP_404_NOT_FOUND)
    
    def delete(self, request, conversation_id):
        try:
            conversation = Conversation.objects.get(id=conversation_id)
            # Allow deletion if user is staff/admin or participant
            if not (request.user.is_staff or conversation.is_participant(request.user)):
                return Response({
                    'error': 'Permission denied'
                }, status=status.HTTP_403_FORBIDDEN)
            
            conversation.soft_delete()
            
            # Log user activity
            UserActivity.objects.create(
                user=request.user,
                action='conversation_deleted',
                description=f'Deleted {conversation.conversation_type} conversation',
                ip_address=self.get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            
            return Response({
                'message': 'Conversation deleted successfully'
            }, status=status.HTTP_200_OK)
        
        except Conversation.DoesNotExist:
            return Response({
                'error': 'Conversation not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'error': f'Failed to delete conversation: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class MessageListCreateView(APIView):
    """Message list and create view."""
    permission_classes = [permissions.IsAuthenticated, IsConversationParticipant]
    
    def get(self, request, conversation_id):
        try:
            conversation = Conversation.objects.get(id=conversation_id)
            self.check_object_permissions(request, conversation)
            
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
            self.check_object_permissions(request, conversation)
            
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
    permission_classes = [permissions.IsAuthenticated, IsConversationParticipant]
    
    def get(self, request, conversation_id, message_id):
        try:
            conversation = Conversation.objects.get(id=conversation_id)
            self.check_object_permissions(request, conversation)
            
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
            self.check_object_permissions(request, conversation)
            
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
            self.check_object_permissions(request, conversation)
            
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


class MarkAsReadView(APIView):
    """Mark conversation as read view."""
    permission_classes = [permissions.IsAuthenticated, IsConversationParticipant]
    
    def post(self, request, conversation_id):
        try:
            conversation = Conversation.objects.get(id=conversation_id)
            self.check_object_permissions(request, conversation)
            
            # Mark conversation as read for current user
            if conversation.conversation_type == 'group':
                # For group conversations, mark as read in group membership
                try:
                    member = conversation.group.members.get(user=request.user)
                    member.mark_as_read()
                except GroupMember.DoesNotExist:
                    return Response({
                        'error': 'You are not a member of this group'
                    }, status=status.HTTP_403_FORBIDDEN)
            else:
                # For individual conversations, mark as read in participant record
                try:
                    participant = conversation.participants.get(id=request.user.id)
                    participant.mark_as_read()
                except ConversationParticipant.DoesNotExist:
                    return Response({
                        'error': 'You are not a participant in this conversation'
                    }, status=status.HTTP_403_FORBIDDEN)
            
            return Response({
                'message': 'Conversation marked as read'
            }, status=status.HTTP_200_OK)
        
        except Conversation.DoesNotExist:
            return Response({
                'error': 'Conversation not found'
            }, status=status.HTTP_404_NOT_FOUND)


class GroupListCreateView(APIView):
    """Group list and create view."""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        # Get user's groups (both created and member of)
        groups = Group.objects.filter(
            Q(members__user=request.user, members__status='active') |
            Q(created_by=request.user)
        ).filter(is_deleted=False).distinct().order_by('-last_activity', '-created_at')
        
        # Apply pagination
        from rest_framework.pagination import PageNumberPagination
        paginator = PageNumberPagination()
        paginator.page_size = 20
        result_page = paginator.paginate_queryset(groups, request)
        
        serializer = GroupSerializer(result_page, many=True, context={'request': request})
        return paginator.get_paginated_response(serializer.data)
    
    def post(self, request):
        serializer = GroupCreateSerializer(
            data=request.data,
            context={'request': request}
        )
        if serializer.is_valid():
            group = serializer.save()
            
            # Log user activity
            UserActivity.objects.create(
                user=request.user,
                action='group_created',
                description=f'Created group {group.name}',
                ip_address=self.get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            
            serializer = GroupSerializer(group, context={'request': request})
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class GroupDetailView(APIView):
    """Group detail view."""
    permission_classes = [permissions.IsAuthenticated, IsGroupMember]
    
    def get(self, request, group_id):
        try:
            group = Group.objects.get(id=group_id)
            self.check_object_permissions(request, group)
            
            serializer = GroupSerializer(group, context={'request': request})
            return Response(serializer.data)
        
        except Group.DoesNotExist:
            return Response({
                'error': 'Group not found'
            }, status=status.HTTP_404_NOT_FOUND)
    
    def put(self, request, group_id):
        try:
            group = Group.objects.get(id=group_id)
            self.check_object_permissions(request, group)
            
            # Only group admins can update group details
            if not group.can_manage(request.user):
                return Response({
                    'error': 'Only group admins can update group details'
                }, status=status.HTTP_403_FORBIDDEN)
            
            serializer = GroupSerializer(group, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        except Group.DoesNotExist:
            return Response({
                'error': 'Group not found'
            }, status=status.HTTP_404_NOT_FOUND)
    
    def delete(self, request, group_id):
        try:
            group = Group.objects.get(id=group_id)
            self.check_object_permissions(request, group)
            
            # Only group owner can delete group
            if group.created_by != request.user:
                return Response({
                    'error': 'Only group owner can delete group'
                }, status=status.HTTP_403_FORBIDDEN)
            
            group.soft_delete()
            
            # Log user activity
            UserActivity.objects.create(
                user=request.user,
                action='group_deleted',
                description=f'Deleted group {group.name}',
                ip_address=self.get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            
            return Response({
                'message': 'Group deleted successfully'
            }, status=status.HTTP_200_OK)
        
        except Group.DoesNotExist:
            return Response({
                'error': 'Group not found'
            }, status=status.HTTP_404_NOT_FOUND)


class GroupMemberListView(APIView):
    """Group member list view."""
    permission_classes = [permissions.IsAuthenticated, IsGroupMember]
    
    def get(self, request, group_id):
        try:
            group = Group.objects.get(id=group_id)
            self.check_object_permissions(request, group)
            
            # Get all active members of the group
            members = group.members.filter(status='active').order_by('joined_at')
            
            # Apply pagination
            from rest_framework.pagination import PageNumberPagination
            paginator = PageNumberPagination()
            paginator.page_size = 50
            result_page = paginator.paginate_queryset(members, request)
            
            serializer = GroupMemberSerializer(result_page, many=True)
            return paginator.get_paginated_response(serializer.data)
        
        except Group.DoesNotExist:
            return Response({
                'error': 'Group not found'
            }, status=status.HTTP_404_NOT_FOUND)


class GroupMemberManageView(APIView):
    """Group member management view."""
    permission_classes = [permissions.IsAuthenticated, IsGroupMember]
    
    def post(self, request, group_id, user_id):
        try:
            group = Group.objects.get(id=group_id)
            self.check_object_permissions(request, group)
            
            # Only group admins can add members
            if not group.can_manage(request.user):
                return Response({
                    'error': 'Only group admins can add members'
                }, status=status.HTTP_403_FORBIDDEN)
            
            try:
                user_to_add = User.objects.get(id=user_id)
                
                # Check if user is already a member
                if group.is_member(user_to_add):
                    return Response({
                        'error': 'User is already a member of this group'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # Add user to group
                member = group.add_member(user_to_add)
                
                # Log user activity
                UserActivity.objects.create(
                    user=request.user,
                    action='group_member_added',
                    description=f'Added {user_to_add.username} to group {group.name}',
                    ip_address=self.get_client_ip(request),
                    user_agent=request.META.get('HTTP_USER_AGENT', '')
                )
                
                serializer = GroupMemberSerializer(member)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            
            except User.DoesNotExist:
                return Response({
                    'error': 'User not found'
                }, status=status.HTTP_404_NOT_FOUND)
        
        except Group.DoesNotExist:
            return Response({
                'error': 'Group not found'
            }, status=status.HTTP_404_NOT_FOUND)
    
    def delete(self, request, group_id, user_id):
        try:
            group = Group.objects.get(id=group_id)
            self.check_object_permissions(request, group)
            
            # Only group admins can remove members
            if not group.can_manage(request.user):
                return Response({
                    'error': 'Only group admins can remove members'
                }, status=status.HTTP_403_FORBIDDEN)
            
            try:
                user_to_remove = User.objects.get(id=user_id)
                
                # Cannot remove the group owner
                if user_to_remove == group.created_by:
                    return Response({
                        'error': 'Cannot remove the group owner'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # Check if user is a member
                if not group.is_member(user_to_remove):
                    return Response({
                        'error': 'User is not a member of this group'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # Remove user from group
                success = group.remove_member(user_to_remove)
                
                if success:
                    # Log user activity
                    UserActivity.objects.create(
                        user=request.user,
                        action='group_member_removed',
                        description=f'Removed {user_to_remove.username} from group {group.name}',
                        ip_address=self.get_client_ip(request),
                        user_agent=request.META.get('HTTP_USER_AGENT', '')
                    )
                    
                    return Response({
                        'message': 'Member removed successfully'
                    }, status=status.HTTP_200_OK)
                else:
                    return Response({
                        'error': 'Failed to remove member'
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            except User.DoesNotExist:
                return Response({
                    'error': 'User not found'
                }, status=status.HTTP_404_NOT_FOUND)
        
        except Group.DoesNotExist:
            return Response({
                'error': 'Group not found'
            }, status=status.HTTP_404_NOT_FOUND)


class JoinGroupView(APIView):
    """Join group view."""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, group_id):
        try:
            group = Group.objects.get(id=group_id)
            
            # Check if group is not deleted
            if group.is_deleted:
                return Response({
                    'error': 'Group does not exist'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Check if user is already a member
            if group.is_member(request.user):
                return Response({
                    'error': 'You are already a member of this group'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if group is private
            if group.is_private:
                return Response({
                    'error': 'This is a private group. You need an invitation to join.'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Add user to group
            member = group.add_member(request.user)
            
            # Log user activity
            UserActivity.objects.create(
                user=request.user,
                action='group_joined',
                description=f'Joined group {group.name}',
                ip_address=self.get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            
            serializer = GroupMemberSerializer(member)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        except Group.DoesNotExist:
            return Response({
                'error': 'Group not found'
            }, status=status.HTTP_404_NOT_FOUND)


class LeaveGroupView(APIView):
    """Leave group view."""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, group_id):
        try:
            group = Group.objects.get(id=group_id)
            
            # Check if user is a member
            if not group.is_member(request.user):
                return Response({
                    'error': 'You are not a member of this group'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Owner cannot leave their own group
            if request.user == group.created_by:
                return Response({
                    'error': 'Group owner cannot leave their own group. Transfer ownership or delete the group instead.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Remove user from group
            success = group.remove_member(request.user)
            
            if success:
                # Log user activity
                UserActivity.objects.create(
                    user=request.user,
                    action='group_left',
                    description=f'Left group {group.name}',
                    ip_address=self.get_client_ip(request),
                    user_agent=request.META.get('HTTP_USER_AGENT', '')
                )
                
                return Response({
                    'message': 'Left group successfully'
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'error': 'Failed to leave group'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        except Group.DoesNotExist:
            return Response({
                'error': 'Group not found'
            }, status=status.HTTP_404_NOT_FOUND)


class FileUploadView(APIView):
    """File upload view."""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        if 'file' not in request.FILES:
            return Response({
                'file': ['No file provided']
            }, status=status.HTTP_400_BAD_REQUEST)
        
        message_id = request.POST.get('message_id') or request.data.get('message_id')
        if not message_id:
            return Response({
                'file': ['Message ID is required']
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            message = Message.objects.get(id=message_id)
            if not message.conversation.is_participant(request.user):
                return Response({
                    'file': ['Permission denied']
                }, status=status.HTTP_403_FORBIDDEN)
        except Message.DoesNotExist:
            return Response({
                'file': ['Message not found']
            }, status=status.HTTP_404_NOT_FOUND)
        
        file = request.FILES['file']
        
        if file.size > 10 * 1024 * 1024:
            return Response({
                'file': ['File size cannot exceed 10MB']
            }, status=status.HTTP_400_BAD_REQUEST)
        
        allowed_types = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'audio/mpeg', 'audio/wav', 'audio/ogg',
            'video/mp4', 'video/webm', 'video/ogg',
            'application/pdf', 'text/plain',
            'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        ]
        
        if file.content_type not in allowed_types:
            return Response({
                'file': ['File type not allowed']
            }, status=status.HTTP_400_BAD_REQUEST)
        
        file_type = 'image' if file.content_type.startswith('image/') else \
                    'video' if file.content_type.startswith('video/') else \
                    'audio' if file.content_type.startswith('audio/') else \
                    'document' if file.content_type in ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'] else 'other'
        
        attachment = Attachment.objects.create(
            message_id=message_id,
            file=file,
            file_name=file.name,
            file_type=file_type,
            file_size=file.size,
            mime_type=file.content_type
        )
        
        UserActivity.objects.create(
            user=request.user,
            action='file_uploaded',
            description=f'Uploaded file {attachment.file_name}',
            ip_address=self.get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        
        serializer = AttachmentSerializer(attachment)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class AttachmentDetailView(APIView):
    """Attachment detail view."""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, attachment_id):
        try:
            attachment = Attachment.objects.get(id=attachment_id)
            
            # Check if user is participant in the conversation
            if not attachment.message.conversation.is_participant(request.user):
                return Response({
                    'error': 'Permission denied'
                }, status=status.HTTP_403_FORBIDDEN)
            
            serializer = AttachmentSerializer(attachment)
            return Response(serializer.data)
        
        except Attachment.DoesNotExist:
            return Response({
                'error': 'Attachment not found'
            }, status=status.HTTP_404_NOT_FOUND)
    
    def delete(self, request, attachment_id):
        try:
            attachment = Attachment.objects.get(id=attachment_id)
            
            # Check if user is participant in the conversation
            if not attachment.message.conversation.is_participant(request.user):
                return Response({
                    'error': 'Permission denied'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Check if user can delete this attachment (message sender or admin)
            if attachment.message.sender != request.user and not request.user.has_perm('chat.delete_attachment'):
                return Response({
                    'error': 'You can only delete your own attachments or need appropriate permissions'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Delete the file
            if attachment.file:
                attachment.file.delete(save=False)
            
            # Delete the attachment record
            attachment.delete()
            
            # Log user activity
            UserActivity.objects.create(
                user=request.user,
                action='attachment_deleted',
                description=f'Deleted attachment {attachment.file_name}',
                ip_address=self.get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            
            return Response({
                'message': 'Attachment deleted successfully'
            }, status=status.HTTP_200_OK)
        
        except Attachment.DoesNotExist:
            return Response({
                'error': 'Attachment not found'
            }, status=status.HTTP_404_NOT_FOUND)


class SearchView(APIView):
    """Search view."""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        query = request.query_params.get('q', '').strip()
        search_type = request.query_params.get('type', 'all')  # all, conversations, messages, groups, users
        
        if not query:
            return Response({
                'error': 'Search query is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        results = {
            'conversations': [],
            'messages': [],
            'groups': [],
            'users': []
        }
        
        if search_type in ['all', 'conversations']:
            # Search in conversations
            conversations = Conversation.objects.filter(
                is_deleted=False
            ).filter(
                Q(participants=request.user) |
                Q(conversation_type='group', group__members__user=request.user, group__members__status='active')
            ).filter(
                Q(title__icontains=query) |
                Q(description__icontains=query)
            ).distinct()
            
            results['conversations'] = ConversationSerializer(
                conversations[:20], 
                many=True, 
                context={'request': request}
            ).data
        
        if search_type in ['all', 'messages']:
            # Search in messages
            messages = Message.objects.filter(
                conversation__participants=request.user,
                is_deleted=False,
                content__icontains=query
            ).order_by('-timestamp')[:50]
            
            results['messages'] = MessageSerializer(messages, many=True).data
        
        if search_type in ['all', 'groups']:
            # Search in groups
            groups = Group.objects.filter(
                Q(members__user=request.user, members__status='active') |
                Q(created_by=request.user)
            ).filter(
                Q(name__icontains=query) |
                Q(description__icontains=query),
                is_deleted=False
            ).distinct()
            
            results['groups'] = GroupSerializer(
                groups[:20], 
                many=True, 
                context={'request': request}
            ).data
        
        if search_type in ['all', 'users']:
            # Search in users
            users = User.objects.filter(
                Q(username__icontains=query) |
                Q(first_name__icontains=query) |
                Q(last_name__icontains=query) |
                Q(email__icontains=query)
            ).filter(is_active=True)[:20]
            
            from users.serializers import UserSerializer
            results['users'] = UserSerializer(users, many=True).data
        
        return Response({
            'query': query,
            'search_type': search_type,
            'results': results
        })


class UserStatusView(APIView):
    """User status management view."""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Get online status of users."""
        user_ids = request.query_params.getlist('user_ids')
        
        if not user_ids:
            return Response({
                'error': 'user_ids parameter is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        from django.core.cache import cache
        user_statuses = []
        
        for user_id in user_ids:
            try:
                user = User.objects.get(id=user_id)
                cache_key = f'user_online_{user_id}'
                is_online = cache.get(cache_key, False)
                
                user_statuses.append({
                    'user_id': int(user_id),
                    'username': user.username,
                    'is_online': is_online,
                    'last_seen': user.last_seen.isoformat() if user.last_seen else None,
                })
            except User.DoesNotExist:
                continue
        
        return Response({
            'users': user_statuses
        })
    
    def post(self, request):
        """Update user's online status."""
        status_action = request.data.get('action')  # 'online', 'offline', 'away'
        
        if status_action not in ['online', 'offline', 'away']:
            return Response({
                'error': 'Invalid status action'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        from django.core.cache import cache
        
        cache_key = f'user_online_{request.user.id}'
        
        if status_action == 'online':
            cache.set(cache_key, True, timeout=300)  # 5 minutes
        elif status_action == 'away':
            cache.set(cache_key, 'away', timeout=300)  # 5 minutes
        else:  # offline
            cache.delete(cache_key)
        
        # Update user's last_seen
        request.user.last_seen = timezone.now()
        request.user.save(update_fields=['last_seen'])
        
        return Response({
            'message': f'Status updated to {status_action}',
            'status': status_action
        })


class RealTimeNotificationView(APIView):
    """Real-time notification management view."""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Get unread notifications for user."""
        from django.core.cache import cache
        
        cache_key = f'notifications_{request.user.id}'
        notifications = cache.get(cache_key, [])
        
        return Response({
            'notifications': notifications,
            'count': len(notifications)
        })
    
    def post(self, request):
        """Mark notifications as read."""
        notification_ids = request.data.get('notification_ids', [])
        
        from django.core.cache import cache
        cache_key = f'notifications_{request.user.id}'
        notifications = cache.get(cache_key, [])
        
        # Mark notifications as read
        for notification_id in notification_ids:
            for notification in notifications:
                if notification.get('id') == notification_id:
                    notification['read'] = True
                    break
        
        cache.set(cache_key, notifications, timeout=3600)  # 1 hour
        
        return Response({
            'message': 'Notifications marked as read',
            'updated_count': len([n for n in notifications if n.get('read', False)])
        })
    
    def delete(self, request):
        """Clear all notifications."""
        from django.core.cache import cache
        cache_key = f'notifications_{request.user.id}'
        cache.delete(cache_key)
        
        return Response({
            'message': 'All notifications cleared'
        })
