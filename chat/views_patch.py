# Patch for FileUploadView - replace the post method in FileUploadView class

def post(self, request):
    if 'file' not in request.FILES:
        return Response({
            'error': 'No file provided'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    message_id = request.POST.get('message_id') or request.data.get('message_id')
    if not message_id:
        return Response({
            'error': 'Message ID is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        message = Message.objects.get(id=message_id)
        if not message.conversation.is_participant(request.user):
            return Response({
                'error': 'Permission denied'
            }, status=status.HTTP_403_FORBIDDEN)
    except Message.DoesNotExist:
        return Response({
            'error': 'Message not found'
        }, status=status.HTTP_404_NOT_FOUND)
    
    file = request.FILES['file']
    
    if file.size > 10 * 1024 * 1024:
        return Response({
            'error': 'File size cannot exceed 10MB'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    allowed_types = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'audio/mpeg', 'audio/wav', 'audio/ogg',
        'video/mp4', 'video/webm', 'video/ogg',
        'application/pdf', 'text/plain',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ]
    
    if file.content_type not in allowed_types:
        return Response({
            'error': 'File type not allowed'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    serializer = AttachmentCreateSerializer(
        data={'file': file},
        context={'message_id': message_id}
    )
    
    if serializer.is_valid():
        attachment = serializer.save()
        
        UserActivity.objects.create(
            user=request.user,
            action='file_uploaded',
            description=f'Uploaded file {attachment.file_name}',
            ip_address=self.get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        
        serializer = AttachmentSerializer(attachment)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
