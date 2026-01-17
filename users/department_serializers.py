from rest_framework import serializers
from users.models_organization import Department, Office


class DepartmentSerializer(serializers.ModelSerializer):
    office_count = serializers.SerializerMethodField()
    member_count = serializers.SerializerMethodField()
    head_username = serializers.SerializerMethodField()

    class Meta:
        model = Department
        fields = ['id', 'name', 'description', 'manager', 'code', 'head', 'head_username', 'office_count', 'member_count', 'created_at']
        read_only_fields = ['id', 'created_at']

    def get_office_count(self, obj):
        return obj.offices.count()

    def get_member_count(self, obj):
        return obj.users.count()

    def get_head_username(self, obj):
        return obj.head.username if obj.head else None


class OfficeSerializer(serializers.ModelSerializer):
    member_count = serializers.SerializerMethodField()
    members = serializers.SerializerMethodField()

    class Meta:
        model = Office
        fields = ['id', 'name', 'description', 'manager', 'code', 'department', 'member_count', 'members', 'created_at']
        read_only_fields = ['id', 'created_at']

    def get_member_count(self, obj):
        return obj.users.count()

    def get_members(self, obj):
        return [{'id': u.id, 'name': u.get_full_name() or u.username, 'username': u.username} for u in obj.users.all()]
