from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import F

from admin_panel.models import MessageTemplate
from admin_panel.serializers import MessageTemplateSerializer
from users.views import IsAdminUser


class MessageTemplateViewSet(viewsets.ModelViewSet):
    queryset = MessageTemplate.objects.all().order_by('-created_at')
    serializer_class = MessageTemplateSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def use(self, request, pk=None):
        template = self.get_object()
        MessageTemplate.objects.filter(pk=template.pk).update(usage_count=F('usage_count') + 1)
        template.refresh_from_db(fields=['usage_count'])
        return Response({'usage_count': template.usage_count}, status=status.HTTP_200_OK)
