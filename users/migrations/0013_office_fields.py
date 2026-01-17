from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('users', '0012_update_trash_item'),
    ]

    operations = [
        migrations.RemoveIndex(
            model_name='office',
            name='offices_location_idx',
        ),
        migrations.RemoveField(
            model_name='office',
            name='location',
        ),
        migrations.RemoveField(
            model_name='office',
            name='address',
        ),
        migrations.RemoveField(
            model_name='office',
            name='phone',
        ),
        migrations.RemoveField(
            model_name='office',
            name='email',
        ),
        migrations.AddField(
            model_name='office',
            name='manager',
            field=models.CharField(default='', max_length=200),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='office',
            name='code',
            field=models.TextField(blank=True),
        ),
        migrations.AddIndex(
            model_name='office',
            index=models.Index(fields=['manager'], name='offices_manager_idx'),
        ),
    ]
