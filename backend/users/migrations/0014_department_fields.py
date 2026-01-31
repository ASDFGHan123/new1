from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0013_office_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='department',
            name='manager',
            field=models.CharField(blank=True, max_length=200),
        ),
        migrations.AddField(
            model_name='department',
            name='code',
            field=models.TextField(blank=True),
        ),
    ]
