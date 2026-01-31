"""
File cleanup and storage management API views.
"""
import logging
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from chat.services.file_cleanup_service import FileCleanupService

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def storage_info_view(request):
    """
    Get current storage information and usage statistics.
    """
    try:
        storage_info = FileCleanupService.get_storage_info()
        return Response(storage_info, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error getting storage info: {str(e)}")
        return Response(
            {'error': 'Failed to retrieve storage information'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cleanup_orphaned_files_view(request):
    """
    Clean up orphaned files (files not referenced in the database).
    """
    try:
        dry_run = request.data.get('dry_run', False)
        results = FileCleanupService.cleanup_orphaned_files(dry_run=dry_run)
        return Response(results, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error during orphaned files cleanup: {str(e)}")
        return Response(
            {'error': 'Failed to clean up orphaned files'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cleanup_temp_uploads_view(request):
    """
    Clean up temporary upload files.
    """
    try:
        dry_run = request.data.get('dry_run', False)
        results = FileCleanupService.cleanup_temp_uploads(dry_run=dry_run)
        return Response(results, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error during temp uploads cleanup: {str(e)}")
        return Response(
            {'error': 'Failed to clean up temp uploads'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cleanup_deleted_message_attachments_view(request):
    """
    Clean up attachments from deleted messages.
    """
    try:
        dry_run = request.data.get('dry_run', False)
        results = FileCleanupService.cleanup_deleted_message_attachments(dry_run=dry_run)
        return Response(results, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error during deleted message attachments cleanup: {str(e)}")
        return Response(
            {'error': 'Failed to clean up deleted message attachments'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def comprehensive_cleanup_view(request):
    """
    Run a comprehensive cleanup of all file types.
    """
    try:
        dry_run = request.data.get('dry_run', False)
        results = FileCleanupService.run_comprehensive_cleanup(dry_run=dry_run)
        return Response(results, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error during comprehensive cleanup: {str(e)}")
        return Response(
            {'error': 'Failed to run comprehensive cleanup'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def optimize_storage_view(request):
    """
    Perform storage optimization operations.
    """
    try:
        results = FileCleanupService.optimize_storage()
        return Response(results, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error during storage optimization: {str(e)}")
        return Response(
            {'error': 'Failed to optimize storage'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def cleanup_logs_view(request):
    """
    Get cleanup operation logs.
    """
    try:
        # Get the most recent cleanup log entry
        last_cleanup = FileCleanupService._get_last_cleanup_info()
        
        # If we have a log file, read it to get history
        log_file_path = f"{FileCleanupService.__module__.split('.')[0]}/cleanup_log.json"
        
        logs_data = {
            'last_cleanup': last_cleanup,
            'available': last_cleanup is not None,
            'message': 'Cleanup logs available' if last_cleanup else 'No cleanup logs found'
        }
        
        return Response(logs_data, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error getting cleanup logs: {str(e)}")
        return Response(
            {'error': 'Failed to retrieve cleanup logs'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def schedule_cleanup_view(request):
    """
    Schedule a cleanup operation to run in the background.
    """
    try:
        cleanup_type = request.data.get('type', 'comprehensive')
        dry_run = request.data.get('dry_run', False)
        
        # Import and run the Celery task
        from chat.services.file_cleanup_service import scheduled_file_cleanup
        
        if cleanup_type == 'comprehensive':
            task = scheduled_file_cleanup.delay()
        else:
            return Response(
                {'error': 'Invalid cleanup type'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response({
            'task_id': task.id,
            'status': 'scheduled',
            'cleanup_type': cleanup_type,
            'dry_run': dry_run
        }, status=status.HTTP_202_ACCEPTED)
    except Exception as e:
        logger.error(f"Error scheduling cleanup: {str(e)}")
        return Response(
            {'error': 'Failed to schedule cleanup'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )