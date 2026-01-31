            # Check if user is suspended or banned
            if user.status in ['suspended', 'banned']:
                return Response(
                    {'error': f'Your account is {user.status}'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Set user online
            user.online_status = 'online'
            user.save(update_fields=['online_status'])
            
            # Generate tokens
            refresh = RefreshToken.for_user(user)
            refresh['tv'] = user.token_version
            refresh.access_token['tv'] = user.token_version
            
            return Response({
                'user': UserSerializer(user).data,
                'tokens': {
                    'access': str(refresh.access_token),
                    'refresh': str(refresh)
                }
            }, status=status.HTTP_200_OK)
