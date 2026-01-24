"""
Trash models for soft delete functionality.
"""
from django.db import models
from django.utils import timezone
from django.contrib.auth import get_user_model

User = get_user_model()


class TrashItem(models.Model):
    """Model to track deleted items in trash."""
    
    ITEM_TYPES = [
        ('user', 'User'),
        ('message', 'Message'),
        ('conversation', 'Conversation'),
        ('group', 'Group'),
        ('department', 'Department'),
    ]
    
    item_type = models.CharField(max_length=20, choices=ITEM_TYPES)
    item_id = models.CharField(max_length=255)
    item_data = models.JSONField()  # Store original data
    deleted_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='deleted_items')
    deleted_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()  # Auto-delete after 30 days
    
    class Meta:
        db_table = 'trash_items'
        verbose_name = 'Trash Item'
        verbose_name_plural = 'Trash Items'
        ordering = ['-deleted_at']
        indexes = [
            models.Index(fields=['item_type']),
            models.Index(fields=['deleted_at']),
            models.Index(fields=['expires_at']),
        ]
    
    def __str__(self):
        return f"{self.item_type} - {self.item_id}"
    
    def is_expired(self):
        """Check if item has expired."""
        return timezone.now() > self.expires_at
    
    def restore(self):
        """Restore item from trash."""
        from utils.json_utils import prepare_metadata
        if self.item_type == 'user':
            user = User.objects.get(id=self.item_id)
            user.is_active = True
            user.status = 'active'
            user.save()
        self.delete()
    
    def permanent_delete(self):
        """Permanently delete item."""
        self.delete()
