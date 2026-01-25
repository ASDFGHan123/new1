from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from users.models import User
from django.contrib.auth.models import Permission

class MyPermissionsView(APIView):
    """Return the current user's admin dashboard permissions."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        
        if user.is_superuser or user.is_staff or user.role == 'admin':
            # Full admin access
            return Response({
                'role': 'admin',
                'permissions': [
                    'view_users', 'create_user', 'edit_user', 'delete_user', 'approve_user',
                    'force_logout_user', 'view_conversations', 'moderate_conversations',
                    'view_moderators', 'assign_moderator', 'view_settings', 'edit_settings',
                    'view_backups', 'restore_backup', 'view_audit_logs'
                ]
            })
        
        if user.role == 'moderator':
            # Get Django permissions for this moderator
            django_perms = user.user_permissions.all()
            codename_map = {
                'view_user': 'view_users',
                'add_user': 'create_user',
                'change_user': 'edit_user',
                'delete_user': 'delete_user',
                'view_logentry': 'view_audit_logs',
                'add_logentry': 'add_logentry',
                'change_logentry': 'change_logentry',
                'delete_logentry': 'delete_logentry',
            }
            
            permissions = []
            for perm in django_perms:
                frontend_code = codename_map.get(perm.codename)
                if frontend_code:
                    permissions.append(frontend_code)
            
            return Response({
                'role': 'moderator',
                'permissions': permissions
            })
        
        # No admin access
        return Response({
            'role': 'user',
            'permissions': []
        })
