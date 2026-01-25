from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('users', '0018_user_token_version'),
    ]

    operations = [
        migrations.CreateModel(
            name='ModeratorPermission',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                (
                    'permission',
                    models.CharField(
                        choices=[
                            ('view_users', 'View Users'),
                            ('view_conversations', 'View Conversations'),
                            ('view_messages', 'View Messages'),
                            ('delete_messages', 'Delete Messages'),
                            ('warn_users', 'Warn Users'),
                            ('suspend_users', 'Suspend Users'),
                            ('ban_users', 'Ban Users'),
                            ('view_audit_logs', 'View Audit Logs'),
                            ('manage_groups', 'Manage Groups'),
                            ('view_reports', 'View Reports'),
                            ('moderate_content', 'Moderate Content'),
                            ('manage_trash', 'Manage Trash'),
                        ],
                        max_length=50,
                        unique=True,
                    ),
                ),
                ('description', models.TextField()),
            ],
            options={
                'db_table': 'moderator_permissions',
                'verbose_name': 'Moderator Permission',
                'verbose_name_plural': 'Moderator Permissions',
            },
        ),
        migrations.CreateModel(
            name='ModeratorRole',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, unique=True)),
                (
                    'role_type',
                    models.CharField(
                        choices=[
                            ('junior', 'Junior Moderator'),
                            ('senior', 'Senior Moderator'),
                            ('lead', 'Lead Moderator'),
                        ],
                        default='junior',
                        max_length=20,
                    ),
                ),
                ('description', models.TextField(blank=True)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                (
                    'permissions',
                    models.ManyToManyField(related_name='roles', to='users.moderatorpermission'),
                ),
            ],
            options={
                'db_table': 'moderator_roles',
                'verbose_name': 'Moderator Role',
                'verbose_name_plural': 'Moderator Roles',
            },
        ),
        migrations.CreateModel(
            name='ModeratorProfile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('warnings_issued', models.PositiveIntegerField(default=0)),
                ('suspensions_issued', models.PositiveIntegerField(default=0)),
                ('bans_issued', models.PositiveIntegerField(default=0)),
                ('messages_deleted', models.PositiveIntegerField(default=0)),
                ('last_moderation_action', models.DateTimeField(blank=True, null=True)),
                ('is_active_moderator', models.BooleanField(default=True)),
                ('assigned_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                (
                    'role',
                    models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='users.moderatorrole'),
                ),
                (
                    'user',
                    models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='moderator_profile', to=settings.AUTH_USER_MODEL),
                ),
            ],
            options={
                'db_table': 'moderator_profiles',
                'verbose_name': 'Moderator Profile',
                'verbose_name_plural': 'Moderator Profiles',
            },
        ),
        migrations.CreateModel(
            name='ModerationAction',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                (
                    'action_type',
                    models.CharField(
                        choices=[
                            ('warning', 'Warning'),
                            ('suspend', 'Suspend'),
                            ('ban', 'Ban'),
                            ('delete_message', 'Delete Message'),
                            ('delete_conversation', 'Delete Conversation'),
                            ('remove_group_member', 'Remove Group Member'),
                            ('close_group', 'Close Group'),
                        ],
                        max_length=30,
                    ),
                ),
                ('target_id', models.CharField(blank=True, max_length=255)),
                ('target_type', models.CharField(blank=True, max_length=50)),
                ('reason', models.TextField()),
                ('duration', models.CharField(blank=True, max_length=50)),
                ('is_active', models.BooleanField(default=True)),
                (
                    'appeal_status',
                    models.CharField(
                        choices=[
                            ('none', 'No Appeal'),
                            ('pending', 'Appeal Pending'),
                            ('approved', 'Appeal Approved'),
                            ('rejected', 'Appeal Rejected'),
                        ],
                        default='none',
                        max_length=20,
                    ),
                ),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('expires_at', models.DateTimeField(blank=True, null=True)),
                (
                    'moderator',
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='moderation_actions', to=settings.AUTH_USER_MODEL),
                ),
                (
                    'target_user',
                    models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='moderation_actions_against', to=settings.AUTH_USER_MODEL),
                ),
            ],
            options={
                'db_table': 'moderation_actions',
                'verbose_name': 'Moderation Action',
                'verbose_name_plural': 'Moderation Actions',
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='moderationaction',
            index=models.Index(fields=['moderator'], name='moderation_moderator_idx'),
        ),
        migrations.AddIndex(
            model_name='moderationaction',
            index=models.Index(fields=['target_user'], name='moderation_target_user_idx'),
        ),
        migrations.AddIndex(
            model_name='moderationaction',
            index=models.Index(fields=['action_type'], name='moderation_action_type_idx'),
        ),
        migrations.AddIndex(
            model_name='moderationaction',
            index=models.Index(fields=['is_active'], name='moderation_is_active_idx'),
        ),
    ]
