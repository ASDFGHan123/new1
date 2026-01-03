from rest_framework import serializers
from .models_organization import Department, Office, DepartmentOfficeUser
from users.models import User


class DepartmentSerializer(serializers.ModelSerializer):
    head_username = serializers.CharField(source='head.username', read_only=True, allow_null=True)
    office_count = serializers.SerializerMethodField()
    member_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Department
        fields = ['id', 'name', 'manager', 'code', 'head', 'head_username', 'office_count', 'member_count', 'description', 'created_at', 'updated_at']
    
    def get_office_count(self, obj):
        return obj.office_count
    
    def get_member_count(self, obj):
        return obj.member_count


class OfficeSerializer(serializers.ModelSerializer):
    department_name = serializers.SerializerMethodField()
    member_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Office
        fields = ['id', 'department', 'department_name', 'name', 'manager', 'code', 'member_count', 'description', 'created_at', 'updated_at']
    
    def get_department_name(self, obj):
        try:
            return obj.department.name
        except:
            return None
    
    def validate_department(self, value):
        if not Department.objects.filter(id=value.id).exists():
            raise serializers.ValidationError("Department does not exist.")
        return value
    
    def get_member_count(self, obj):
        return obj.member_count


class DepartmentOfficeUserSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    office_name = serializers.CharField(source='office.name', read_only=True)
    
    class Meta:
        model = DepartmentOfficeUser
        fields = ['id', 'user', 'user_username', 'department', 'department_name', 'office', 'office_name', 'status', 'joined_at', 'left_at']
