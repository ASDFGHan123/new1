# Generated migration for adding description field to Office model

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0014_department_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='office',
            name='description',
            field=models.TextField(blank=True),
        ),
    ]
