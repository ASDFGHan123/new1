from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0011_organization'),
    ]

    operations = [
        migrations.AlterField(
            model_name='trashitem',
            name='item_id',
            field=models.CharField(max_length=255),
        ),
        migrations.AlterField(
            model_name='trashitem',
            name='item_type',
            field=models.CharField(choices=[('user', 'User'), ('message', 'Message'), ('conversation', 'Conversation'), ('group', 'Group'), ('department', 'Department')], max_length=20),
        ),
    ]
