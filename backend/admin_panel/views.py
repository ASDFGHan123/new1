from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from admin_panel.models import SystemSettings
from rest_framework import serializers


class SystemSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemSettings
        fields = ['key', 'value', 'category', 'description']


class SystemSettingsViewSet(viewsets.ModelViewSet):
    queryset = SystemSettings.objects.all()
    serializer_class = SystemSettingsSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get_queryset(self):
        return SystemSettings.objects.all().order_by('category', 'key')
    
    @action(detail=False, methods=['post'])
    def bulk_update(self, request):
        settings_data = request.data.get('settings', [])
        for setting in settings_data:
            key = setting.get('key')
            value = setting.get('value')
            if key and value is not None:
                SystemSettings.objects.filter(key=key).update(
                    value=str(value),
                    updated_by=request.user
                )
        return Response({'status': 'success'})
