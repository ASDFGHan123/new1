"""
Comprehensive user management service for OffChat application.
Provides user CRUD operations, status management, role management, and analytics.
"""
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from django.contrib.auth import get_user_model
from django.db import models
from django.utils import timezone
from django.core.paginator import Paginator
from django.db.models import Q, Count, Avg, Sum
from django.core.exceptions import ValidationError

# Import User model directly to avoid type annotation issues
try:
    from users.models import User
except ImportError:
    # Fallback to get_user_model if direct import fails
    User = get_user_model()

logger = logging.getLogger(__name__)


class UserManagementService:
    """
    Service for comprehensive user management operations.
    """
    
    @classmethod
    def get_users_list(cls, request_params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Get paginated list of users with filtering and sorting options.
        
        Args:
            request_params: Query parameters including page, per_page, search, filters
            
        Returns:
            Dict containing users list and pagination info
        """
        try:
            # Build base query - include all users regardless of is_active status
            queryset = User.objects.all().select_related()
            
            # Apply search filter
            search = request_params.get('search', '').strip()
            if search:
                queryset = queryset.filter(
                    Q(username__icontains=search) |
                    Q(email__icontains=search) |
                    Q(first_name__icontains=search) |
                    Q(last_name__icontains=search)
                )
            
            # Apply status filter
            status = request_params.get('status')
            if status:
                queryset = queryset.filter(status=status)
            
            # Apply role filter
            role = request_params.get('role')
            if role:
                queryset = queryset.filter(role=role)
            
            # Apply online status filter
            online_status = request_params.get('online_status')
            if online_status:
                queryset = queryset.filter(online_status=online_status)
            
            # Apply date range filters
            date_from = request_params.get('date_from')
            date_to = request_params.get('date_to')
            if date_from:
                queryset = queryset.filter(created_at__date__gte=date_from)
            if date_to:
                queryset = queryset.filter(created_at__date__lte=date_to)
            
            # Apply sorting
            ordering = request_params.get('ordering', '-created_at')
            valid_orderings = [
                '-created_at', 'created_at', '-username', 'username',
                '-last_seen', 'last_seen', '-message_count', 'message_count'
            ]
            if ordering in valid_orderings:
                queryset = queryset.order_by(ordering)
            
            # Paginate results
            page = int(request_params.get('page', 1))
            per_page = int(request_params.get('per_page', 20))
            paginator = Paginator(queryset, per_page)
            
            users_page = paginator.get_page(page)
            
            # Prepare response data
            users_data = []
            for user in users_page:
                user_data = cls._serialize_user(user, include_stats=True)
                users_data.append(user_data)
            
            return {
                'users': users_data,
                'pagination': {
                    'page': users_page.number,
                    'per_page': per_page,
                    'total_pages': paginator.num_pages,
                    'total_count': paginator.count,
                    'has_next': users_page.has_next(),
                    'has_previous': users_page.has_previous(),
                },
                'filters_applied': {
                    'search': search,
                    'status': status,
                    'role': role,
                    'online_status': online_status,
                    'date_from': date_from,
                    'date_to': date_to,
                    'ordering': ordering,
                }
            }
            
        except Exception as e:
            logger.error(f"Error getting users list: {str(e)}")
            raise
    
    @classmethod
    def create_user(cls, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a new user with proper validation.
        
        Args:
            user_data: User data dictionary
            
        Returns:
            Dict with created user data
        """
        try:
            # Extract user fields
            required_fields = ['username', 'email', 'password']
            for field in required_fields:
                if field not in user_data:
                    raise ValidationError(f"Field '{field}' is required")
            
            # Check for duplicate username/email
            if User.objects.filter(username=user_data['username']).exists():
                raise ValidationError("Username already exists")
            
            if User.objects.filter(email=user_data['email']).exists():
                raise ValidationError("Email already exists")
            
            # Create user
            user = User.objects.create_user(
                username=user_data['username'],
                email=user_data['email'],
                password=user_data['password'],
                first_name=user_data.get('first_name', ''),
                last_name=user_data.get('last_name', ''),
                role=user_data.get('role', 'user'),
                status=user_data.get('status', 'active'),
                is_active=user_data.get('is_active', True),
            )
            
            # Update additional fields
            if 'bio' in user_data:
                user.bio = user_data['bio']
            if 'avatar' in user_data:
                user.avatar = user_data['avatar']
            
            user.save()
            
            return cls._serialize_user(user, include_stats=True)
            
        except Exception as e:
            logger.error(f"Error creating user: {str(e)}")
            raise
    
    @classmethod
    def get_user_detail(cls, user_id: int) -> Dict[str, Any]:
        """
        Get detailed user information.
        
        Args:
            user_id: User ID
            
        Returns:
            Dict with user details
        """
        try:
            user = User.objects.get(id=user_id)
            return cls._serialize_user(user, include_detailed_stats=True)
            
        except User.DoesNotExist:
            raise ValidationError("User not found")
    
    @classmethod
    def update_user(cls, user_id: int, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update user information.
        
        Args:
            user_id: User ID
            user_data: Updated user data
            
        Returns:
            Dict with updated user data
        """
        try:
            user = User.objects.get(id=user_id)
            
            # Update allowed fields
            allowed_fields = [
                'first_name', 'last_name', 'bio', 'avatar', 'role', 'status',
                'email', 'is_active'
            ]
            
            for field in allowed_fields:
                if field in user_data:
                    if field == 'email' and user_data[field] != user.email:
                        # Check for email uniqueness
                        if User.objects.filter(email=user_data[field]).exclude(id=user_id).exists():
                            raise ValidationError("Email already exists")
                    setattr(user, field, user_data[field])
            
            # Sync is_staff when role is updated
            if 'role' in user_data:
                user.is_staff = (user_data['role'] == 'admin')
            
            user.save()
            
            return cls._serialize_user(user, include_detailed_stats=True)
            
        except User.DoesNotExist:
            raise ValidationError("User not found")
    
    @classmethod
    def delete_user(cls, user_id: int, permanent: bool = True) -> Dict[str, Any]:
        """
        Delete or deactivate a user.
        
        Args:
            user_id: User ID
            permanent: If True, permanently delete the user (default True)
            
        Returns:
            Dict with deletion result
        """
        try:
            user = User.objects.get(id=user_id)
            
            if permanent:
                # Create trash item before deletion
                from users.trash_models import TrashItem
                user_data = cls._serialize_user(user)
                TrashItem.objects.create(
                    item_type='user',
                    item_id=user.id,
                    item_data=user_data,
                    deleted_by=None,
                    expires_at=timezone.now() + timedelta(days=30)
                )
                user.delete()
                return {'message': 'User permanently deleted', 'deleted': True}
            else:
                user.deactivate_user()
                return {'message': 'User deactivated', 'deactivated': True}
                
        except User.DoesNotExist:
            raise ValidationError("User not found")
    
    @classmethod
    def approve_user(cls, user_id: int) -> Dict[str, Any]:
        """
        Approve a pending user.
        
        Args:
            user_id: User ID
            
        Returns:
            Dict with approval result
        """
        try:
            user = User.objects.get(id=user_id)
            user.approve_user()
            return {'message': 'User approved successfully', 'approved': True}
        except User.DoesNotExist:
            raise ValidationError("User not found")
    
    @classmethod
    def suspend_user(cls, user_id: int, reason: str = '') -> Dict[str, Any]:
        """
        Suspend a user.
        
        Args:
            user_id: User ID
            reason: Suspension reason
            
        Returns:
            Dict with suspension result
        """
        try:
            user = User.objects.get(id=user_id)
            user.suspend_user()
            
            # Log the suspension
            cls._log_user_action(user, 'user_suspended', f'User suspended: {reason}')
            
            return {'message': 'User suspended successfully', 'suspended': True}
        except User.DoesNotExist:
            raise ValidationError("User not found")
    
    @classmethod
    def ban_user(cls, user_id: int, reason: str = '') -> Dict[str, Any]:
        """
        Ban a user.
        
        Args:
            user_id: User ID
            reason: Ban reason
            
        Returns:
            Dict with ban result
        """
        try:
            user = User.objects.get(id=user_id)
            user.ban_user()
            
            # Log the ban
            cls._log_user_action(user, 'user_banned', f'User banned: {reason}')
            
            return {'message': 'User banned successfully', 'banned': True}
        except User.DoesNotExist:
            raise ValidationError("User not found")
    
    @classmethod
    def activate_user(cls, user_id: int) -> Dict[str, Any]:
        """
        Activate a suspended or banned user.
        
        Args:
            user_id: User ID
            
        Returns:
            Dict with activation result
        """
        try:
            user = User.objects.get(id=user_id)
            user.activate_user()
            
            # Log the activation
            cls._log_user_action(user, 'user_activated', 'User activated')
            
            return {'message': 'User activated successfully', 'activated': True}
        except User.DoesNotExist:
            raise ValidationError("User not found")
    
    @classmethod
    def change_user_role(cls, user_id: int, new_role: str) -> Dict[str, Any]:
        """
        Change user role.
        
        Args:
            user_id: User ID
            new_role: New role
            
        Returns:
            Dict with role change result
        """
        try:
            user = User.objects.get(id=user_id)
            old_role = user.role
            
            if new_role not in dict(User.ROLE_CHOICES):
                raise ValidationError("Invalid role")
            
            user.role = new_role
            user.is_staff = (new_role == 'admin')
            user.save()
            
            # Log the role change
            cls._log_user_action(user, 'role_changed', f'Role changed from {old_role} to {new_role}')
            
            return {
                'message': 'User role updated successfully',
                'old_role': old_role,
                'new_role': new_role,
                'is_staff': user.is_staff
            }
        except User.DoesNotExist:
            raise ValidationError("User not found")
    
    @classmethod
    def bulk_update_users(cls, user_ids: List[int], action: str, **kwargs) -> Dict[str, Any]:
        """
        Perform bulk operations on multiple users.
        
        Args:
            user_ids: List of user IDs
            action: Action to perform ('activate', 'deactivate', 'approve', 'suspend', 'ban', 'change_role')
            **kwargs: Additional parameters for the action
            
        Returns:
            Dict with bulk operation results
        """
        try:
            users = User.objects.filter(id__in=user_ids)
            updated_count = 0
            errors = []
            
            for user in users:
                try:
                    if action == 'activate':
                        user.activate_user()
                    elif action == 'deactivate':
                        user.deactivate_user()
                    elif action == 'approve':
                        user.approve_user()
                    elif action == 'suspend':
                        user.suspend_user()
                    elif action == 'ban':
                        user.ban_user()
                    elif action == 'change_role':
                        new_role = kwargs.get('new_role')
                        if new_role:
                            user.role = new_role
                            user.is_staff = (new_role == 'admin')
                            user.save()
                    else:
                        errors.append(f"Unknown action: {action}")
                        continue
                    
                    updated_count += 1
                    
                except Exception as e:
                    errors.append(f"Error updating user {user.username}: {str(e)}")
            
            return {
                'message': f'Bulk operation completed',
                'action': action,
                'total_users': len(user_ids),
                'updated_count': updated_count,
                'errors': errors
            }
            
        except Exception as e:
            logger.error(f"Error in bulk update: {str(e)}")
            raise
    
    @classmethod
    def get_user_statistics(cls) -> Dict[str, Any]:
        """
        Get comprehensive user statistics.
        
        Returns:
            Dict with user statistics
        """
        try:
            # Basic counts
            total_users = User.objects.count()
            active_users = User.objects.filter(status='active').count()
            pending_users = User.objects.filter(status='pending').count()
            suspended_users = User.objects.filter(status='suspended').count()
            banned_users = User.objects.filter(status='banned').count()
            
            # Users by role
            users_by_role = dict(
                User.objects.values('role').annotate(count=Count('id')).values_list('role', 'count')
            )
            
            # Users by status
            users_by_status = dict(
                User.objects.values('status').annotate(count=Count('id')).values_list('status', 'count')
            )
            
            # Online users
            online_users = User.objects.filter(online_status='online').count()
            
            # Recent activity
            last_24h = timezone.now() - timedelta(days=1)
            new_users_24h = User.objects.filter(created_at__gte=last_24h).count()
            
            # Message statistics
            total_messages = User.objects.aggregate(total=Sum('message_count'))['total'] or 0
            avg_messages_per_user = User.objects.aggregate(avg=Avg('message_count'))['avg'] or 0
            
            # Activity trends (last 30 days)
            last_30_days = timezone.now() - timedelta(days=30)
            users_30_days = User.objects.filter(created_at__gte=last_30_days).count()
            
            return {
                'total_users': total_users,
                'active_users': active_users,
                'pending_users': pending_users,
                'suspended_users': suspended_users,
                'banned_users': banned_users,
                'online_users': online_users,
                'new_users_24h': new_users_24h,
                'users_by_role': users_by_role,
                'users_by_status': users_by_status,
                'total_messages': total_messages,
                'average_messages_per_user': round(avg_messages_per_user, 2),
                'new_users_last_30_days': users_30_days,
                'active_ratio': round((active_users / total_users) * 100, 2) if total_users > 0 else 0,
                'online_ratio': round((online_users / total_users) * 100, 2) if total_users > 0 else 0,
            }
            
        except Exception as e:
            logger.error(f"Error getting user statistics: {str(e)}")
            raise
    
    @classmethod
    def _serialize_user(cls, user: User, include_stats: bool = False, include_detailed_stats: bool = False) -> Dict[str, Any]:
        """
        Serialize user object to dictionary.
        
        Args:
            user: User object
            include_stats: Whether to include basic stats
            include_detailed_stats: Whether to include detailed stats
            
        Returns:
            Dict with user data
        """
        user_data = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'full_name': user.full_name,
            'bio': user.bio,
            'role': user.role,
            'status': user.status,
            'online_status': user.online_status,
            'is_active': user.is_active,
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser,
            'email_verified': user.email_verified,
            'message_count': user.message_count,
            'report_count': user.report_count,
            'join_date': user.join_date.isoformat() if user.join_date else None,
            'last_seen': user.last_seen.isoformat() if user.last_seen else None,
            'created_at': user.created_at.isoformat() if user.created_at else None,
            'updated_at': user.updated_at.isoformat() if user.updated_at else None,
        }
        
        # Add avatar URL if exists
        if user.avatar:
            user_data['avatar_url'] = user.avatar.url
        
        # Add stats if requested
        if include_stats:
            user_data['stats'] = {
                'days_since_join': (timezone.now().date() - user.join_date.date()).days,
                'is_approved': user.is_approved,
                'is_online': user.is_online,
            }
        
        # Add detailed stats if requested
        if include_detailed_stats:
            user_data['detailed_stats'] = {
                'conversation_count': user.conversations.count(),
                'group_memberships': user.group_memberships.filter(status='active').count(),
                'activities_count': user.activities.count(),
                'sessions_count': user.sessions.filter(is_active=True).count(),
            }
        
        return user_data
    
    @classmethod
    def _log_user_action(cls, user: User, action: str, description: str) -> None:
        """
        Log user action for audit purposes.
        
        Args:
            user: User object
            action: Action performed
            description: Action description
        """
        try:
            from users.models import UserActivity
            UserActivity.objects.create(
                user=user,
                action=action,
                description=description
            )
        except Exception as e:
            logger.error(f"Error logging user action: {str(e)}")
    
    @classmethod
    def get_user_activities(cls, user_id: int, page: int = 1, per_page: int = 20) -> Dict[str, Any]:
        """
        Get user activity history.
        
        Args:
            user_id: User ID
            page: Page number
            per_page: Items per page
            
        Returns:
            Dict with user activities and pagination
        """
        try:
            from users.models import UserActivity
            
            activities = UserActivity.objects.filter(user_id=user_id).order_by('-timestamp')
            
            paginator = Paginator(activities, per_page)
            activities_page = paginator.get_page(page)
            
            activities_data = []
            for activity in activities_page:
                activities_data.append({
                    'id': activity.id,
                    'action': activity.action,
                    'description': activity.description,
                    'ip_address': activity.ip_address,
                    'user_agent': activity.user_agent,
                    'timestamp': activity.timestamp,
                })
            
            return {
                'activities': activities_data,
                'pagination': {
                    'page': activities_page.number,
                    'per_page': per_page,
                    'total_pages': paginator.num_pages,
                    'total_count': paginator.count,
                    'has_next': activities_page.has_next(),
                    'has_previous': activities_page.has_previous(),
                }
            }
            
        except Exception as e:
            logger.error(f"Error getting user activities: {str(e)}")
            raise
    
    @classmethod
    def set_user_online_status(cls, user_id: int, status: str) -> Dict[str, Any]:
        """
        Set user online status.
        
        Args:
            user_id: User ID
            status: Online status ('online', 'away', 'offline')
            
        Returns:
            Dict with updated user data
        """
        try:
            user = User.objects.get(id=user_id)
            
            if status not in dict(User.ONLINE_STATUS_CHOICES):
                raise ValidationError(f"Invalid online status: {status}")
            
            if status == 'online':
                user.set_online()
            elif status == 'away':
                user.set_away()
            elif status == 'offline':
                user.set_offline()
            
            return {
                'message': f'User online status updated to {status}',
                'user_id': user.id,
                'online_status': user.online_status,
                'last_seen': user.last_seen.isoformat() if user.last_seen else None,
            }
            
        except User.DoesNotExist:
            raise ValidationError("User not found")
    
    @classmethod
    def get_online_users(cls, page: int = 1, per_page: int = 50) -> Dict[str, Any]:
        """
        Get list of online users.
        
        Args:
            page: Page number
            per_page: Items per page
            
        Returns:
            Dict with online users and pagination
        """
        try:
            queryset = User.objects.filter(online_status='online').order_by('-last_seen')
            
            paginator = Paginator(queryset, per_page)
            users_page = paginator.get_page(page)
            
            users_data = [cls._serialize_user(user) for user in users_page]
            
            return {
                'online_users': users_data,
                'online_count': queryset.count(),
                'pagination': {
                    'page': users_page.number,
                    'per_page': per_page,
                    'total_pages': paginator.num_pages,
                    'total_count': paginator.count,
                    'has_next': users_page.has_next(),
                    'has_previous': users_page.has_previous(),
                }
            }
            
        except Exception as e:
            logger.error(f"Error getting online users: {str(e)}")
            raise
    
    @classmethod
    def get_user_online_status(cls, user_id: int) -> Dict[str, Any]:
        """
        Get user online status.
        
        Args:
            user_id: User ID
            
        Returns:
            Dict with user online status info
        """
        try:
            user = User.objects.get(id=user_id)
            
            return {
                'user_id': user.id,
                'username': user.username,
                'online_status': user.online_status,
                'last_seen': user.last_seen.isoformat() if user.last_seen else None,
                'is_online': user.is_online,
            }
            
        except User.DoesNotExist:
            raise ValidationError("User not found")