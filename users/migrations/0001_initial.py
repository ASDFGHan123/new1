
import django.core.validators
import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True
    dependencies = [
        ('auth', '0012_alter_user_first_name_max_length'),
    ]

    operations = [
        migrations.CreateModel(
            name='User',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('password', models.CharField(max_length=128, verbose_name='password')),
                ('last_login', models.DateTimeField(blank=True, null=True, verbose_name='last login')),
                ('username', models.CharField(max_length=150, unique=True, validators=[django.core.validators.RegexValidator(message='Username can only contain letters, numbers, dots, underscores, and hyphens.', regex='^[\\w.-]+$')])),
                ('email', models.EmailField(max_length=254, unique=True)),
                ('first_name', models.CharField(blank=True, max_length=30)),
                ('last_name', models.CharField(blank=True, max_length=30)),
                ('avatar', models.ImageField(blank=True, null=True, upload_to='avatars/')),
                ('bio', models.TextField(blank=True, max_length=500)),
                ('role', models.CharField(choices=[('admin', 'Admin'), ('user', 'User'), ('moderator', 'Moderator')], default='user', max_length=20)),
                ('status', models.CharField(choices=[('active', 'Active'), ('pending', 'Pending'), ('suspended', 'Suspended'), ('banned', 'Banned')], default='pending', max_length=20)),
                ('online_status', models.CharField(choices=[('online', 'Online'), ('away', 'Away'), ('offline', 'Offline')], default='offline', max_length=20)),
                ('last_seen', models.DateTimeField(default=django.utils.timezone.now)),
                ('join_date', models.DateTimeField(default=django.utils.timezone.now)),
                ('message_count', models.PositiveIntegerField(default=0)),
                ('report_count', models.PositiveIntegerField(default=0)),
                ('email_verified', models.BooleanField(default=False)),
                ('email_verification_token', models.CharField(blank=True, max_length=255)),
                ('is_staff', models.BooleanField(default=False)),
                ('is_active', models.BooleanField(default=True)),
                ('is_superuser', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('groups', models.ManyToManyField(blank=True, help_text='The groups this user belongs to. A user will get all permissions granted to each of their groups.', related_name='user_set', related_query_name='user', to='auth.group', verbose_name='groups')),
                ('user_permissions', models.ManyToManyField(blank=True, help_text='Specific permissions for this user.', related_name='user_set', related_query_name='user', to='auth.permission', verbose_name='user permissions')),
            ],
            options={
                'verbose_name': 'User',
                'verbose_name_plural': 'Users',
                'db_table': 'users',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='UserActivity',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('action', models.CharField(choices=[('login', 'Login'), ('logout', 'Logout'), ('message_sent', 'Message Sent'), ('message_edited', 'Message Edited'), ('message_deleted', 'Message Deleted'), ('profile_updated', 'Profile Updated'), ('group_joined', 'Group Joined'), ('group_left', 'Group Left'), ('file_uploaded', 'File Uploaded'), ('status_changed', 'Status Changed'), ('password_changed', 'Password Changed'), ('email_verified', 'Email Verified')], max_length=30)),
                ('description', models.TextField(blank=True)),
                ('ip_address', models.GenericIPAddressField(blank=True, null=True)),
                ('user_agent', models.TextField(blank=True)),
                ('timestamp', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='activities', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'User Activity',
                'verbose_name_plural': 'User Activities',
                'db_table': 'user_activities',
                'ordering': ['-timestamp'],
            },
        ),
        migrations.CreateModel(
            name='UserSession',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('session_key', models.CharField(max_length=40, unique=True)),
                ('ip_address', models.GenericIPAddressField(blank=True, null=True)),
                ('user_agent', models.TextField(blank=True)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('last_activity', models.DateTimeField(auto_now=True)),
                ('expires_at', models.DateTimeField()),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='sessions', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'User Session',
                'verbose_name_plural': 'User Sessions',
                'db_table': 'user_sessions', 
                'ordering': ['-last_activity'],
            },
        ),
        migrations.AddIndex(
            model_name='user',
            index=models.Index(fields=['username'], name='users_usernam_baeb4b_idx'),
        ),
        migrations.AddIndex(
            model_name='user',
            index=models.Index(fields=['email'], name='users_email_4b85f2_idx'),
        ),
        migrations.AddIndex(
            model_name='user',
            index=models.Index(fields=['status'], name='users_status_9ca66f_idx'),
        ),
        migrations.AddIndex(
            model_name='user',
            index=models.Index(fields=['role'], name='users_role_0ace22_idx'),
        ),
        migrations.AddIndex(
            model_name='user',
            index=models.Index(fields=['online_status'], name='users_online__90b2b2_idx'),
        ),
        migrations.AddIndex(
            model_name='user',
            index=models.Index(fields=['last_seen'], name='users_last_se_f59089_idx'),
        ),
        migrations.AddIndex(
            model_name='useractivity',
            index=models.Index(fields=['user'], name='user_activi_user_id_260c6d_idx'),
        ),
        migrations.AddIndex(
            model_name='useractivity',
            index=models.Index(fields=['action'], name='user_activi_action_b4118c_idx'),
        ),
        migrations.AddIndex(
            model_name='useractivity',
            index=models.Index(fields=['timestamp'], name='user_activi_timesta_12eff7_idx'),
        ),
        migrations.AddIndex(
            model_name='usersession',
            index=models.Index(fields=['user'], name='user_sessio_user_id_eb20aa_idx'),
        ),
        migrations.AddIndex(
            model_name='usersession',
            index=models.Index(fields=['session_key'], name='user_sessio_session_cc84b9_idx'),
        ),
        migrations.AddIndex(
            model_name='usersession',
            index=models.Index(fields=['is_active'], name='user_sessio_is_acti_1b3cb1_idx'),
        ),
    ]
