from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from admin_panel.models import Backup
from admin_panel.serializers import BackupSerializer, BackupCreateSerializer
from admin_panel.services.backup_restore_service import BackupRestoreService
from users.views import IsAdminUser


class BackupViewSet(viewsets.ModelViewSet):
    queryset = Backup.objects.all().order_by('-created_at')
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get_serializer_class(self):
        if self.action in ['create']:
            return BackupCreateSerializer
        return BackupSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        backup_type = serializer.validated_data.get('backup_type')
        name = serializer.validated_data.get('name')
        description = serializer.validated_data.get('description', '')

        result = BackupRestoreService.create_backup(
            backup_type=backup_type,
            name=name,
            description=description,
            admin_user=request.user,
        )
        backup = Backup.objects.get(id=result['backup_id'])
        return Response(BackupSerializer(backup).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def status(self, request, pk=None):
        result = BackupRestoreService.get_backup_status(str(pk))
        return Response(result, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'])
    def validate(self, request, pk=None):
        result = BackupRestoreService.validate_backup(str(pk))
        return Response(result, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        result = BackupRestoreService.download_backup(str(pk), admin_user=request.user)
        return Response(result, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        restore_options = request.data.get('restore_options') if isinstance(request.data, dict) else None
        result = BackupRestoreService.restore_backup(str(pk), admin_user=request.user, restore_options=restore_options)
        return Response(result, status=status.HTTP_200_OK)
