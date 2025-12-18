"""
Migration to add TrashItem model.
"""
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0003_ipaddress_suspiciousactivity_ipaccesslog'),
    ]

    operations = [
        migrations.CreateModel(
            name='TrashItem',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('item_type', models.CharField(choices=[('user', 'User'), ('message', 'Message'), ('conversation', 'Conversation')], max_length=20)),
                ('item_id', models.IntegerField()),
                ('item_data', models.JSONField()),
                ('deleted_at', models.DateTimeField(auto_now_add=True)),
                ('expires_at', models.DateTimeField()),
                ('deleted_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='deleted_items', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Trash Item',
                'verbose_name_plural': 'Trash Items',
                'db_table': 'trash_items',
                'ordering': ['-deleted_at'],
            },
        ),
        migrations.AddIndex(
            model_name='trashitem',
            index=models.Index(fields=['item_type'], name='trash_item_type_idx'),
        ),
        migrations.AddIndex(
            model_name='trashitem',
            index=models.Index(fields=['deleted_at'], name='trash_deleted_at_idx'),
        ),
        migrations.AddIndex(
            model_name='trashitem',
            index=models.Index(fields=['expires_at'], name='trash_expires_at_idx'),
        ),
    ]
