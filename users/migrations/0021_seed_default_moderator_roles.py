from django.db import migrations
from users.moderator_models import ModeratorPermission, ModeratorRole, ModeratorPermissionHelper


def create_default_permissions_and_roles(apps, schema_editor):
    """Seed default moderator permissions and roles."""
    # Create permissions
    for perm_code, desc in ModeratorPermission.PERMISSION_CHOICES:
        ModeratorPermission.objects.get_or_create(
            permission=perm_code,
            defaults={'description': desc}
        )

    # Create default roles with permissions
    for role_type in ['junior', 'senior', 'lead']:
        role, created = ModeratorRole.objects.get_or_create(
            name=f'{role_type.capitalize()} Moderator',
            defaults={'role_type': role_type}
        )
        if created:
            perms = ModeratorPermissionHelper.DEFAULT_PERMISSIONS.get(role_type, [])
            for perm_code in perms:
                try:
                    perm = ModeratorPermission.objects.get(permission=perm_code)
                    role.permissions.add(perm)
                except ModeratorPermission.DoesNotExist:
                    # Skip if permission doesn't exist
                    pass


def reverse_seed(apps, schema_editor):
    """No-op reverse: keep created data."""
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0020_rename_moderation_moderator_idx_moderation__moderat_b5120b_idx_and_more'),
    ]

    operations = [
        migrations.RunPython(create_default_permissions_and_roles, reverse_seed)
    ]
