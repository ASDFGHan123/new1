from __future__ import annotations

from typing import Any, Dict, List, Tuple

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from users.serializers import UserSerializer
from users.views import IsAdminUser

User = get_user_model()


def _parse_options(options: Any) -> Dict[str, bool]:
    if not isinstance(options, dict):
        return {}
    parsed: Dict[str, bool] = {}
    for k, v in options.items():
        parsed[str(k)] = bool(v)
    return parsed


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def export_user_data_view(request):
    user_id = request.data.get('user_id')
    options = _parse_options(request.data.get('options'))

    if not user_id:
        return Response({'error': 'user_id is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        target_user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    selected = {
        'profile': bool(options.get('profile')),
        'messages': bool(options.get('messages')),
        'activity': bool(options.get('activity')),
        'connections': bool(options.get('connections')),
    }

    unsupported: List[str] = []
    exported: Dict[str, Any] = {
        'user_id': str(target_user.id),
        'generated_at': timezone.now().isoformat(),
        'selected': selected,
        'data': {},
        'unsupported': unsupported,
    }

    if selected['profile']:
        exported['data']['profile'] = UserSerializer(target_user).data

    if selected['messages']:
        from chat.models import Message, ConversationParticipant

        message_qs = Message.objects.filter(sender=target_user).order_by('-timestamp')
        messages = list(
            message_qs.values(
                'id',
                'conversation_id',
                'sender_id',
                'content',
                'message_type',
                'reply_to_id',
                'forwarded_from_id',
                'is_edited',
                'edited_at',
                'is_deleted',
                'deleted_at',
                'timestamp',
            )
        )

        conversation_ids = list(
            ConversationParticipant.objects.filter(user=target_user).values_list('conversation_id', flat=True).distinct()
        )

        exported['data']['messages'] = {
            'sent_messages': messages,
            'conversation_ids': [str(cid) for cid in conversation_ids],
            'sent_count': message_qs.count(),
        }

    if selected['activity']:
        from users.models import UserActivity

        activity_qs = UserActivity.objects.filter(user=target_user).order_by('-timestamp')
        activities = list(
            activity_qs.values(
                'action',
                'description',
                'ip_address',
                'user_agent',
                'timestamp',
            )
        )
        exported['data']['activity'] = {
            'activities': activities,
            'count': activity_qs.count(),
        }

    if selected['connections']:
        unsupported.append('connections')

    try:
        from admin_panel.services.audit_logging_service import AuditLoggingService
        from admin_panel.models import AuditLog

        AuditLoggingService.log_admin_action(
            action_type=AuditLog.ActionType.DATA_EXPORTED,
            description=f'User data export: {target_user.username}',
            admin_user=request.user,
            metadata={
                'target_user_id': str(target_user.id),
                'selected': selected,
                'unsupported': unsupported,
            },
            category='data_tools'
        )
    except Exception:
        pass

    return Response(exported, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def delete_user_data_view(request):
    user_id = request.data.get('user_id')
    options = _parse_options(request.data.get('options'))

    if not user_id:
        return Response({'error': 'user_id is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        target_user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    selected = {
        'profile': bool(options.get('profile')),
        'messages': bool(options.get('messages')),
        'activity': bool(options.get('activity')),
        'connections': bool(options.get('connections')),
    }

    deleted_counts: Dict[str, int] = {}
    unsupported: List[str] = []

    if selected['profile']:
        fields_to_clear = ['bio', 'description', 'first_name', 'last_name']
        updates: Dict[str, Any] = {f: '' for f in fields_to_clear}
        User.objects.filter(id=target_user.id).update(**updates)
        deleted_counts['profile_fields_cleared'] = len(fields_to_clear)

    if selected['messages']:
        from chat.models import Message

        now = timezone.now()
        updated = Message.objects.filter(sender=target_user, is_deleted=False).update(is_deleted=True, deleted_at=now)
        deleted_counts['messages_soft_deleted'] = int(updated)

    if selected['activity']:
        from users.models import UserActivity

        deleted = UserActivity.objects.filter(user=target_user).delete()
        deleted_counts['activities_deleted'] = int(deleted[0])

    if selected['connections']:
        unsupported.append('connections')

    try:
        from admin_panel.services.audit_logging_service import AuditLoggingService
        from admin_panel.models import AuditLog

        AuditLoggingService.log_admin_action(
            action_type=AuditLog.ActionType.DATA_DELETED,
            description=f'User data deletion: {target_user.username}',
            admin_user=request.user,
            metadata={
                'target_user_id': str(target_user.id),
                'selected': selected,
                'deleted_counts': deleted_counts,
                'unsupported': unsupported,
            },
            category='data_tools'
        )
    except Exception:
        pass

    return Response(
        {
            'user_id': str(target_user.id),
            'selected': selected,
            'deleted_counts': deleted_counts,
            'unsupported': unsupported,
        },
        status=status.HTTP_200_OK,
    )
