# Generated migration for moderation models

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('admin_panel', '0005_alter_auditlog_session_id_alter_auditlog_user_agent'),
    ]

    operations = [
        migrations.CreateModel(
            name='FlaggedMessage',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('message_id', models.CharField(max_length=255)),
                ('message_content', models.TextField()),
                ('sender_id', models.CharField(max_length=255)),
                ('sender_username', models.CharField(max_length=150)),
                ('reason', models.CharField(choices=[('spam', 'Spam'), ('harassment', 'Harassment'), ('hate_speech', 'Hate Speech'), ('violence', 'Violence'), ('explicit', 'Explicit Content'), ('misinformation', 'Misinformation'), ('other', 'Other')], max_length=50)),
                ('description', models.TextField(blank=True)),
                ('status', models.CharField(choices=[('pending', 'Pending Review'), ('approved', 'Approved'), ('rejected', 'Rejected'), ('removed', 'Removed')], default='pending', max_length=20)),
                ('review_notes', models.TextField(blank=True)),
                ('reported_at', models.DateTimeField(auto_now_add=True)),
                ('reviewed_at', models.DateTimeField(blank=True, null=True)),
                ('reported_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='message_reports', to=settings.AUTH_USER_MODEL)),
                ('reviewed_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='reviewed_messages', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Flagged Message',
                'verbose_name_plural': 'Flagged Messages',
                'db_table': 'flagged_messages',
                'ordering': ['-reported_at'],
            },
        ),
        migrations.CreateModel(
            name='UserModeration',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('action_type', models.CharField(choices=[('suspend', 'Suspend'), ('ban', 'Ban'), ('warn', 'Warn'), ('mute', 'Mute')], max_length=20)),
                ('reason', models.TextField()),
                ('status', models.CharField(choices=[('active', 'Active'), ('expired', 'Expired'), ('lifted', 'Lifted')], default='active', max_length=20)),
                ('duration_days', models.PositiveIntegerField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('expires_at', models.DateTimeField(blank=True, null=True)),
                ('lifted_at', models.DateTimeField(blank=True, null=True)),
                ('moderator', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='moderation_actions_taken', to=settings.AUTH_USER_MODEL)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='moderation_actions', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'User Moderation',
                'verbose_name_plural': 'User Moderations',
                'db_table': 'user_moderation',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='ContentReview',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('content_type', models.CharField(choices=[('message', 'Message'), ('user_profile', 'User Profile'), ('group', 'Group')], max_length=20)),
                ('content_id', models.CharField(max_length=255)),
                ('content_data', models.JSONField(default=dict)),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('in_review', 'In Review'), ('approved', 'Approved'), ('rejected', 'Rejected')], default='pending', max_length=20)),
                ('priority', models.PositiveIntegerField(default=1)),
                ('review_notes', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('reviewed_at', models.DateTimeField(blank=True, null=True)),
                ('reviewed_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='content_reviews', to=settings.AUTH_USER_MODEL)),
                ('submitted_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='content_submissions', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Content Review',
                'verbose_name_plural': 'Content Reviews',
                'db_table': 'content_reviews',
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='flaggedmessage',
            index=models.Index(fields=['status'], name='flagged_mes_status_idx'),
        ),
        migrations.AddIndex(
            model_name='flaggedmessage',
            index=models.Index(fields=['reason'], name='flagged_mes_reason_idx'),
        ),
        migrations.AddIndex(
            model_name='flaggedmessage',
            index=models.Index(fields=['reported_at'], name='flagged_mes_reported_idx'),
        ),
        migrations.AddIndex(
            model_name='flaggedmessage',
            index=models.Index(fields=['sender_id'], name='flagged_mes_sender_idx'),
        ),
        migrations.AddIndex(
            model_name='usermoderation',
            index=models.Index(fields=['user'], name='user_moder_user_idx'),
        ),
        migrations.AddIndex(
            model_name='usermoderation',
            index=models.Index(fields=['action_type'], name='user_moder_action_idx'),
        ),
        migrations.AddIndex(
            model_name='usermoderation',
            index=models.Index(fields=['status'], name='user_moder_status_idx'),
        ),
        migrations.AddIndex(
            model_name='usermoderation',
            index=models.Index(fields=['created_at'], name='user_moder_created_idx'),
        ),
        migrations.AddIndex(
            model_name='contentreview',
            index=models.Index(fields=['status'], name='content_re_status_idx'),
        ),
        migrations.AddIndex(
            model_name='contentreview',
            index=models.Index(fields=['content_type'], name='content_re_content_idx'),
        ),
        migrations.AddIndex(
            model_name='contentreview',
            index=models.Index(fields=['priority'], name='content_re_priority_idx'),
        ),
        migrations.AddIndex(
            model_name='contentreview',
            index=models.Index(fields=['created_at'], name='content_re_created_idx'),
        ),
    ]
