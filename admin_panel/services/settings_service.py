"""
Settings service for reading and caching system settings.
"""
from django.core.cache import cache
from admin_panel.models import SystemSettings
import logging

logger = logging.getLogger(__name__)

class SettingsService:
    """Service for managing system settings with caching."""
    
    CACHE_TIMEOUT = 3600  # 1 hour
    CACHE_KEY_PREFIX = 'setting_'
    
    @classmethod
    def get(cls, key, default=None):
        """Get a setting value with caching."""
        cache_key = f"{cls.CACHE_KEY_PREFIX}{key}"
        value = cache.get(cache_key)
        
        if value is None:
            try:
                setting = SystemSettings.objects.get(key=key)
                value = setting.value
                cache.set(cache_key, value, cls.CACHE_TIMEOUT)
            except SystemSettings.DoesNotExist:
                value = default
        
        return value
    
    @classmethod
    def get_int(cls, key, default=0):
        """Get a setting as integer."""
        value = cls.get(key, default)
        try:
            return int(value)
        except (ValueError, TypeError):
            return default
    
    @classmethod
    def get_bool(cls, key, default=False):
        """Get a setting as boolean."""
        value = cls.get(key, default)
        if isinstance(value, bool):
            return value
        return str(value).lower() in ('true', '1', 'yes', 'on')
    
    @classmethod
    def set(cls, key, value):
        """Set a setting value and clear cache."""
        try:
            setting, created = SystemSettings.objects.get_or_create(key=key)
            setting.value = str(value)
            setting.save()
            cache_key = f"{cls.CACHE_KEY_PREFIX}{key}"
            cache.delete(cache_key)
            return True
        except Exception as e:
            logger.error(f"Error setting {key}: {e}")
            return False
    
    @classmethod
    def clear_cache(cls, key=None):
        """Clear cache for a specific setting or all settings."""
        if key:
            cache_key = f"{cls.CACHE_KEY_PREFIX}{key}"
            cache.delete(cache_key)
        else:
            cache.delete_many([f"{cls.CACHE_KEY_PREFIX}{s.key}" for s in SystemSettings.objects.all()])
