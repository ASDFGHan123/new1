from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.exceptions import InvalidToken

from django.contrib.auth import get_user_model


User = get_user_model()


class TokenVersionRefreshSerializer(TokenRefreshSerializer):
    """Refresh serializer that rejects refresh tokens invalidated by token_version bump."""

    def validate(self, attrs):
        data = super().validate(attrs)

        # self.token is a RefreshToken instance after super().validate
        refresh_token = self.token
        user_id = refresh_token.get('user_id')
        token_version = refresh_token.get('tv')

        if user_id is None or token_version is None:
            raise InvalidToken('Invalid token')

        try:
            user = User.objects.only('id', 'token_version').get(id=user_id)
        except User.DoesNotExist:
            raise InvalidToken('User not found')

        if int(token_version) != int(getattr(user, 'token_version', 0)):
            raise InvalidToken('Token revoked')

        return data


class TokenVersionRefreshView(TokenRefreshView):
    serializer_class = TokenVersionRefreshSerializer
