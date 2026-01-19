class AdminForceLogoutView(APIView):
    """Admin force logout view."""
    permission_classes = [IsAdminUser]
    
    def post(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
            
            # Set user offline
            user.set_offline()
            
            # Invalidate all active sessions
            UserSession.objects.filter(user=user, is_active=True).update(is_active=False)
            
            # Blacklist all active tokens
            from django.utils import timezone
            BlacklistedToken.objects.filter(
                user=user, 
                expires_at__gt=timezone.now()
            ).update(is_active=False)
            
            # Log admin action
            UserActivity.objects.create(
                user=request.user,
                action='admin_action',
                description=f'Force logged out user {user.username}',
                ip_address=self.get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            
            return Response({
                'message': f'User {user.username} force logged out successfully'
            }, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({
                'error': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
