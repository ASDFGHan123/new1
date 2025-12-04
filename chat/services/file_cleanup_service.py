"""
File cleanup and storage management service for OffChat application.
Provides automatic file cleanup, retention policies, and storage monitoring.
"""
import os
import shutil
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Dict, Any, Optional
from django.conf import settings
from django.core.files.storage import default_storage
from django.db import models
from django.utils import timezone
from django.core.management import call_command
from celery import shared_task
import psutil

from chat.models import Attachment

logger = logging.getLogger(__name__)


class FileCleanupService:
    """
    Service for managing file cleanup and storage operations.
    """
    
    # Storage thresholds (in MB)
    STORAGE_WARNING_THRESHOLD = 5000  # 5GB
    STORAGE_CRITICAL_THRESHOLD = 8000  # 8GB
    
    # File retention policies (in days)
    RETENTION_POLICIES = {
        'orphaned_attachments': 30,      # Delete attachments not linked to messages after 30 days
        'temp_uploads': 7,               # Delete temp uploads after 7 days
        'deleted_message_attachments': 90,  # Keep attachments of deleted messages for 90 days
        'system_backups': 30,            # Keep system backup files for 30 days
        'group_avatars': 365,            # Keep group avatars for 1 year
        'user_avatars': 365,             # Keep user avatars for 1 year
    }
    
    @classmethod
    def get_storage_info(cls) -> Dict[str, Any]:
        """
        Get current storage information and usage statistics.
        
        Returns:
            Dict containing storage usage information
        """
        try:
            # Get media directory size
            media_root = Path(settings.MEDIA_ROOT)
            total_size = cls._get_directory_size(media_root)
            
            # Get storage device info
            disk_usage = psutil.disk_usage(str(media_root))
            
            # Get attachment statistics
            attachment_stats = cls._get_attachment_stats()
            
            # Calculate storage status
            storage_status = cls._get_storage_status(total_size, disk_usage)
            
            return {
                'total_size_mb': round(total_size / (1024 * 1024), 2),
                'total_size_gb': round(total_size / (1024 * 1024 * 1024), 2),
                'available_space_gb': round(disk_usage.free / (1024 * 1024 * 1024), 2),
                'total_space_gb': round(disk_usage.total / (1024 * 1024 * 1024), 2),
                'usage_percent': round((disk_usage.used / disk_usage.total) * 100, 2),
                'storage_status': storage_status,
                'attachment_stats': attachment_stats,
                'last_cleanup': cls._get_last_cleanup_info(),
                'cleanup_suggested': cls._should_suggest_cleanup(total_size, disk_usage),
            }
        except Exception as e:
            logger.error(f"Error getting storage info: {str(e)}")
            return {
                'error': str(e),
                'total_size_mb': 0,
                'total_size_gb': 0,
                'storage_status': 'unknown',
            }
    
    @classmethod
    def _get_directory_size(cls, directory: Path) -> int:
        """Get total size of a directory in bytes."""
        total_size = 0
        try:
            for dirpath, dirnames, filenames in os.walk(directory):
                for filename in filenames:
                    filepath = os.path.join(dirpath, filename)
                    try:
                        total_size += os.path.getsize(filepath)
                    except (OSError, IOError):
                        continue
        except Exception as e:
            logger.error(f"Error calculating directory size for {directory}: {str(e)}")
        return total_size
    
    @classmethod
    def _get_attachment_stats(cls) -> Dict[str, Any]:
        """Get attachment statistics."""
        try:
            total_attachments = Attachment.objects.count()
            
            # Get attachment counts by type
            attachment_counts = {}
            for file_type in Attachment.FileType.choices:
                count = Attachment.objects.filter(file_type=file_type[0]).count()
                attachment_counts[file_type[0]] = count
            
            # Get file size statistics
            attachments_with_size = Attachment.objects.exclude(file_size__isnull=True)
            total_size = attachments_with_size.aggregate(
                total=models.Sum('file_size'),
                avg=models.Avg('file_size'),
                max=models.Max('file_size')
            )
            
            # Get orphaned attachments count
            orphaned_count = cls._get_orphaned_attachments_count()
            
            return {
                'total_attachments': total_attachments,
                'attachment_counts_by_type': attachment_counts,
                'total_size_mb': round((total_size['total'] or 0) / (1024 * 1024), 2),
                'average_size_mb': round((total_size['avg'] or 0) / (1024 * 1024), 2),
                'max_size_mb': round((total_size['max'] or 0) / (1024 * 1024), 2),
                'orphaned_count': orphaned_count,
                'cleanup_potential_mb': cls._calculate_cleanup_potential(),
            }
        except Exception as e:
            logger.error(f"Error getting attachment stats: {str(e)}")
            return {'error': str(e)}
    
    @classmethod
    def _get_orphaned_attachments_count(cls) -> int:
        """Get count of attachments that are not linked to any message."""
        return Attachment.objects.filter(message__isnull=True).count()
    
    @classmethod
    def _calculate_cleanup_potential(cls) -> int:
        """Calculate potential space that can be freed up by cleanup."""
        try:
            total_potential = 0
            
            # Orphaned attachments
            orphaned = Attachment.objects.filter(message__isnull=True)
            orphaned_size = orphaned.aggregate(total=models.Sum('file_size'))['total'] or 0
            total_potential += orphaned_size
            
            # Deleted message attachments
            deleted_message_attachments = Attachment.objects.filter(
                message__is_deleted=True,
                uploaded_at__lt=timezone.now() - timedelta(days=cls.RETENTION_POLICIES['deleted_message_attachments'])
            )
            deleted_size = deleted_message_attachments.aggregate(total=models.Sum('file_size'))['total'] or 0
            total_potential += deleted_size
            
            return round(total_potential / (1024 * 1024), 2)  # Convert to MB
        except Exception as e:
            logger.error(f"Error calculating cleanup potential: {str(e)}")
            return 0
    
    @classmethod
    def _get_storage_status(cls, total_size: int, disk_usage) -> str:
        """Determine storage status based on usage."""
        try:
            usage_percent = (disk_usage.used / disk_usage.total) * 100
            if usage_percent > 90:
                return 'critical'
            elif usage_percent > 80:
                return 'warning'
            else:
                return 'normal'
        except Exception as e:
            logger.error(f"Error determining storage status: {str(e)}")
            return 'unknown'
    
    @classmethod
    def _should_suggest_cleanup(cls, total_size: int, disk_usage) -> bool:
        """Check if cleanup should be suggested."""
        try:
            # Suggest cleanup if storage is over 80% or total media size > 5GB
            usage_percent = (disk_usage.used / disk_usage.total) * 100
            total_gb = total_size / (1024 * 1024 * 1024)
            
            return usage_percent > 80 or total_gb > 5
        except Exception as e:
            logger.error(f"Error checking cleanup suggestion: {str(e)}")
            return False
    
    @classmethod
    def _get_last_cleanup_info(cls) -> Optional[Dict[str, Any]]:
        """Get information about the last cleanup operation."""
        try:
            # Create a log file entry for cleanup operations
            log_file = Path(settings.MEDIA_ROOT) / 'cleanup_log.json'
            if log_file.exists():
                import json
                with open(log_file, 'r') as f:
                    logs = json.load(f)
                    if logs:
                        return logs[-1]  # Return the most recent log entry
        except Exception as e:
            logger.error(f"Error getting last cleanup info: {str(e)}")
        return None
    
    @classmethod
    def cleanup_orphaned_files(cls, dry_run: bool = False) -> Dict[str, Any]:
        """
        Clean up orphaned files (files not referenced in the database).
        
        Args:
            dry_run: If True, only log what would be deleted without actually deleting
            
        Returns:
            Dict with cleanup results
        """
        results = {
            'dry_run': dry_run,
            'deleted_files': [],
            'deleted_size_mb': 0,
            'errors': [],
            'timestamp': timezone.now().isoformat(),
        }
        
        try:
            # Get all files referenced in the database
            referenced_files = set()
            
            # Attachment files
            for attachment in Attachment.objects.all():
                if attachment.file:
                    referenced_files.add(str(attachment.file.name))
            
            # Group avatar files
            from chat.models import Group
            for group in Group.objects.all():
                if group.avatar:
                    referenced_files.add(str(group.avatar.name))
            
            # User avatar files
            from users.models import User
            for user in User.objects.all():
                if user.avatar:
                    referenced_files.add(str(user.avatar.name))
            
            # Check actual files in media directory
            media_root = Path(settings.MEDIA_ROOT)
            actual_files = set()
            
            for root, dirs, files in os.walk(media_root):
                for file in files:
                    if file.startswith('.'):  # Skip hidden files
                        continue
                    filepath = os.path.relpath(os.path.join(root, file), media_root)
                    actual_files.add(filepath.replace('\\', '/'))  # Normalize path separators
            
            # Find orphaned files
            orphaned_files = actual_files - referenced_files
            
            # Filter by retention policy
            cutoff_date = timezone.now() - timedelta(days=cls.RETENTION_POLICIES['orphaned_attachments'])
            files_to_delete = []
            
            for orphan in orphaned_files:
                try:
                    full_path = media_root / orphan
                    file_modified = datetime.fromtimestamp(full_path.stat().st_mtime)
                    if file_modified.replace(tzinfo=timezone.utc) < cutoff_date:
                        files_to_delete.append(orphan)
                except (OSError, IOError) as e:
                    results['errors'].append(f"Error checking file {orphan}: {str(e)}")
            
            # Delete orphaned files
            for file_path in files_to_delete:
                try:
                    full_path = media_root / file_path
                    file_size = full_path.stat().st_size
                    
                    if not dry_run:
                        full_path.unlink()
                    
                    results['deleted_files'].append(file_path)
                    results['deleted_size_mb'] += file_size / (1024 * 1024)
                    
                except (OSError, IOError) as e:
                    results['errors'].append(f"Error deleting file {file_path}: {str(e)}")
            
            # Log cleanup operation
            cls._log_cleanup_operation('orphaned_files', results)
            
        except Exception as e:
            results['errors'].append(f"Critical error during cleanup: {str(e)}")
            logger.error(f"Error during orphaned files cleanup: {str(e)}")
        
        results['deleted_files_count'] = len(results['deleted_files'])
        results['deleted_size_mb'] = round(results['deleted_size_mb'], 2)
        
        return results
    
    @classmethod
    def cleanup_temp_uploads(cls, dry_run: bool = False) -> Dict[str, Any]:
        """
        Clean up temporary upload files.
        
        Args:
            dry_run: If True, only log what would be deleted without actually deleting
            
        Returns:
            Dict with cleanup results
        """
        results = {
            'dry_run': dry_run,
            'deleted_files': [],
            'deleted_size_mb': 0,
            'errors': [],
            'timestamp': timezone.now().isoformat(),
        }
        
        try:
            media_root = Path(settings.MEDIA_ROOT)
            temp_directories = ['tmp', 'temp', 'uploads/temp']
            cutoff_date = timezone.now() - timedelta(days=cls.RETENTION_POLICIES['temp_uploads'])
            
            for temp_dir in temp_directories:
                temp_path = media_root / temp_dir
                if temp_path.exists():
                    for root, dirs, files in os.walk(temp_path):
                        for file in files:
                            try:
                                file_path = os.path.join(root, file)
                                full_path = Path(file_path)
                                file_modified = datetime.fromtimestamp(full_path.stat().st_mtime)
                                
                                if file_modified.replace(tzinfo=timezone.utc) < cutoff_date:
                                    file_size = full_path.stat().st_size
                                    
                                    if not dry_run:
                                        full_path.unlink()
                                    
                                    results['deleted_files'].append(str(full_path.relative_to(media_root)))
                                    results['deleted_size_mb'] += file_size / (1024 * 1024)
                                    
                            except (OSError, IOError) as e:
                                results['errors'].append(f"Error processing file {file_path}: {str(e)}")
            
            # Log cleanup operation
            cls._log_cleanup_operation('temp_uploads', results)
            
        except Exception as e:
            results['errors'].append(f"Critical error during temp cleanup: {str(e)}")
            logger.error(f"Error during temp uploads cleanup: {str(e)}")
        
        results['deleted_files_count'] = len(results['deleted_files'])
        results['deleted_size_mb'] = round(results['deleted_size_mb'], 2)
        
        return results
    
    @classmethod
    def cleanup_deleted_message_attachments(cls, dry_run: bool = False) -> Dict[str, Any]:
        """
        Clean up attachments from deleted messages according to retention policy.
        
        Args:
            dry_run: If True, only log what would be deleted without actually deleting
            
        Returns:
            Dict with cleanup results
        """
        results = {
            'dry_run': dry_run,
            'deleted_attachments': [],
            'deleted_size_mb': 0,
            'errors': [],
            'timestamp': timezone.now().isoformat(),
        }
        
        try:
            cutoff_date = timezone.now() - timedelta(days=cls.RETENTION_POLICIES['deleted_message_attachments'])
            
            # Find attachments from deleted messages that are older than retention period
            attachments_to_delete = Attachment.objects.filter(
                message__is_deleted=True,
                uploaded_at__lt=cutoff_date
            )
            
            for attachment in attachments_to_delete:
                try:
                    file_size = attachment.file_size
                    
                    if not dry_run:
                        # Delete the physical file
                        if attachment.file:
                            attachment.file.delete(save=False)
                        # Delete the database record
                        attachment.delete()
                    
                    results['deleted_attachments'].append(str(attachment.id))
                    results['deleted_size_mb'] += file_size / (1024 * 1024)
                    
                except Exception as e:
                    results['errors'].append(f"Error deleting attachment {attachment.id}: {str(e)}")
            
            # Log cleanup operation
            cls._log_cleanup_operation('deleted_message_attachments', results)
            
        except Exception as e:
            results['errors'].append(f"Critical error during deleted message cleanup: {str(e)}")
            logger.error(f"Error during deleted message attachments cleanup: {str(e)}")
        
        results['deleted_attachments_count'] = len(results['deleted_attachments'])
        results['deleted_size_mb'] = round(results['deleted_size_mb'], 2)
        
        return results
    
    @classmethod
    def _log_cleanup_operation(cls, operation_type: str, results: Dict[str, Any]) -> None:
        """Log cleanup operation details."""
        try:
            log_file = Path(settings.MEDIA_ROOT) / 'cleanup_log.json'
            
            log_entry = {
                'timestamp': results['timestamp'],
                'operation_type': operation_type,
                'dry_run': results['dry_run'],
                'deleted_count': results.get('deleted_files_count', 0) or results.get('deleted_attachments_count', 0),
                'deleted_size_mb': results['deleted_size_mb'],
                'errors_count': len(results['errors']),
            }
            
            # Read existing logs
            logs = []
            if log_file.exists():
                import json
                try:
                    with open(log_file, 'r') as f:
                        logs = json.load(f)
                except (json.JSONDecodeError, IOError):
                    logs = []
            
            # Add new log entry
            logs.append(log_entry)
            
            # Keep only last 100 log entries
            logs = logs[-100:]
            
            # Write back to file
            with open(log_file, 'w') as f:
                json.dump(logs, f, indent=2)
                
        except Exception as e:
            logger.error(f"Error logging cleanup operation: {str(e)}")
    
    @classmethod
    def run_comprehensive_cleanup(cls, dry_run: bool = False) -> Dict[str, Any]:
        """
        Run a comprehensive cleanup of all file types.
        
        Args:
            dry_run: If True, only log what would be deleted without actually deleting
            
        Returns:
            Dict with overall cleanup results
        """
        results = {
            'dry_run': dry_run,
            'start_time': timezone.now().isoformat(),
            'operations': {},
            'total_deleted_size_mb': 0,
            'total_errors': 0,
            'success': True,
        }
        
        try:
            # Run all cleanup operations
            operations = [
                ('orphaned_files', cls.cleanup_orphaned_files),
                ('temp_uploads', cls.cleanup_temp_uploads),
                ('deleted_message_attachments', cls.cleanup_deleted_message_attachments),
            ]
            
            for operation_name, operation_func in operations:
                logger.info(f"Running cleanup operation: {operation_name}")
                try:
                    result = operation_func(dry_run=dry_run)
                    results['operations'][operation_name] = result
                    results['total_deleted_size_mb'] += result['deleted_size_mb']
                    results['total_errors'] += len(result['errors'])
                    
                    if result['errors']:
                        logger.warning(f"Cleanup operation {operation_name} had {len(result['errors'])} errors")
                        
                except Exception as e:
                    logger.error(f"Error during {operation_name} cleanup: {str(e)}")
                    results['operations'][operation_name] = {
                        'error': str(e),
                        'success': False
                    }
                    results['success'] = False
            
            results['end_time'] = timezone.now().isoformat()
            results['total_deleted_size_mb'] = round(results['total_deleted_size_mb'], 2)
            
        except Exception as e:
            results['success'] = False
            results['error'] = str(e)
            logger.error(f"Error during comprehensive cleanup: {str(e)}")
        
        return results
    
    @classmethod
    def optimize_storage(cls) -> Dict[str, Any]:
        """
        Perform storage optimization operations.
        
        Returns:
            Dict with optimization results
        """
        results = {
            'optimizations_performed': [],
            'space_freed_mb': 0,
            'errors': [],
            'timestamp': timezone.now().isoformat(),
        }
        
        try:
            # Recompress image files
            media_root = Path(settings.MEDIA_ROOT)
            image_extensions = {'.jpg', '.jpeg', '.png', '.webp'}
            
            for root, dirs, files in os.walk(media_root):
                for file in files:
                    if Path(file).suffix.lower() in image_extensions:
                        try:
                            file_path = Path(root) / file
                            
                            # Skip files that are already small
                            if file_path.stat().st_size < 1024 * 1024:  # Less than 1MB
                                continue
                            
                            # This is a simplified compression - in production, you might want
                            # to use more sophisticated image processing
                            results['optimizations_performed'].append(f"Consider compression for {file_path}")
                            
                        except (OSError, IOError) as e:
                            results['errors'].append(f"Error optimizing {file_path}: {str(e)}")
            
            # Clean up empty directories
            empty_dirs_cleaned = cls._cleanup_empty_directories(media_root)
            results['optimizations_performed'].extend([f"Cleaned empty directory: {d}" for d in empty_dirs_cleaned])
            
        except Exception as e:
            results['errors'].append(f"Critical error during optimization: {str(e)}")
            logger.error(f"Error during storage optimization: {str(e)}")
        
        return results
    
    @classmethod
    def _cleanup_empty_directories(cls, root_path: Path) -> List[str]:
        """Clean up empty directories."""
        cleaned_dirs = []
        try:
            for root, dirs, files in os.walk(root_path, topdown=False):
                for dir_name in dirs:
                    dir_path = Path(root) / dir_name
                    try:
                        if dir_path.exists() and not any(dir_path.iterdir()):
                            dir_path.rmdir()
                            cleaned_dirs.append(str(dir_path.relative_to(root_path)))
                    except (OSError, IOError):
                        continue
        except Exception as e:
            logger.error(f"Error cleaning up empty directories: {str(e)}")
        
        return cleaned_dirs


@shared_task
def scheduled_file_cleanup():
    """
    Celery task for scheduled file cleanup.
    Runs automatically to maintain storage health.
    """
    try:
        logger.info("Starting scheduled file cleanup")
        results = FileCleanupService.run_comprehensive_cleanup(dry_run=False)
        logger.info(f"Scheduled cleanup completed. Freed {results['total_deleted_size_mb']} MB")
        return results
    except Exception as e:
        logger.error(f"Error in scheduled file cleanup: {str(e)}")
        raise


@shared_task
def scheduled_storage_check():
    """
    Celery task for scheduled storage health check.
    """
    try:
        logger.info("Running scheduled storage check")
        storage_info = FileCleanupService.get_storage_info()
        
        # Send alert if storage is critical
        if storage_info.get('storage_status') == 'critical':
            logger.warning(f"Critical storage level detected: {storage_info['usage_percent']}%")
            # In a real application, you might send email notifications here
            
        return storage_info
    except Exception as e:
        logger.error(f"Error in scheduled storage check: {str(e)}")
        raise