# Generated migration for adding metadata field to Backup model

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('admin_panel', '0014_add_source_tab_to_trash'),
    ]

    operations = [
        migrations.AddField(
            model_name='backup',
            name='metadata',
            field=models.JSONField(default=dict, blank=True),
        ),
    ]
