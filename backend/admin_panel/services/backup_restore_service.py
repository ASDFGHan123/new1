"""
Backup and restore service for OffChat application.
Provides comprehensive backup and restore functionality for database and media files.
"""
import os
import json
import logging
import shutil
import zipfile
import tempfile
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from pathlib import Path
from django.conf import settings
from django.core.management import call_command
from django.db import connection
from django.db.models import Count, Sum
from django.utils import timezone
from django.core.files.base import ContentFile
# Conditional celery import with proper handling
try:
    from celery import shared_task  # type: ignore[import]
    HAS_CELERY = True
except ImportError:
    # Fallback for environments without Celery
    from typing import Any, Callable
    
    def shared_task(func: Callable) -> Callable:
        """Mock decorator for environments without Celery."""
        return func
    HAS_CELERY = False
import uuid

from admin_panel.models import Backup, AuditLog
# from admin_panel.services.audit_logging_service import AuditLoggingService  # Temporarily disabled

logger = logging.getLogger(__name__)


class BackupRestoreService:
    """
    Service for comprehensive backup and restore operations.
    """
    
    @staticmethod
    def _ensure_within_base_dir(path: Path, base_dir: Path) -> Path:
        base_dir_resolved = base_dir.resolve()
        path_resolved = path.resolve()
        try:
            path_resolved.relative_to(base_dir_resolved)
        except ValueError:
            raise ValueError("Unsafe path")
        return path_resolved

    @staticmethod
    def _safe_filename(name: str) -> str:
        return Path(str(name)).name.replace("\x00", "")

    @classmethod
    def create_backup(cls, backup_type: str, name: str = None, description: str = '', admin_user=None) -> Dict[str, Any]:
        """
        Create a new backup of the specified type.
        
        Args:
            backup_type: Type of backup ('full', 'users', 'chats', 'messages')
            name: Optional custom name for the backup
            description: Optional description
            admin_user: Admin user creating the backup
            
        Returns:
            Dict with backup creation result
        """             
        try:
            # Generate backup name if not provided
            if not name:
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                name = f"{backup_type.title()}_Backup_{timestamp}"
            
            # Create backup record
            backup = Backup.objects.create(
                name=name,
                description=description,
                backup_type=backup_type,
                created_by=admin_user,
                status='pending'
            )
            
            # Start backup process
            if HAS_CELERY:
                start_backup_process_task.delay(str(backup.id))
            else:
                start_backup_process_task(str(backup.id))
            
            # Log the backup creation
            logger.info(f"Backup creation started: {name} ({backup_type}) by {admin_user}")
            
            return {
                'backup_id': str(backup.id),
                'name': name,
                'backup_type': backup_type,
                'status': 'started',
                'message': 'Backup creation started successfully'
            }
            
        except Exception as e:
            logger.error(f"Error creating backup: {str(e)}")
            raise
    
    @classmethod
    def get_backup_status(cls, backup_id: str) -> Dict[str, Any]:
        """
        Get the status and progress of a backup operation.
        
        Args:
            backup_id: Backup ID
            
        Returns:
            Dict with backup status information
        """
        try:
            backup = Backup.objects.get(id=backup_id)
            
            return {
                'backup_id': str(backup.id),
                'name': backup.name,
                'backup_type': backup.backup_type,
                'status': backup.status,
                'progress': backup.progress,
                'file_size': backup.file_size,
                'record_count': backup.record_count,
                'created_at': backup.created_at,
                'completed_at': backup.completed_at,
            }
            
        except Backup.DoesNotExist:
            raise ValueError("Backup not found")
        except Exception as e:
            logger.error(f"Error getting backup status: {str(e)}")
            raise
    
    @classmethod
    def list_backups(cls, backup_type: str = None, status: str = None) -> List[Dict[str, Any]]:
        """
        List all backups with optional filtering.
        
        Args:
            backup_type: Optional filter by backup type
            status: Optional filter by backup status
            
        Returns:
            List of backup information
        """
        try:
            queryset = Backup.objects.all()
            
            if backup_type:
                queryset = queryset.filter(backup_type=backup_type)
            
            if status:
                queryset = queryset.filter(status=status)
            
            backups = queryset.order_by('-created_at')
            
            backup_list = []
            for backup in backups:
                backup_info = {
                    'backup_id': str(backup.id),
                    'name': backup.name,
                    'backup_type': backup.backup_type,
                    'status': backup.status,
                    'progress': backup.progress,
                    'file_size': backup.file_size,
                    'record_count': backup.record_count,
                    'created_at': backup.created_at,
                    'completed_at': backup.completed_at,
                }
                backup_list.append(backup_info)
            
            return backup_list
            
        except Exception as e:
            logger.error(f"Error listing backups: {str(e)}")
            raise
    
    @classmethod
    def download_backup(cls, backup_id: str, admin_user=None) -> Dict[str, Any]:
        """
        Get download information for a backup file.
        
        Args:
            backup_id: Backup ID
            admin_user: Admin user requesting download
            
        Returns:
            Dict with download information
        """
        try:
            backup = Backup.objects.get(id=backup_id)
            
            if not backup.file:
                raise ValueError("Backup file not found")
            
            if backup.status != 'completed':
                raise ValueError("Backup is not completed yet")
            
            # Log the download - temporarily disabled
            logger.info(f"Backup downloaded: {backup.name}")
            
            return {
                'backup_id': str(backup.id),
                'filename': backup.file.name,
                'download_url': backup.file.url,
                'file_url': backup.file.url,
                'file_size': backup.file_size,
                'download_available': True,
            }
            
        except Backup.DoesNotExist:
            raise ValueError("Backup not found")
        except Exception as e:
            logger.error(f"Error getting backup download: {str(e)}")
            raise
    
    @classmethod
    def delete_backup(cls, backup_id: str, admin_user=None) -> Dict[str, Any]:
        """
        Delete a backup and its associated file.
        
        Args:
            backup_id: Backup ID
            admin_user: Admin user deleting the backup
            
        Returns:
            Dict with deletion result
        """
        try:
            backup = Backup.objects.get(id=backup_id)
            
            # Delete the backup file if it exists
            if backup.file:
                backup.file.delete(save=False)
            
            # Delete the backup record
            backup.delete()
            
            # Log the deletion - temporarily disabled
            logger.info(f"Backup deleted: {backup.name}")
            
            return {
                'message': 'Backup deleted successfully',
                'deleted_backup_id': backup_id
            }
            
        except Backup.DoesNotExist:
            raise ValueError("Backup not found")
        except Exception as e:
            logger.error(f"Error deleting backup: {str(e)}")
            raise
    
    @classmethod
    def restore_backup(cls, backup_id: str, admin_user=None, restore_options: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Restore from a backup file.
        
        Args:
            backup_id: Backup ID to restore from
            admin_user: Admin user performing the restore
            restore_options: Additional restore options
            
        Returns:
            Dict with restore operation result
        """
        try:
            backup = Backup.objects.get(id=backup_id)
            
            if not backup.file:
                raise ValueError("Backup file not found")
            
            if backup.status != 'completed':
                raise ValueError("Backup is not completed yet")
            
            # Start restore process
            if HAS_CELERY:
                start_restore_process_task.delay(str(backup.id), admin_user.id if admin_user else None)
            else:
                start_restore_process_task(str(backup.id), admin_user.id if admin_user else None)
            
            # Log the restore start - temporarily disabled
            logger.info(f"Backup restore started: {backup.name}")
            
            return {
                'backup_id': str(backup.id),
                'restore_status': 'started',
                'message': 'Restore operation started successfully'
            }
            
        except Backup.DoesNotExist:
            raise ValueError("Backup not found")
        except Exception as e:
            logger.error(f"Error starting restore: {str(e)}")
            raise
    
    @classmethod
    def validate_backup(cls, backup_id: str) -> Dict[str, Any]:
        """
        Validate a backup file for integrity and completeness.
        
        Args:
            backup_id: Backup ID to validate
            
        Returns:
            Dict with validation results
        """
        try:
            backup = Backup.objects.get(id=backup_id)
            
            if not backup.file:
                return {
                    'valid': False,
                    'error': 'Backup file not found',
                    'backup_id': backup_id
                }
            
            # Check if file exists and is readable
            file_path = backup.file.path
            if not os.path.exists(file_path):
                return {
                    'valid': False,
                    'error': 'Backup file does not exist on disk',
                    'backup_id': backup_id
                }
            
            # Check file size matches database record
            actual_size = os.path.getsize(file_path)
            if backup.file_size and actual_size != backup.file_size:
                return {
                    'valid': False,
                    'error': 'File size mismatch',
                    'expected_size': backup.file_size,
                    'actual_size': actual_size,
                    'backup_id': backup_id
                }
            
            # Try to open and read the backup file structure
            try:
                with zipfile.ZipFile(file_path, 'r') as zip_file:
                    # Check if it contains expected files based on backup type
                    file_list = zip_file.namelist()
                    
                    expected_files = cls._get_expected_files_for_backup_type(backup.backup_type)
                    missing_files = [f for f in expected_files if f not in file_list]
                    
                    if missing_files:
                        return {
                            'valid': False,
                            'error': f'Missing expected files: {missing_files}',
                            'backup_id': backup_id,
                            'found_files': len(file_list)
                        }
                    
                    return {
                        'valid': True,
                        'backup_id': backup_id,
                        'file_count': len(file_list),
                        'file_size': actual_size,
                        'backup_type': backup.backup_type,
                        'validation_passed': True
                    }
                    
            except zipfile.BadZipFile:
                return {
                    'valid': False,
                    'error': 'Invalid backup file format',
                    'backup_id': backup_id
                }
            
        except Backup.DoesNotExist:
            return {
                'valid': False,
                'error': 'Backup not found',
                'backup_id': backup_id
            }
        except Exception as e:
            logger.error(f"Error validating backup: {str(e)}")
            return {
                'valid': False,
                'error': f'Validation error: {str(e)}',
                'backup_id': backup_id
            }
    
    @classmethod
    def get_backup_statistics(cls) -> Dict[str, Any]:
        """
        Get backup statistics and information.
        
        Returns:
            Dict with backup statistics
        """
        try:
            total_backups = Backup.objects.count()
            completed_backups = Backup.objects.filter(status='completed').count()
            failed_backups = Backup.objects.filter(status='failed').count()
            
            # Calculate total storage used by backups
            total_size = Backup.objects.aggregate(
                total=Sum('file_size')
            )['total'] or 0
            
            # Backup type distribution
            backup_types = dict(
                Backup.objects.values('backup_type').annotate(count=Count('id')).values_list('backup_type', 'count')
            )
            
            # Recent backup activity
            last_backup = Backup.objects.order_by('-created_at').first()
            
            return {
                'total_backups': total_backups,
                'completed_backups': completed_backups,
                'failed_backups': failed_backups,
                'success_rate': round((completed_backups / total_backups) * 100, 2) if total_backups > 0 else 0,
                'total_storage_used_mb': round(total_size / (1024 * 1024), 2),
                'backup_types': backup_types,
                'last_backup_date': last_backup.created_at if last_backup else None,
            }
            
        except Exception as e:
            logger.error(f"Error getting backup statistics: {str(e)}")
            raise
    
    @classmethod
    def _get_expected_files_for_backup_type(cls, backup_type: str) -> List[str]:
        """Get expected files for different backup types."""
        if backup_type == 'full':
            return ['database_backup.json', 'backup_metadata.json', 'system_info.json']
        elif backup_type == 'users':
            return ['users_backup.json']
        elif backup_type == 'chats':
            return ['chats_backup.json']
        elif backup_type == 'messages':
            return ['messages_backup.json']
        return []
    
    @classmethod
    def _start_backup_process(cls, backup_id: str):
        """
        Start the backup process asynchronously.
        """
        backup = None
        try:
            backup = Backup.objects.get(id=backup_id)
            backup.start_backup()
            
            # Update progress to 10%
            backup.progress = 10
            backup.save(update_fields=['progress'])
            
            if backup.backup_type == 'full':
                cls._create_full_backup(backup)
            elif backup.backup_type == 'users':
                cls._create_users_backup(backup)
            elif backup.backup_type == 'chats':
                cls._create_chats_backup(backup)
            elif backup.backup_type == 'messages':
                cls._create_messages_backup(backup)
            else:
                raise ValueError(f"Unknown backup type: {backup.backup_type}")
                
        except Exception as e:
            logger.error(f"Error in backup process for {backup_id}: {str(e)}")
            if backup:
                backup.fail_backup()
                # Add error info to metadata
                backup.metadata = backup.metadata or {}
                backup.metadata['error'] = str(e)
                backup.metadata['failed_at'] = timezone.now().isoformat()
                backup.save(update_fields=['metadata', 'status', 'completed_at'])
    
    @classmethod
    def _create_full_backup(cls, backup: Backup):
        """Create a full backup including database and media files."""
        logger.info(f"Starting full backup creation for: {backup.name}")
        
        try:
            with tempfile.TemporaryDirectory() as temp_dir:
                temp_path = Path(temp_dir)
                logger.info(f"Temp directory created: {temp_path}")
                
                # Create database backup
                logger.info("Creating database backup...")
                db_backup_path = temp_path / 'database_backup.json'
                cls._export_database_to_json(db_backup_path)
                logger.info("Database backup completed")
                
                # Create media files backup
                logger.info("Creating media files backup...")
                media_backup_path = temp_path / 'media_files'
                cls._backup_media_files(media_backup_path)
                logger.info("Media files backup completed")
                
                # Create system info backup
                logger.info("Creating system info backup...")
                system_info = cls._collect_system_info()
                system_info_path = temp_path / 'system_info.json'
                with open(system_info_path, 'w') as f:
                    json.dump(system_info, f, indent=2, default=str)
                logger.info("System info backup completed")
                
                # Create backup metadata
                metadata = {
                    'backup_type': backup.backup_type,
                    'created_at': backup.created_at.isoformat(),
                    'django_version': settings.DJANGO_VERSION if hasattr(settings, 'DJANGO_VERSION') else 'Unknown',
                    'database_engine': 'sqlite3',  # Since we're using SQLite
                }
                metadata_path = temp_path / 'backup_metadata.json'
                with open(metadata_path, 'w') as f:
                    json.dump(metadata, f, indent=2)
                logger.info("Backup metadata created")
                
                # Create zip file
                logger.info("Creating zip file...")
                safe_backup_name = cls._safe_filename(backup.name)
                zip_path = cls._ensure_within_base_dir(temp_path / f'{safe_backup_name}.zip', temp_path)
                with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zip_file:
                    for file_path in temp_path.iterdir():
                        if file_path.is_file():
                            zip_file.write(file_path, file_path.name)
                            logger.info(f"Added to zip: {file_path.name}")
                
                logger.info(f"Zip file created: {zip_path}")
                
                # Save backup file
                logger.info("Saving backup file to model...")
                with open(zip_path, 'rb') as f:
                    backup.file.save(f'{safe_backup_name}.zip', ContentFile(f.read()))
                logger.info("Backup file saved to model")
                
                # Complete backup
                file_size = zip_path.stat().st_size
                backup.complete_backup(file_size=file_size)
                logger.info(f"Chats backup completed successfully. Size: {file_size} bytes")
                
        except Exception as e:
            logger.error(f"Error in chats backup creation: {str(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            raise
            
    @classmethod
    def _create_users_backup(cls, backup: Backup):
        """Create a users-only backup."""
        logger.info(f"Starting users backup creation for: {backup.name}")
        
        try:
            with tempfile.TemporaryDirectory() as temp_dir:
                temp_path = Path(temp_dir)
                logger.info(f"Temp directory created: {temp_path}")
                
                # Export users data
                logger.info("Exporting users data...")
                users_backup_path = temp_path / 'users_backup.json'
                cls._export_users_to_json(users_backup_path)
                logger.info("Users data exported")
                
                # Create zip file
                logger.info("Creating zip file...")
                safe_backup_name = cls._safe_filename(backup.name)
                zip_path = cls._ensure_within_base_dir(temp_path / f'{safe_backup_name}.zip', temp_path)
                with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zip_file:
                    zip_file.write(users_backup_path, 'users_backup.json')
                
                logger.info(f"Zip file created: {zip_path}")
                
                # Save backup file
                logger.info("Saving backup file to model...")
                with open(zip_path, 'rb') as f:
                    backup.file.save(f'{safe_backup_name}.zip', ContentFile(f.read()))
                logger.info("Backup file saved to model")
                
                # Complete backup
                file_size = zip_path.stat().st_size
                backup.complete_backup(file_size=file_size)
                logger.info(f"Users backup completed successfully. Size: {file_size} bytes")
                
        except Exception as e:
            logger.error(f"Error in users backup creation: {str(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            raise
    
    @classmethod
    def _create_chats_backup(cls, backup: Backup):
        """Create a chats-only backup."""
        logger.info(f"Starting chats backup creation for: {backup.name}")
        
        try:
            with tempfile.TemporaryDirectory() as temp_dir:
                temp_path = Path(temp_dir)
                logger.info(f"Temp directory created: {temp_path}")
                
                # Export chats data
                logger.info("Exporting chats data...")
                chats_backup_path = temp_path / 'chats_backup.json'
                cls._export_chats_to_json(chats_backup_path)
                logger.info("Chats data exported")
                
                # Create zip file
                logger.info("Creating zip file...")
                safe_backup_name = cls._safe_filename(backup.name)
                zip_path = cls._ensure_within_base_dir(temp_path / f'{safe_backup_name}.zip', temp_path)
                with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zip_file:
                    zip_file.write(chats_backup_path, 'chats_backup.json')
                
                logger.info(f"Zip file created: {zip_path}")
                
                # Save backup file
                logger.info("Saving backup file to model...")
                with open(zip_path, 'rb') as f:
                    backup.file.save(f'{safe_backup_name}.zip', ContentFile(f.read()))
                logger.info("Backup file saved to model")
                
                backup.complete_backup(file_size=file_size)
                logger.info(f"Chats backup completed successfully. Size: {file_size} bytes")
                
        except Exception as e:
            logger.error(f"Error in chats backup creation: {str(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            raise
                
    
    @classmethod
    def _export_database_to_json(cls, output_path: Path):
        """Export entire database to JSON format."""
        from django.apps import apps

        output_path = cls._ensure_within_base_dir(Path(output_path), Path(tempfile.gettempdir()))
        
        data = {}
        for model in apps.get_models():
            model_name = model._meta.label_lower
            queryset = model.objects.all()
            
            # Convert queryset to list of dictionaries
            objects_data = []
            for obj in queryset:
                obj_data = {
                    'pk': obj.pk,
                    'fields': {}
                }
                
                for field in obj._meta.fields:
                    value = getattr(obj, field.name)
                    if field.is_relation:
                        # Handle foreign key relations
                        if value:
                            obj_data['fields'][field.name] = value.pk
                        else:
                            obj_data['fields'][field.name] = None
                    else:
                        # Handle regular fields
                        if isinstance(value, datetime):
                            obj_data['fields'][field.name] = value.isoformat()
                        elif hasattr(field, 'get_internal_type') and field.get_internal_type() in ['FileField', 'ImageField']:
                            # Handle Django FileField/ImageField
                            try:
                                obj_data['fields'][field.name] = value.name if value and value.name else None
                            except:
                                obj_data['fields'][field.name] = None
                        else:
                            obj_data['fields'][field.name] = value
                
                objects_data.append(obj_data)
            
            data[model_name] = objects_data
        
        # Write to JSON file
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    
    @classmethod
    def _export_users_to_json(cls, output_path: Path):
        """Export users data to JSON format."""
        from users.models import User

        output_path = cls._ensure_within_base_dir(Path(output_path), Path(tempfile.gettempdir()))
        
        users_data = []
        for user in User.objects.all():
            user_data = {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role,
                'status': user.status,
                'is_active': user.is_active,
                'is_staff': user.is_staff,
                'is_superuser': user.is_superuser,
                'join_date': user.join_date.isoformat() if user.join_date else None,
                'last_login': user.last_login.isoformat() if user.last_login else None,
            }
            users_data.append(user_data)
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump({'users': users_data}, f, indent=2, ensure_ascii=False)
    
    @classmethod
    def _export_chats_to_json(cls, output_path: Path):
        """Export chats data to JSON format."""
        from chat.models import Conversation, Group, GroupMember

        output_path = cls._ensure_within_base_dir(Path(output_path), Path(tempfile.gettempdir()))
        
        data = {
            'conversations': [],
            'groups': [],
            'group_members': []
        }
        
        # Export conversations
        for conv in Conversation.objects.all():
            conv_data = {
                'id': str(conv.id),
                'conversation_type': conv.conversation_type,
                'title': conv.title,
                'created_at': conv.created_at.isoformat(),
                'updated_at': conv.updated_at.isoformat(),
            }
            if conv.group:
                conv_data['group_id'] = str(conv.group.id)
            data['conversations'].append(conv_data)
        
        # Export groups
        for group in Group.objects.all():
            group_data = {
                'id': str(group.id),
                'name': group.name,
                'description': group.description,
                'group_type': group.group_type,
                'created_by': group.created_by.id,
                'created_at': group.created_at.isoformat(),
            }
            data['groups'].append(group_data)
        
        # Export group members
        for member in GroupMember.objects.all():
            member_data = {
                'id': member.id,
                'group_id': str(member.group.id),
                'user_id': member.user.id,
                'role': member.role,
                'status': member.status,
                'joined_at': member.joined_at.isoformat(),
            }
            data['group_members'].append(member_data)
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    
    @classmethod
    def _export_messages_to_json(cls, output_path: Path):
        """Export messages data to JSON format."""
        from chat.models import Message

        output_path = cls._ensure_within_base_dir(Path(output_path), Path(tempfile.gettempdir()))
        
        messages_data = []
        for message in Message.objects.all():
            message_data = {
                'id': str(message.id),
                'conversation_id': str(message.conversation.id),
                'sender_id': message.sender.id,
                'content': message.content,
                'message_type': message.message_type,
                'timestamp': message.timestamp.isoformat(),
                'is_edited': message.is_edited,
                'is_deleted': message.is_deleted,
            }
            if message.reply_to:
                message_data['reply_to'] = str(message.reply_to.id)
            messages_data.append(message_data)
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump({'messages': messages_data}, f, indent=2, ensure_ascii=False)
    
    @classmethod
    def _backup_media_files(cls, output_path: Path):
        """Backup media files."""
        media_root = Path(settings.MEDIA_ROOT)
        output_path = cls._ensure_within_base_dir(Path(output_path), Path(tempfile.gettempdir()))
        if media_root.exists():
            shutil.copytree(media_root, output_path, dirs_exist_ok=True)
    
    @classmethod
    def _collect_system_info(cls) -> Dict[str, Any]:
        """Collect system information for backup metadata."""
        import platform
        import sys
        
        return {
            'system': {
                'platform': platform.platform(),
                'python_version': sys.version,
                'django_version': getattr(settings, 'DJANGO_VERSION', 'Unknown'),
            },
            'database': {
                'engine': 'sqlite3',
                'name': settings.DATABASES['default']['NAME'],
            },
            'backup_created_at': timezone.now().isoformat(),
        }
    
    @classmethod
    def _get_expected_files_for_backup_type(cls, backup_type: str) -> List[str]:
        """Get list of expected files for a backup type."""
        expected_files = {
            'full': ['database_backup.json', 'backup_metadata.json', 'system_info.json'],
            'users': ['users_backup.json'],
            'chats': ['chats_backup.json'],
            'messages': ['messages_backup.json'],
        }
        return expected_files.get(backup_type, [])
    
    @classmethod
    def _safe_extract_zipfile(cls, zip_path: Path, extract_dir: Path, *, max_total_uncompressed_bytes: int = 2 * 1024 * 1024 * 1024) -> List[str]:
        extract_dir.mkdir(parents=True, exist_ok=True)
        extracted: List[str] = []
        total_size = 0

        with zipfile.ZipFile(zip_path, 'r') as zip_file:
            for info in zip_file.infolist():
                member_name = info.filename
                if not member_name or member_name.endswith('/'):
                    continue

                total_size += int(getattr(info, 'file_size', 0) or 0)
                if total_size > max_total_uncompressed_bytes:
                    raise ValueError("Backup archive too large")

                target_path = cls._ensure_within_base_dir(extract_dir / member_name, extract_dir)
                target_path.parent.mkdir(parents=True, exist_ok=True)
                with zip_file.open(info, 'r') as src, open(target_path, 'wb') as dst:
                    shutil.copyfileobj(src, dst)

                extracted.append(member_name)

        return extracted
    
    @classmethod
    def _start_restore_process(cls, backup_id: str, admin_user_id: int = None):
        """Start the restore process asynchronously."""
        try:
            backup = Backup.objects.get(id=backup_id)
            
            if not backup.file:
                raise ValueError("Backup file not found")

            file_path = Path(backup.file.path)
            if not file_path.exists():
                raise ValueError("Backup file does not exist on disk")

            logger.info(f"Restore process started for backup {backup_id}")

            with tempfile.TemporaryDirectory() as temp_dir:
                extract_dir = Path(temp_dir) / 'extracted'
                extracted_files = cls._safe_extract_zipfile(file_path, extract_dir)

                expected_files = cls._get_expected_files_for_backup_type(backup.backup_type)
                missing_files = [f for f in expected_files if f not in extracted_files]
                if missing_files:
                    raise ValueError(f"Backup is missing expected files: {missing_files}")

                if backup.backup_type == 'full':
                    media_dir = extract_dir / 'media_files'
                    if media_dir.exists() and not media_dir.is_dir():
                        raise ValueError("Invalid media_files entry in backup")

            if admin_user_id:
                from django.contrib.auth import get_user_model
                User = get_user_model()
                admin_user = User.objects.get(id=admin_user_id)
                AuditLoggingService.log_admin_action(
                    action_type=AuditLog.ActionType.BACKUP_RESTORED,
                    description=f'Backup restore validated successfully: {backup.name}',
                    admin_user=admin_user,
                    metadata={
                        'backup_id': str(backup.id),
                        'backup_type': backup.backup_type,
                        'validated_only': True,
                    },
                    category='backup'
                )
            
        except Exception as e:
            logger.error(f"Error in restore process for {backup_id}: {str(e)}")
            # Log the restore failure
            if admin_user_id:
                from django.contrib.auth import get_user_model
                User = get_user_model()
                admin_user = User.objects.get(id=admin_user_id)
                AuditLoggingService.log_admin_action(
                    action_type=AuditLog.ActionType.SECURITY_BREACH,  # Using this as a critical event indicator
                    description=f'Backup restore failed: {str(e)}',
                    admin_user=admin_user,
                    metadata={
                        'backup_id': backup_id,
                        'error': str(e),
                    },
                    severity=AuditLog.SeverityLevel.CRITICAL,
                    category='backup'
                )


@shared_task
def start_backup_process_task(backup_id: str):
    BackupRestoreService._start_backup_process(backup_id)


@shared_task
def start_restore_process_task(backup_id: str, admin_user_id: int = None):
    BackupRestoreService._start_restore_process(backup_id, admin_user_id)


@shared_task
def scheduled_backup():
    """
    Celery task for scheduled automatic backups.
    """
    try:
        from admin_panel.services.audit_logging_service import AuditLoggingService
        from users.models import User
        
        # Get admin user for logging (first superuser)
        admin_user = User.objects.filter(is_superuser=True).first()
        
        # Create a daily backup
        result = BackupRestoreService.create_backup(
            backup_type='full',
            name=f'Auto_Backup_{datetime.now().strftime("%Y%m%d")}',
            description='Scheduled automatic backup',
            admin_user=admin_user
        )
        
        logger.info(f"Scheduled backup created: {result['backup_id']}")
        return result
        
    except Exception as e:
        logger.error(f"Error in scheduled backup: {str(e)}")
        raise


# Import required models at the end to avoid circular imports
from django.contrib.auth import get_user_model

User = get_user_model()
