from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from .models import SystemSettings, AuditLog
from .serializers import SystemSettingSerializer, SystemSettingCreateUpdateSerializer
from .services.audit_logging_service import AuditLoggingService

class SystemSettingsListView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        category = request.query_params.get('category')
        settings = SystemSettings.objects.filter(category=category) if category else SystemSettings.objects.all()
        return Response(SystemSettingSerializer(settings, many=True).data)
    
    def post(self, request):
        serializer = SystemSettingCreateUpdateSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            return Response(SystemSettingSerializer(serializer.save()).data, status=201)
        return Response(serializer.errors, status=400)

class SystemSettingDetailView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request, key):
        try:
            setting = SystemSettings.objects.get(key=key)
            return Response(SystemSettingSerializer(setting).data)
        except SystemSettings.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

class SystemSettingUpdateView(APIView):
    permission_classes = [AllowAny]
    
    def put(self, request, key):
        try:
            setting = SystemSettings.objects.get(key=key)
            serializer = SystemSettingCreateUpdateSerializer(setting, data=request.data, context={'request': request})
            if serializer.is_valid():
                return Response(SystemSettingSerializer(serializer.save()).data)
            return Response(serializer.errors, status=400)
        except SystemSettings.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)
    
    def delete(self, request, key):
        try:
            SystemSettings.objects.get(key=key).delete()
            return Response(status=204)
        except SystemSettings.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

class SystemSettingsBulkUpdateView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        settings_data = request.data.get('settings', [])
        updated = []
        for item in settings_data:
            try:
                setting = SystemSettings.objects.get(key=item['key'])
                setting.value = str(item['value'])
                if request.user.is_authenticated:
                    setting.updated_by = request.user
                setting.save()
                updated.append(SystemSettingSerializer(setting).data)
            except SystemSettings.DoesNotExist:
                pass
        
        if updated and request.user.is_authenticated:
            try:
                AuditLoggingService.log_admin_action(
                    action_type=AuditLog.ActionType.SYSTEM_SETTINGS_CHANGED,
                    description=f'Bulk updated {len(updated)} system settings',
                    admin_user=request.user,
                    target_type=AuditLog.TargetType.SYSTEM,
                    target_id='bulk_update',
                    metadata={'count': len(updated)},
                    category='system_settings',
                    request=request
                )
            except Exception as e:
                print(f"Error logging audit: {e}")
        
        return Response({'updated': updated})
