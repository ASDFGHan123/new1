"""
Optimized user views with select_related and prefetch_related.
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from django.db.models import Q, Prefetch
from users.models import User
from users.serializers import UserSerializer

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_users_list_optimized(request):
    """Get optimized list of users with minimal queries."""
    try:
        # Single query with select_related for foreign keys
        users = User.objects.all().select_related().only(
            'id', 'username', 'email', 'status', 'role', 'is_active', 'online_status',
            'report_count', 'last_seen', 'created_at'
        ).order_by('-created_at')[:500]
        
        data = [{
            'id': str(u.id),
            'username': u.username,
            'email': u.email,
            'status': u.status,
            'is_active': u.is_active,
            'online_status': u.online_status,
            'role': u.role,
            'report_count': u.report_count,
            'last_seen': u.last_seen.isoformat() if u.last_seen else None,
            'created_at': u.created_at.isoformat() if u.created_at else None,
        } for u in users]
        
        return Response({
            'count': len(data),
            'results': data
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
