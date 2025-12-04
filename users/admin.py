from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


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
