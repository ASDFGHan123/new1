# Generated migration for conversation status tracking

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('chat', '0004_video_attachments'),
    ]

    operations = [
        migrations.AddField(
            model_name='conversation',
            name='conversation_status',
            field=models.CharField(
                choices=[('active', 'Active'), ('inactive', 'Inactive')],
                default='inactive',
                max_length=20
            ),
        ),
        migrations.AlterField(
            model_name='conversation',
            name='id',
            field=models.UUIDField(auto_created=True, default=None, editable=False, primary_key=True, serialize=False),
        ),
        migrations.AlterModelOptions(
            name='conversation',
            options={
                'db_table': 'conversations',
                'indexes': [
                    models.Index(fields=['conversation_type'], name='conversations_conver_type_idx'),
                    models.Index(fields=['last_message_at'], name='conversations_last_msg_idx'),
                    models.Index(fields=['created_at'], name='conversations_created_idx'),
                    models.Index(fields=['is_deleted'], name='conversations_deleted_idx'),
                    models.Index(fields=['conversation_status'], name='conversations_status_idx'),
                ],
                'ordering': ['-last_message_at', '-created_at'],
                'verbose_name': 'Conversation',
                'verbose_name_plural': 'Conversations',
            },
        ),
    ]
