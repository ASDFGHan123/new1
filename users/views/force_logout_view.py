@api_view(['POST'])
@permission_classes([IsAdminUser])
def force_logout_user_view(request, user_id):
    """
    Force logout a user by invalidating their sessions and tokens.
    """
    try:
        from users.models import User, UserSession, BlacklistedToken
        from rest_framework_simplejwt.tokens import AccessToken
        from django.utils import timezone
        
        user = User.objects.get(id=user_id)
        
        # Invalidate all user sessions
        UserSession.objects.filter(user=user, is_active=True).update(is_active=False)
        
        # Blacklist all active tokens
        active_tokens = BlacklistedToken.objects.filter(user=user, expires_at__gt=timezone.now())
        for token_obj in active_tokens:
            token_obj.is_active = False
            token_obj.save()
        
        # Set user offline
        user.set_offline()
        
        return Response({
            'message': f'User {user.username} has been force logged out',
            'user_id': user_id
        }, status=status.HTTP_200_OK)
        
    except User.DoesNotExist:
        return Response(
            {'error': 'User not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error force logging out user: {str(e)}")
        return Response(
            {'error': 'Failed to force logout user'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
