# Generated migration to remove UserModeration model

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('admin_panel', '0009_remove_systemmessage_messagetemplate'),
    ]

    operations = [
        migrations.DeleteModel(
            name='UserModeration',
        ),
    ]
