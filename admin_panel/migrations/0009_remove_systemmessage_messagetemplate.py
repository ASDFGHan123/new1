# Generated migration to remove SystemMessage and MessageTemplate models

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('admin_panel', '0008_merge_20260103_0954'),
    ]

    operations = [
        migrations.DeleteModel(
            name='SystemMessage',
        ),
        migrations.DeleteModel(
            name='MessageTemplate',
        ),
    ]
