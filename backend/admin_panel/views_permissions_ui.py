from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.models import Permission
from users.models import User

class AvailablePermissionsView(APIView):
    """Return all available permissions for assignment to moderators."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Get all permissions and map them to our frontend codenames
        all_perms = Permission.objects.all()
        permission_map = {}
        for perm in all_perms:
            # Map Django permission codenames to our frontend codenames
            if perm.codename == 'view_user':
                permission_map['view_users'] = {
                    'codename': 'view_users',
                    'name': 'View Users',
                    'description': 'View the users list and basic user information.',
                    'django_codename': perm.codename,
                }
            elif perm.codename == 'add_user':
                permission_map['create_user'] = {
                    'codename': 'create_user',
                    'name': 'Create User',
                    'description': 'Create new users.',
                    'django_codename': perm.codename,
                }
            elif perm.codename == 'change_user':
                permission_map['edit_user'] = {
                    'codename': 'edit_user',
                    'name': 'Edit User',
                    'description': 'Edit user details.',
                    'django_codename': perm.codename,
                }
            elif perm.codename == 'delete_user':
                permission_map['delete_user'] = {
                    'codename': 'delete_user',
                    'name': 'Delete User',
                    'description': 'Delete users.',
                    'django_codename': perm.codename,
                }
            elif perm.codename == 'view_logentry':
                permission_map['view_audit_logs'] = {
                    'codename': 'view_audit_logs',
                    'name': 'View Audit Logs',
                    'description': 'View system audit logs.',
                    'django_codename': perm.codename,
                }
            elif perm.codename == 'add_logentry':
                permission_map['add_logentry'] = {
                    'codename': 'add_logentry',
                    'name': 'Add Log Entry',
                    'description': 'Add log entries.',
                    'django_codename': perm.codename,
                }
            elif perm.codename == 'change_logentry':
                permission_map['change_logentry'] = {
                    'codename': 'change_logentry',
                    'name': 'Change Log Entry',
                    'description': 'Change log entries.',
                    'django_codename': perm.codename,
                }
            elif perm.codename == 'delete_logentry':
                permission_map['delete_logentry'] = {
                    'codename': 'delete_logentry',
                    'name': 'Delete Log Entry',
                    'description': 'Delete log entries.',
                    'django_codename': perm.codename,
                }

        # Return the mapped permissions
        return Response({'permissions': list(permission_map.values())})


class ModeratorsWithPermissionsView(APIView):
    """Return all moderators with their current permissions."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        moderators = User.objects.filter(role='moderator')
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
        
        moderators_data = []
        for mod in moderators:
            django_perms = mod.user_permissions.all()
            permissions = []
            for perm in django_perms:
                frontend_code = codename_map.get(perm.codename)
                if frontend_code:
                    permissions.append(frontend_code)
            
            moderators_data.append({
                'id': mod.id,
                'user_id': mod.id,
                'username': mod.username,
                'email': mod.email,
                'permissions': permissions
            })
        
        return Response({'moderators': moderators_data})


class SetModeratorPermissionsView(APIView):
    """Set permissions for a moderator."""
    permission_classes = [IsAuthenticated]

    def put(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
            if user.role != 'moderator':
                return Response({'error': 'User is not a moderator'}, status=400)

            permission_codenames = request.data.get('permissions', [])
            # Clear all user permissions first
            user.user_permissions.clear()
            
            # Map frontend codenames back to Django codenames and assign
            codename_map = {
                'view_users': 'view_user',
                'create_user': 'add_user',
                'edit_user': 'change_user',
                'delete_user': 'delete_user',
                'view_audit_logs': 'view_logentry',
                'add_logentry': 'add_logentry',
                'change_logentry': 'change_logentry',
                'delete_logentry': 'delete_logentry',
            }
            
            for frontend_code in permission_codenames:
                django_code = codename_map.get(frontend_code)
                if django_code:
                    try:
                        perm = Permission.objects.get(codename=django_code)
                        user.user_permissions.add(perm)
                    except Permission.DoesNotExist:
                        # Create permission if it doesn't exist
                        app_label, codename = django_code.split('_', 1)
                        perm = Permission.objects.create(
                            codename=django_code,
                            name=codename.replace('_', ' ').title(),
                            content_type_id=1,  # This would need proper content type
                        )
                        user.user_permissions.add(perm)

            return Response({'success': True})
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)
        except Exception as e:
            return Response({'error': str(e)}, status=500)
