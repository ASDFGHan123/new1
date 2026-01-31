from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User
from .models_organization import Department, Office, DepartmentOfficeUser


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Admin configuration for User model."""
    
    list_display = ('username', 'email', 'first_name', 'last_name', 'role', 'status', 'is_active', 'is_staff')
    list_filter = ('role', 'status', 'is_active', 'is_staff', 'is_superuser', 'online_status')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'email', 'avatar', 'bio')}),
        ('Role & Status', {'fields': ('role', 'status', 'online_status')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined', 'created_at', 'updated_at')}),
        ('Statistics', {'fields': ('message_count', 'report_count')}),
        ('Email verification', {'fields': ('email_verified', 'email_verification_token')}),
    )


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'manager', 'head', 'office_count', 'member_count', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('name', 'description', 'manager', 'code')
    readonly_fields = ('id', 'created_at', 'updated_at')


@admin.register(Office)
class OfficeAdmin(admin.ModelAdmin):
    list_display = ('name', 'department', 'manager', 'member_count', 'created_at')
    list_filter = ('department', 'created_at')
    search_fields = ('name', 'manager', 'code')
    readonly_fields = ('id', 'created_at', 'updated_at')


@admin.register(DepartmentOfficeUser)
class DepartmentOfficeUserAdmin(admin.ModelAdmin):
    list_display = ('user', 'department', 'office', 'status', 'joined_at')
    list_filter = ('status', 'department', 'office', 'joined_at')
    search_fields = ('user__username', 'department__name', 'office__name')
    readonly_fields = ('id', 'joined_at')
