# Generated migration to remove FlaggedMessage and ContentReview models

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('admin_panel', '0006_moderation_models'),
    ]

    operations = [
        migrations.DeleteModel(
            name='FlaggedMessage',
        ),
        migrations.DeleteModel(
            name='ContentReview',
        ),
    ]
