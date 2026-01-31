# Generated migration for organization models

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0007_merge_0002_notification_0006_alter_user_username'),
    ]

    operations = [
        migrations.CreateModel(
            name='Department',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=100, unique=True)),
                ('description', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('head', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='headed_departments', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Department',
                'verbose_name_plural': 'Departments',
                'db_table': 'departments',
                'ordering': ['name'],
            },
        ),
        migrations.CreateModel(
            name='Office',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=100)),
                ('location', models.CharField(max_length=200)),
                ('address', models.TextField(blank=True)),
                ('phone', models.CharField(blank=True, max_length=20)),
                ('email', models.EmailField(blank=True, max_length=254)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('department', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='offices', to='users.department')),
            ],
            options={
                'verbose_name': 'Office',
                'verbose_name_plural': 'Offices',
                'db_table': 'offices',
                'ordering': ['department', 'name'],
                'unique_together': {('department', 'name')},
            },
        ),
        migrations.CreateModel(
            name='DepartmentOfficeUser',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('status', models.CharField(choices=[('active', 'Active'), ('inactive', 'Inactive'), ('left', 'Left')], default='active', max_length=20)),
                ('joined_at', models.DateTimeField(auto_now_add=True)),
                ('left_at', models.DateTimeField(blank=True, null=True)),
                ('department', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='members', to='users.department')),
                ('office', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='members', to='users.office')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='department_assignments', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Department Office User',
                'verbose_name_plural': 'Department Office Users',
                'db_table': 'department_office_users',
                'ordering': ['-joined_at'],
                'unique_together': {('user', 'department', 'office')},
            },
        ),
        migrations.AddIndex(
            model_name='department',
            index=models.Index(fields=['name'], name='departments_name_idx'),
        ),
        migrations.AddIndex(
            model_name='department',
            index=models.Index(fields=['head'], name='departments_head_idx'),
        ),
        migrations.AddIndex(
            model_name='office',
            index=models.Index(fields=['department'], name='offices_department_idx'),
        ),
        migrations.AddIndex(
            model_name='office',
            index=models.Index(fields=['location'], name='offices_location_idx'),
        ),
        migrations.AddIndex(
            model_name='departmentofficeuser',
            index=models.Index(fields=['user'], name='dept_office_user_user_idx'),
        ),
        migrations.AddIndex(
            model_name='departmentofficeuser',
            index=models.Index(fields=['department'], name='dept_office_user_dept_idx'),
        ),
        migrations.AddIndex(
            model_name='departmentofficeuser',
            index=models.Index(fields=['office'], name='dept_office_user_office_idx'),
        ),
        migrations.AddIndex(
            model_name='departmentofficeuser',
            index=models.Index(fields=['status'], name='dept_office_user_status_idx'),
        ),
    ]
