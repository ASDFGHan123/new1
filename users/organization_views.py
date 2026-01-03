from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, BasePermission
from django.utils import timezone
from datetime import timedelta
from .models_organization import Department, Office, DepartmentOfficeUser
from .organization_serializers import DepartmentSerializer, OfficeSerializer, DepartmentOfficeUserSerializer
from users.trash_models import TrashItem
from admin_panel.models import AuditLog
from admin_panel.services.audit_logging_service import AuditLoggingService


class IsAdminRole(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'admin'


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminRole()]
        return [IsAuthenticated()]
    
    def destroy(self, request, *args, **kwargs):
        department = self.get_object()
        action = request.data.get('action', 'permanent') if request.data else 'permanent'
        
        if action == 'trash':
            TrashItem.objects.create(
                item_type='department',
                item_id=str(department.id),
                deleted_by=request.user,
                item_data={'name': department.name, 'description': department.description},
                expires_at=timezone.now() + timedelta(days=30)
            )
            AuditLoggingService.log_admin_action(
                action_type=AuditLog.ActionType.ITEM_MOVED_TO_TRASH,
                description=f'Department moved to trash: {department.name}',
                admin_user=request.user,
                target_type=AuditLog.TargetType.SYSTEM,
                request=request
            )
            department.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        else:
            AuditLoggingService.log_admin_action(
                action_type=AuditLog.ActionType.PERMANENT_DELETE,
                description=f'Department permanently deleted: {department.name}',
                admin_user=request.user,
                target_type=AuditLog.TargetType.SYSTEM,
                request=request
            )
            return super().destroy(request, *args, **kwargs)
    
    @action(detail=True, methods=['get'])
    def offices(self, request, pk=None):
        department = self.get_object()
        offices = department.offices.all()
        serializer = OfficeSerializer(offices, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def members(self, request, pk=None):
        department = self.get_object()
        members = department.members.filter(status='active')
        serializer = DepartmentOfficeUserSerializer(members, many=True)
        return Response(serializer.data)


class OfficeViewSet(viewsets.ModelViewSet):
    queryset = Office.objects.all()
    serializer_class = OfficeSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminRole()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        queryset = Office.objects.all()
        department_id = self.request.query_params.get('department_id')
        if department_id:
            queryset = queryset.filter(department_id=department_id)
        return queryset
    
    def destroy(self, request, *args, **kwargs):
        office = self.get_object()
        action = request.data.get('action', 'permanent') if request.data else 'permanent'
        
        if action == 'trash':
            TrashItem.objects.create(
                item_type='office',
                item_id=str(office.id),
                deleted_by=request.user,
                item_data={'name': office.name, 'description': office.description, 'department_id': str(office.department_id)},
                expires_at=timezone.now() + timedelta(days=30)
            )
            office.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        else:
            return super().destroy(request, *args, **kwargs)
    
    @action(detail=True, methods=['get'])
    def members(self, request, pk=None):
        office = self.get_object()
        members = office.members.filter(status='active')
        serializer = DepartmentOfficeUserSerializer(members, many=True)
        return Response(serializer.data)


class DepartmentOfficeUserViewSet(viewsets.ModelViewSet):
    queryset = DepartmentOfficeUser.objects.all()
    serializer_class = DepartmentOfficeUserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'mark_as_left']:
            return [IsAdminRole()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        queryset = DepartmentOfficeUser.objects.all()
        user_id = self.request.query_params.get('user_id')
        department_id = self.request.query_params.get('department_id')
        office_id = self.request.query_params.get('office_id')
        status_filter = self.request.query_params.get('status')
        
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        if department_id:
            queryset = queryset.filter(department_id=department_id)
        if office_id:
            queryset = queryset.filter(office_id=office_id)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset
    
    @action(detail=True, methods=['post'])
    def mark_as_left(self, request, pk=None):
        assignment = self.get_object()
        assignment.mark_as_left()
        serializer = self.get_serializer(assignment)
        return Response(serializer.data)
