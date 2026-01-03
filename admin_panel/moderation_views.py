from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, BasePermission
from django.contrib.auth import get_user_model
from users.serializers import UserSerializer

User = get_user_model()


class IsAdminRole(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'admin'


class PendingUsersViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsAdminRole]
    queryset = User.objects.filter(status='pending').order_by('-created_at')
    serializer_class = UserSerializer
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        try:
            from users.notification_utils import send_notification
            user = self.get_object()
            if user.status != 'pending':
                return Response(
                    {'error': 'User is not pending'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            user.approve_user()
            send_notification(
                user=user,
                notification_type='user_approved',
                title='Account Approved',
                message='Your account has been approved! You can now login.',
                data={'user_id': str(pk)}
            )
            return Response({'status': 'user approved'})
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        try:
            user = self.get_object()
            if user.status != 'pending':
                return Response(
                    {'error': 'User is not pending'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            user.ban_user()
            return Response({'status': 'user rejected'})
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        pending_count = User.objects.filter(status='pending').count()
        return Response({'total': pending_count})
