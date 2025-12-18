from django.core.management.base import BaseCommand
from django.utils import timezone
from users.models import User, SuspiciousActivity
from datetime import timedelta


class Command(BaseCommand):
    help = 'Insert test data for moderation panel'

    def handle(self, *args, **options):
        # Create test users with report_count > 0
        test_users = [
            {
                'username': 'spammer_user',
                'email': 'spammer@test.com',
                'first_name': 'Spam',
                'last_name': 'User',
                'report_count': 5,
                'status': 'active'
            },
            {
                'username': 'abusive_user',
                'email': 'abusive@test.com',
                'first_name': 'Abusive',
                'last_name': 'User',
                'report_count': 8,
                'status': 'active'
            },
            {
                'username': 'suspicious_user',
                'email': 'suspicious@test.com',
                'first_name': 'Suspicious',
                'last_name': 'User',
                'report_count': 3,
                'status': 'active'
            },
        ]

        created_users = []
        for user_data in test_users:
            user, created = User.objects.get_or_create(
                username=user_data['username'],
                defaults={
                    'email': user_data['email'],
                    'first_name': user_data['first_name'],
                    'last_name': user_data['last_name'],
                    'report_count': user_data['report_count'],
                    'status': user_data['status'],
                    'is_active': True,
                }
            )
            if created:
                user.set_password('testpass123')
                user.save()
                self.stdout.write(self.style.SUCCESS(f'Created user: {user.username}'))
            created_users.append(user)

        # Create suspicious activities
        activities = [
            {
                'user': created_users[0],
                'ip_address': '192.168.1.100',
                'activity_type': 'rapid_requests',
                'description': 'User sent 50 messages in 5 minutes',
                'severity': 'high',
                'is_resolved': False,
            },
            {
                'user': created_users[1],
                'ip_address': '192.168.1.101',
                'activity_type': 'brute_force',
                'description': 'Multiple failed login attempts detected',
                'severity': 'critical',
                'is_resolved': False,
            },
            {
                'user': created_users[2],
                'ip_address': '192.168.1.102',
                'activity_type': 'bot_activity',
                'description': 'Automated bot activity detected',
                'severity': 'medium',
                'is_resolved': False,
            },
            {
                'user': created_users[0],
                'ip_address': '192.168.1.100',
                'activity_type': 'xss_attempt',
                'description': 'XSS injection attempt in message',
                'severity': 'high',
                'is_resolved': False,
            },
        ]

        for activity_data in activities:
            activity, created = SuspiciousActivity.objects.get_or_create(
                user=activity_data['user'],
                ip_address=activity_data['ip_address'],
                activity_type=activity_data['activity_type'],
                defaults={
                    'description': activity_data['description'],
                    'severity': activity_data['severity'],
                    'is_resolved': activity_data['is_resolved'],
                    'timestamp': timezone.now() - timedelta(hours=1),
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created activity: {activity.activity_type}'))

        self.stdout.write(self.style.SUCCESS('Test data inserted successfully!'))
