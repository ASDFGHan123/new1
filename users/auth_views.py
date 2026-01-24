"""
Secure authentication views with input validation.
"""
import logging
from django.contrib.auth import authenticate
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.exceptions import ValidationError
from django.core.validators import EmailValidator

from users.models import User, BlacklistedToken
from users.serializers import UserSerializer

logger = logging.getLogger(__name__)

def validate_login_input(username: str, password: str) -> tuple[bool, str]:
    """Validate login input."""
    if not username or not password:
        return False, "Username and password are required"
    
    if len(username) > 150:
        return False, "Username too long"
    
    if len(password) > 128:
        return False, "Password too long"
    
    return True, ""

def validate_signup_input(username: str, email: str, password: str) -> tuple[bool, str]:
    """Validate signup input."""
    if not username or not password:
        return False, "Username and password are required"
    
    if len(username) < 3 or len(username) > 150:
        return False, "Username must be 3-150 characters"
    
    if len(password) < 8 or len(password) > 128:
        return False, "Password must be 8-128 characters"
    
    # Validate email format if provided
    if email:
        try:
            EmailValidator()(email)
        except ValidationError:
            return False, "Invalid email format"
        
        if User.objects.filter(email=email).exists():
            return False, "Email already exists"
    
    if User.objects.filter(username=username).exists():
        return False, "Username already exists"
    
    return True, ""

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """Secure login endpoint."""
    try:
        username = request.data.get('username', '').strip()
        password = request.data.get('password', '').strip()
        
        # Validate input
        is_valid, error_msg = validate_login_input(username, password)
        if not is_valid:
            logger.warning(f"Invalid login attempt: {error_msg}")
            return Response(
                {'error': error_msg},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Authenticate user
        user = authenticate(username=username, password=password)
        if not user:
            logger.warning(f"Failed login attempt for username: {username}")
            return Response(
                {'error': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Check if user is active
        if not user.is_active:
            logger.warning(f"Login attempt for inactive user: {username}")
            return Response(
                {'error': 'Account is inactive'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if user is pending approval
        if user.status == 'pending':
            logger.warning(f"Login attempt for pending user: {username}")
            return Response(
                {'error': 'Your account is pending admin approval'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if user is suspended or banned
        if user.status in ['suspended', 'banned']:
            logger.warning(f"Login attempt for {user.status} user: {username}")
            return Response(
                {'error': f'Your account is {user.status}'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Set user online status
        user.online_status = 'online'
        user.save(update_fields=['online_status'])
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        
        logger.info(f"User logged in: {username}")
        
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'access': str(refresh.access_token),
                'refresh': str(refresh)
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return Response(
            {'error': 'Login failed'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([AllowAny])
def signup_view(request):
    """Secure signup endpoint."""
    try:
        username = request.data.get('username', '').strip()
        email = request.data.get('email', '').strip()
        password = request.data.get('password', '').strip()
        
        # Validate input
        is_valid, error_msg = validate_signup_input(username, email, password)
        if not is_valid:
            logger.warning(f"Invalid signup attempt: {error_msg}")
            return Response(
                {'error': error_msg},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create user with generated email if not provided
        user_email = email if email else f"{username}@offchat.local"
        
        user = User.objects.create_user(
            username=username,
            email=user_email,
            password=password,
            status='pending'
        )
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        
        logger.info(f"New user registered: {username}")
        
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'access': str(refresh.access_token),
                'refresh': str(refresh)
            }
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        logger.error(f"Signup error: {str(e)}")
        return Response(
            {'error': 'Signup failed'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """Logout endpoint - blacklist refresh token and set offline."""
    try:
        # Blacklist refresh token with proper expiration
        refresh_token = request.data.get('refresh')
        if refresh_token:
            try:
                from rest_framework_simplejwt.tokens import RefreshToken as RT
                token = RT(refresh_token)
                expires_at = token.get_exp()
                BlacklistedToken.blacklist_token(
                    token=refresh_token,
                    user=request.user,
                    token_type='refresh',
                    expires_at=expires_at
                )
            except Exception as e:
                logger.warning(f"Failed to blacklist token: {str(e)}")
        
        logger.info(f"User logged out: {request.user.username}")
        return Response(
            {'message': 'Logged out successfully'},
            status=status.HTTP_200_OK
        )
    except Exception as e:
        logger.error(f"Logout error: {str(e)}")
        return Response(
            {'error': 'Logout failed'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile_view(request):
    """Get current user profile."""
    try:
        return Response(
            UserSerializer(request.user).data,
            status=status.HTTP_200_OK
        )
    except Exception as e:
        logger.error(f"Profile fetch error: {str(e)}")
        return Response(
            {'error': 'Failed to fetch profile'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
