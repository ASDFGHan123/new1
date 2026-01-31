from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0017_rename_departments_name_idx_departments_name_c59a45_idx_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='token_version',
            field=models.PositiveIntegerField(default=0),
        ),
    ]
