from django.core.management.base import BaseCommand
from users.models import User
from users.models_organization import Department, Office, DepartmentOfficeUser


class Command(BaseCommand):
    help = 'Assign active users to departments and offices'

    def handle(self, *args, **options):
        departments = Department.objects.all()
        offices = Office.objects.all()
        active_users = User.objects.filter(status='active')

        if not departments.exists():
            self.stdout.write(self.style.WARNING('No departments found'))
            return

        if not offices.exists():
            self.stdout.write(self.style.WARNING('No offices found'))
            return

        if not active_users.exists():
            self.stdout.write(self.style.WARNING('No active users found'))
            return

        count = 0
        for user in active_users:
            for department in departments:
                for office in department.offices.all():
                    obj, created = DepartmentOfficeUser.objects.get_or_create(
                        user=user,
                        department=department,
                        office=office,
                        defaults={'status': 'active'}
                    )
                    if created:
                        count += 1

        self.stdout.write(self.style.SUCCESS(f'Successfully assigned {count} users to departments/offices'))
