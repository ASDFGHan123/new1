# Generated migration for video attachment enhancements
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('chat', '0003_alter_group_name'),
    ]

    operations = [
        migrations.AddField(
            model_name='attachment',
            name='thumbnail',
            field=models.ImageField(blank=True, null=True, upload_to='thumbnails/%Y/%m/%d/'),
        ),
        migrations.AddField(
            model_name='attachment',
            name='width',
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='attachment',
            name='height',
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='attachment',
            name='bitrate',
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='attachment',
            name='codec',
            field=models.CharField(blank=True, max_length=50),
        ),
    ]
