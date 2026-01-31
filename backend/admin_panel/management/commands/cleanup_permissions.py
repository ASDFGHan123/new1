from django.core.management.base import BaseCommand
from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType


class Command(BaseCommand):
    help = 'Remove ContentReview, FlaggedMessage, MessageTemplate, and SystemMessage permissions'

    def handle(self, *args, **options):
        models_to_delete = ['contentreview', 'flaggedmessage', 'messagetemplate', 'systemmessage']
        total_deleted = 0
        
        for model_name in models_to_delete:
            try:
                ct = ContentType.objects.get(model=model_name)
                deleted, _ = Permission.objects.filter(content_type=ct).delete()
                total_deleted += deleted
                self.stdout.write(self.style.SUCCESS(f'Deleted {deleted} {model_name} permissions'))
            except ContentType.DoesNotExist:
                pass
        
        self.stdout.write(self.style.SUCCESS(f'Total permissions deleted: {total_deleted}'))
