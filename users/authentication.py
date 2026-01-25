"""
Custom JWT Authentication that validates against blacklisted tokens.
"""
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import UntypedToken
from users.models import BlacklistedToken


class BlacklistValidatingJWTAuthentication(JWTAuthentication):
    """
    Custom JWT Authentication class that validates tokens against blacklist.
    """
    
    def authenticate(self, request):
        # First check if the request has an authorization header with Bearer token
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if not auth_header.startswith('Bearer '):
            # No Bearer token, let other authenticators handle this request
            return None
        
        try:
            # Extract the token manually to avoid the parent class issue
            raw_token = auth_header.split(' ')[1] if len(auth_header.split(' ')) > 1 else None
            
            if raw_token is None:
                return None
            
            # First validate the token signature and expiration using parent class
            validated_token = self.get_validated_token(raw_token)
            
            # Now check if the token is blacklisted
            if BlacklistedToken.is_token_blacklisted(raw_token):
                raise InvalidToken('Token is blacklisted')
            
            # Get the user associated with the token
            user = self.get_user(validated_token)

            token_version = validated_token.get('tv')
            if token_version is None:
                raise InvalidToken('Invalid token')

            if int(token_version) != int(getattr(user, 'token_version', 0)):
                raise InvalidToken('Token revoked')
            
            return user, validated_token
            
        except TokenError as e:
            raise InvalidToken(f'Invalid token: {str(e)}')
        except Exception as e:
            raise InvalidToken(f'Token validation failed: {str(e)}')