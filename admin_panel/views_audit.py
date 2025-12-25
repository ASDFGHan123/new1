from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import AuditLog
from .serializers import AuditLogSerializer
from users.views import IsAdminUser


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get_queryset(self):
        queryset = AuditLog.objects.all()
        action_type = self.request.query_params.get('action_type')
        actor_id = self.request.query_params.get('actor_id')
        severity = self.request.query_params.get('severity')
        
        if action_type:
            queryset = queryset.filter(action_type=action_type)
        if actor_id:
            queryset = queryset.filter(actor_id=actor_id)
        if severity:
            queryset = queryset.filter(severity=severity)
        
        return queryset.order_by('-timestamp')
