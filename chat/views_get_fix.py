def get(self, request):
    from rest_framework.pagination import PageNumberPagination
    conversations = Conversation.objects.filter(is_deleted=False).filter(
        Q(participants=request.user) |
        Q(conversation_type='group', group__members__user=request.user, group__members__status='active')
    ).distinct().order_by('-last_message_at', '-created_at')
    
    paginator = PageNumberPagination()
    paginator.page_size = 20
    result_page = paginator.paginate_queryset(conversations, request)
    serializer = ConversationSerializer(result_page, many=True, context={'request': request})
    return paginator.get_paginated_response(serializer.data)
