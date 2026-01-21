"""
Views for users app.
"""
from rest_framework import status, permissions, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate, get_user_model
from django.db.models import Q, Count, Avg
from django.utils import timezone
from datetime import timedelta
from django_filters.rest_framework import DjangoFilterBackend
from users.models import UserSession, UserActivity, BlacklistedToken
from users.serializers import (
    UserSerializer, UserListSerializer, UserCreateSerializer,
    UserProfileUpdateSerializer, UserSessionSerializer,
    UserActivitySerializer, UserStatisticsSerializer
)

User = get_user_model()


class IsAdminOrOwner(permissions.BasePermission):
    """
    Permission that allows admin users or the user themselves to access.
    """
    
    def has_object_permission(self, request, view, obj):
        return request.user.is_authenticated and (
            request.user.is_staff or
            request.user.role == 'admin' or
            obj.id == request.user.id
        )


class IsAdminUser(permissions.BasePermission):
    """
    Permission that only allows admin users.
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        # Check both is_staff and role='admin'
        is_staff = getattr(request.user, 'is_staff', False)
        is_admin_role = getattr(request.user, 'role', None) == 'admin'
        return is_staff or is_admin_role


class RegisterView(APIView):
    """User registration view."""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        from users.auth_views import validate_signup_input
        
        try:
            username = request.data.get('username', '').strip()
            email = request.data.get('email', '').strip()
            password = request.data.get('password', '').strip()
            
            # Validate input
            is_valid, error_msg = validate_signup_input(username, email, password)
            if not is_valid:
                return Response(
                    {'error': error_msg},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create user with generated email if not provided
            user_email = email if email else f"{username}@offchat.local"
            
            user = User.objects.create_user(
                username=username,
                email=user_email,
                password=password,
                status='active'
            )
            
            # Generate tokens
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'user': UserSerializer(user).data,
                'tokens': {
                    'access': str(refresh.access_token),
                    'refresh': str(refresh)
                }
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'error': 'Signup failed'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class LoginView(APIView):
    """User login view."""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        from users.auth_views import validate_login_input
        
        try:
            username = request.data.get('username', '').strip()
            password = request.data.get('password', '').strip()
            
            # Validate input
            is_valid, error_msg = validate_login_input(username, password)
            if not is_valid:
                return Response(
                    {'error': error_msg},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Authenticate user
            user = authenticate(username=username, password=password)
            if not user:
                return Response(
                    {'error': 'Invalid credentials'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            # Check if user is active
            if not user.is_active:
                return Response(
                    {'error': 'Account is inactive'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Check if user is pending approval
            if user.status == 'pending':
                return Response(
                    {'error': 'Your account is pending admin approval'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Check if user is suspended or banned
            if user.status in ['suspended', 'banned']:
                return Response(
                    {'error': f'Your account is {user.status}'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Mark user online
            from users.services.simple_online_status import mark_user_online
            mark_user_online(user.id)
            
            # Generate tokens
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'user': UserSerializer(user).data,
                'tokens': {
                    'access': str(refresh.access_token),
                    'refresh': str(refresh)
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': 'Login failed'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class LogoutView(APIView):
    """User logout view."""
    
    def post(self, request):
        try:
            # Get the authorization header
            auth_header = request.META.get('HTTP_AUTHORIZATION', '')
            if auth_header.startswith('Bearer '):
                access_token = auth_header.split(' ')[1]
                
                # Blacklist the access token
                from rest_framework_simplejwt.tokens import UntypedToken
                from django.utils import timezone
                from datetime import timedelta
                
                try:
                    # Parse the token to get expiration
                    untyped_token = UntypedToken(access_token)
                    exp_timestamp = untyped_token['exp']
                    exp_datetime = timezone.datetime.fromtimestamp(exp_timestamp, tz=timezone.utc)
                    
                    # Add access token to blacklist
                    BlacklistedToken.blacklist_token(
                        token=access_token,
                        user=request.user,
                        token_type='access',
                        expires_at=exp_datetime
                    )
                except Exception:
                    # If token parsing fails, just continue without blacklisting
                    pass
            
            # Handle refresh token blacklisting
            refresh_token = request.data.get('refresh_token')
            if refresh_token:
                try:
                    from rest_framework_simplejwt.tokens import RefreshToken
                    refresh = RefreshToken(refresh_token)
                    exp_timestamp = refresh['exp']
                    exp_datetime = timezone.datetime.fromtimestamp(exp_timestamp, tz=timezone.utc)
                    
                    # Add refresh token to blacklist
                    BlacklistedToken.blacklist_token(
                        token=refresh_token,
                        user=request.user,
                        token_type='refresh',
                        expires_at=exp_datetime
                    )
                except Exception:
                    # If refresh token parsing fails, just continue
                    pass
            
            # Update user's online status
            from users.services.simple_online_status import mark_user_offline
            mark_user_offline(request.user.id)
            
            # Log user activity
            UserActivity.objects.create(
                user=request.user,
                action='logout',
                description='User logged out',
                ip_address=self.get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            
            return Response({
                'message': 'Logout successful'
            }, status=status.HTTP_200_OK)
        
        except Exception as e:
            return Response({
                'error': 'Logout failed'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class UserProfileView(APIView):
    """User profile view."""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def put(self, request):
        serializer = UserProfileUpdateSerializer(
            request.user, 
            data=request.data, 
            partial=True
        )
        if serializer.is_valid():
            serializer.save()
            
            # Log user activity
            UserActivity.objects.create(
                user=request.user,
                action='profile_updated',
                description='User profile updated',
                ip_address=self.get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class UserAvatarView(APIView):
    """User avatar view."""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        if 'avatar' not in request.FILES:
            return Response({
                'error': 'No avatar file provided'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        avatar_file = request.FILES['avatar']
        
        # Validate file type
        if not avatar_file.content_type.startswith('image/'):
            return Response({
                'error': 'Only image files are allowed'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate file size (5MB limit)
        if avatar_file.size > 5 * 1024 * 1024:
            return Response({
                'error': 'File size cannot exceed 5MB'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Save avatar
        request.user.avatar = avatar_file
        request.user.save()
        
        # Log user activity
        UserActivity.objects.create(
            user=request.user,
            action='profile_updated',
            description='Avatar updated',
            ip_address=self.get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        
        serializer = UserSerializer(request.user)
        return Response({
            'user': serializer.data,
            'message': 'Avatar updated successfully'
        }, status=status.HTTP_200_OK)
    
    def delete(self, request):
        if request.user.avatar:
            request.user.avatar.delete()
            request.user.avatar = None
            request.user.save()
            
            # Log user activity
            UserActivity.objects.create(
                user=request.user,
                action='profile_updated',
                description='Avatar deleted',
                ip_address=self.get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            
            return Response({
                'message': 'Avatar deleted successfully'
            }, status=status.HTTP_200_OK)
        
        return Response({
            'error': 'No avatar to delete'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class UserActivityView(APIView):
    """User activity view."""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        activities = UserActivity.objects.filter(user=request.user).order_by('-timestamp')
        
        # Apply pagination
        from rest_framework.pagination import PageNumberPagination
        paginator = PageNumberPagination()
        paginator.page_size = 20
        result_page = paginator.paginate_queryset(activities, request)
        
        serializer = UserActivitySerializer(result_page, many=True)
        return paginator.get_paginated_response(serializer.data)


class UserStatisticsView(APIView):
    """User statistics view."""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # Calculate statistics
        from chat.models import Conversation, Group
        
        total_messages = user.sent_messages.filter(is_deleted=False).count()
        total_conversations = user.conversations.filter(is_deleted=False).count()
        total_groups = user.group_memberships.filter(status='active').count()
        
        # Calculate daily message average (last 30 days)
        from datetime import datetime, timedelta
        thirty_days_ago = timezone.now() - timedelta(days=30)
        recent_messages = user.sent_messages.filter(
            timestamp__gte=thirty_days_ago,
            is_deleted=False
        ).count()
        daily_message_average = recent_messages / 30 if recent_messages > 0 else 0
        
        # Weekly activity (last 7 days)
        weekly_activity = {}
        for i in range(7):
            day = timezone.now() - timedelta(days=i)
            day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day_start + timedelta(days=1)
            day_count = user.sent_messages.filter(
                timestamp__gte=day_start,
                timestamp__lt=day_end,
                is_deleted=False
            ).count()
            weekly_activity[day.strftime('%A')] = day_count
        
        # Monthly activity (last 12 months)
        monthly_activity = {}
        for i in range(12):
            month_start = timezone.now().replace(day=1) - timedelta(days=30*i)
            month_end = (month_start + timedelta(days=32)).replace(day=1)
            month_count = user.sent_messages.filter(
                timestamp__gte=month_start,
                timestamp__lt=month_end,
                is_deleted=False
            ).count()
            monthly_activity[month_start.strftime('%B %Y')] = month_count
        
        statistics_data = {
            'total_messages': total_messages,
            'total_conversations': total_conversations,
            'total_groups': total_groups,
            'member_since': user.join_date,
            'last_activity': user.last_seen,
            'online_status': user.online_status,
            'daily_message_average': round(daily_message_average, 2),
            'weekly_activity': weekly_activity,
            'monthly_activity': monthly_activity,
        }
        
        serializer = UserStatisticsSerializer(statistics_data)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AdminUserListView(APIView):
    """Admin user list view."""
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    
    def get(self, request):
        # Get query parameters for filtering and pagination
        status_filter = request.query_params.get('status', None)
        role_filter = request.query_params.get('role', None)
        search = request.query_params.get('search', None)
        
        queryset = User.objects.all()
        
        # Apply filters
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        if role_filter:
            queryset = queryset.filter(role=role_filter)
        
        if search:
            queryset = queryset.filter(
                Q(username__icontains=search) |
                Q(email__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)
            )
        
        # Apply pagination
        from rest_framework.pagination import PageNumberPagination
        paginator = PageNumberPagination()
        paginator.page_size = 20
        result_page = paginator.paginate_queryset(queryset.order_by('-created_at'), request)
        
        serializer = UserListSerializer(result_page, many=True)
        return paginator.get_paginated_response(serializer.data)
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class AdminUserDetailView(APIView):
    """Admin user detail view."""
    permission_classes = [IsAdminUser]
    
    def get(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
            serializer = UserSerializer(user)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({
                'error': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)
    
    def put(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
            serializer = UserSerializer(user, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                # Sync is_staff when role is updated
                if 'role' in request.data:
                    user.is_staff = (request.data['role'] == 'admin')
                    user.save()
                return Response(UserSerializer(user).data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            return Response({
                'error': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)
    
    def delete(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
            permanent = request.query_params.get('permanent', 'false').lower() == 'true'
            
            if not permanent:
                # Move to trash
                from users.trash_models import TrashItem
                from users.services.user_management_service import UserManagementService
                user_data = UserManagementService._serialize_user(user)
                TrashItem.objects.create(
                    item_type='user',
                    item_id=user.id,
                    item_data=user_data,
                    deleted_by=request.user,
                    expires_at=timezone.now() + timedelta(days=30)
                )
            
            user.delete()
            
            return Response({
                'message': 'User deleted successfully'
            }, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({
                'error': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminApproveUserView(APIView):
    """Admin approve user view."""
    permission_classes = [IsAdminUser]
    
    def post(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
            user.approve_user()
            
            # Log admin action
            UserActivity.objects.create(
                user=request.user,
                action='admin_action',
                description=f'Approved user {user.username}',
                ip_address=self.get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            
            return Response({
                'message': f'User {user.username} approved successfully'
            }, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({
                'error': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class AdminSuspendUserView(APIView):
    """Admin suspend user view."""
    permission_classes = [IsAdminUser]
    
    def post(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
            user.suspend_user()
            
            # Log admin action
            UserActivity.objects.create(
                user=request.user,
                action='admin_action',
                description=f'Suspended user {user.username}',
                ip_address=self.get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            
            return Response({
                'message': f'User {user.username} suspended successfully'
            }, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({
                'error': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class AdminBanUserView(APIView):
    """Admin ban user view."""
    permission_classes = [IsAdminUser]
    
    def post(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
            user.ban_user()
            
            # Log admin action
            UserActivity.objects.create(
                user=request.user,
                action='admin_action',
                description=f'Banned user {user.username}',
                ip_address=self.get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            
            return Response({
                'message': f'User {user.username} banned successfully'
            }, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({
                'error': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)


class AdminActivateUserView(APIView):
    """Admin activate user view."""
    permission_classes = [IsAdminUser]
    
    def post(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
            user.activate_user()
            
            # Log admin action
            UserActivity.objects.create(
                user=request.user,
                action='admin_action',
                description=f'Activated user {user.username}',
                ip_address=self.get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            
            return Response({
                'message': f'User {user.username} activated successfully'
            }, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({
                'error': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)


class AdminForceLogoutView(APIView):
    """Admin force logout view."""
    permission_classes = [IsAdminUser]
    
    def post(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
            
            # Set user offline
            user.set_offline()
            
            # Invalidate all active sessions
            UserSession.objects.filter(user=user, is_active=True).update(is_active=False)
            
            # Delete all active tokens
            BlacklistedToken.objects.filter(
                user=user, 
                expires_at__gt=timezone.now()
            ).delete()
            
            # Log admin action
            UserActivity.objects.create(
                user=request.user,
                action='admin_action',
                description=f'Force logged out user {user.username}',
                ip_address=self.get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            
            return Response({
                'message': f'User {user.username} force logged out successfully'
            }, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({
                'error': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class AdminUserCreateView(APIView):
    """Admin create/list user view."""
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    
    def get(self, request):
        status_filter = request.query_params.get('status', None)
        role_filter = request.query_params.get('role', None)
        search = request.query_params.get('search', None)
        
        queryset = User.objects.all()
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        if role_filter:
            queryset = queryset.filter(role=role_filter)
        
        if search:
            queryset = queryset.filter(
                Q(username__icontains=search) |
                Q(email__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)
            )
        
        from rest_framework.pagination import PageNumberPagination
        paginator = PageNumberPagination()
        paginator.page_size = 20
        result_page = paginator.paginate_queryset(queryset.order_by('-created_at'), request)
        
        serializer = UserListSerializer(result_page, many=True)
        return paginator.get_paginated_response(serializer.data)
    
    def post(self, request):
        try:
            serializer = UserCreateSerializer(data=request.data)
            if serializer.is_valid():
                user = serializer.save()
                return Response(
                    UserSerializer(user).data,
                    status=status.HTTP_201_CREATED
                )
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
