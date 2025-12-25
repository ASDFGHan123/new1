from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from datetime import timedelta
from .models import FlaggedMessage, UserModeration, ContentReview
from .moderation_serializers import FlaggedMessageSerializer, UserModerationSerializer, ContentReviewSerializer
from django.contrib.auth import get_user_model
from users.views import IsAdminUser

User = get_user_model()


class FlaggedMessageViewSet(viewsets.ModelViewSet):
    queryset = FlaggedMessage.objects.all()
    serializer_class = FlaggedMessageSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = FlaggedMessage.objects.all()
        status_filter = self.request.query_params.get('status')
        reason_filter = self.request.query_params.get('reason')
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if reason_filter:
            queryset = queryset.filter(reason=reason_filter)
        
        return queryset.order_by('-reported_at')
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(reported_by=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        flagged_message = self.get_object()
        notes = request.data.get('notes', '')
        flagged_message.approve(request.user, notes)
        return Response({'status': 'message approved'})
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        flagged_message = self.get_object()
        notes = request.data.get('notes', '')
        flagged_message.reject(request.user, notes)
        return Response({'status': 'message rejected'})
    
    @action(detail=True, methods=['post'])
    def remove(self, request, pk=None):
        flagged_message = self.get_object()
        notes = request.data.get('notes', '')
        flagged_message.remove(request.user, notes)
        return Response({'status': 'message removed'})
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        total = FlaggedMessage.objects.count()
        pending = FlaggedMessage.objects.filter(status='pending').count()
        approved = FlaggedMessage.objects.filter(status='approved').count()
        rejected = FlaggedMessage.objects.filter(status='rejected').count()
        removed = FlaggedMessage.objects.filter(status='removed').count()
        
        return Response({
            'total': total,
            'pending': pending,
            'approved': approved,
            'rejected': rejected,
            'removed': removed
        })


class UserModerationViewSet(viewsets.ModelViewSet):
    queryset = UserModeration.objects.all()
    serializer_class = UserModerationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = UserModeration.objects.all()
        action_type = self.request.query_params.get('action_type')
        status_filter = self.request.query_params.get('status')
        user_id = self.request.query_params.get('user_id')
        
        if action_type:
            queryset = queryset.filter(action_type=action_type)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        return queryset.order_by('-created_at')
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        duration_days = request.data.get('duration_days')
        expires_at = None
        if duration_days:
            expires_at = timezone.now() + timedelta(days=int(duration_days))
        
        moderation = serializer.save(
            moderator=request.user,
            expires_at=expires_at
        )
        
        user = moderation.user
        if moderation.action_type == 'suspend':
            user.suspend_user()
        elif moderation.action_type == 'ban':
            user.ban_user()
        
        return Response(self.get_serializer(moderation).data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def lift(self, request, pk=None):
        moderation = self.get_object()
        moderation.lift()
        
        user = moderation.user
        if moderation.action_type in ['suspend', 'ban']:
            user.activate_user()
        
        return Response({'status': 'moderation lifted'})
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        active_moderations = UserModeration.objects.filter(status='active')
        serializer = self.get_serializer(active_moderations, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        total = UserModeration.objects.count()
        active = UserModeration.objects.filter(status='active').count()
        suspended = UserModeration.objects.filter(action_type='suspend', status='active').count()
        banned = UserModeration.objects.filter(action_type='ban', status='active').count()
        
        return Response({
            'total': total,
            'active': active,
            'suspended': suspended,
            'banned': banned
        })


class PendingUsersViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def list(self, request):
        from users.serializers import UserSerializer
        pending_users = User.objects.filter(status='pending').order_by('-created_at')
        serializer = UserSerializer(pending_users, many=True)
        return Response(serializer.data)
    
    def retrieve(self, request, pk=None):
        from users.serializers import UserSerializer
        try:
            user = User.objects.get(id=pk, status='pending')
            serializer = UserSerializer(user)
            return Response(serializer.data)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        try:
            user = User.objects.get(id=pk)
            if user.status != 'pending':
                return Response(
                    {'error': 'User is not pending'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            user.approve_user()
            return Response({'status': 'user approved'})
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        try:
            user = User.objects.get(id=pk)
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


class ContentReviewViewSet(viewsets.ModelViewSet):
    queryset = ContentReview.objects.all()
    serializer_class = ContentReviewSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = ContentReview.objects.all()
        status_filter = self.request.query_params.get('status')
        content_type = self.request.query_params.get('content_type')
        priority = self.request.query_params.get('priority')
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if content_type:
            queryset = queryset.filter(content_type=content_type)
        if priority:
            queryset = queryset.filter(priority=priority)
        
        return queryset.order_by('-priority', '-created_at')
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(submitted_by=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        review = self.get_object()
        notes = request.data.get('notes', '')
        review.approve(request.user, notes)
        return Response({'status': 'content approved'})
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        review = self.get_object()
        notes = request.data.get('notes', '')
        review.reject(request.user, notes)
        return Response({'status': 'content rejected'})
    
    @action(detail=True, methods=['post'])
    def start_review(self, request, pk=None):
        review = self.get_object()
        review.status = 'in_review'
        review.save()
        return Response({'status': 'review started'})
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        pending_reviews = ContentReview.objects.filter(status='pending').order_by('-priority', '-created_at')
        serializer = self.get_serializer(pending_reviews, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        total = ContentReview.objects.count()
        pending = ContentReview.objects.filter(status='pending').count()
        in_review = ContentReview.objects.filter(status='in_review').count()
        approved = ContentReview.objects.filter(status='approved').count()
        rejected = ContentReview.objects.filter(status='rejected').count()
        
        return Response({
            'total': total,
            'pending': pending,
            'in_review': in_review,
            'approved': approved,
            'rejected': rejected
        })
