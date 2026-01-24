from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from admin_panel.models import AdminOutgoingMessage
from admin_panel.serializers import AdminOutgoingMessageSerializer
from users.views import IsAdminUser


class MessageHistoryViewSet(viewsets.ModelViewSet):
    queryset = AdminOutgoingMessage.objects.all().order_by('-sent_at')
    serializer_class = AdminOutgoingMessageSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get_queryset(self):
        qs = super().get_queryset()
        msg_type = self.request.query_params.get('type')
        status_param = self.request.query_params.get('status')
        priority = self.request.query_params.get('priority')
        search = self.request.query_params.get('search')

        if msg_type:
            qs = qs.filter(type=msg_type)
        if status_param:
            qs = qs.filter(status=status_param)
        if priority:
            qs = qs.filter(priority=priority)
        if search:
            qs = qs.filter(content__icontains=search)

        return qs

    def perform_create(self, serializer):
        serializer.save(sent_by=self.request.user)
