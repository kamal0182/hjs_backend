from django.contrib.auth import authenticate
from rest_framework.exceptions import AuthenticationFailed, ValidationError
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.settings import api_settings as jwt_settings
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken
from rest_framework_simplejwt.tokens import RefreshToken

from apps.common.services import BaseService

from .repositories import UserRepository

INVALID_CREDENTIALS = 'Email ou mot de passe incorrect.'
INVALID_SESSION = 'Session expirée. Veuillez vous reconnecter.'


class AuthService:
    """Issues, rotates and revokes JWT pairs."""

    def __init__(self, repository=None):
        self.repository = repository or UserRepository()

    def login(self, request, email, password):
        # `authenticate` runs the password hasher even for unknown emails,
        # so response timing does not reveal which accounts exist.
        user = authenticate(request, email=email.lower(), password=password)
        if user is None or not user.is_active:
            raise AuthenticationFailed(INVALID_CREDENTIALS)
        refresh = RefreshToken.for_user(user)
        return user, str(refresh.access_token), str(refresh)

    def refresh(self, raw_refresh):
        """Rotate the refresh token (old one is blacklisted) and return a new pair."""
        if not raw_refresh:
            raise AuthenticationFailed(INVALID_SESSION)
        serializer = TokenRefreshSerializer(data={'refresh': raw_refresh})
        try:
            serializer.is_valid(raise_exception=True)
        except (TokenError, ValidationError, AuthenticationFailed):
            raise AuthenticationFailed(INVALID_SESSION)

        access = serializer.validated_data['access']
        new_refresh = serializer.validated_data.get('refresh', raw_refresh)

        user_id = RefreshToken(new_refresh, verify=False)[jwt_settings.USER_ID_CLAIM]
        user = self.repository.get_active_by_id(user_id)
        if user is None:
            self.logout(new_refresh)
            raise AuthenticationFailed(INVALID_SESSION)
        return user, access, new_refresh

    def logout(self, raw_refresh):
        if not raw_refresh:
            return
        try:
            RefreshToken(raw_refresh).blacklist()
        except TokenError:
            pass  # already expired or blacklisted: nothing to revoke


def revoke_all_sessions(user):
    """Blacklist every refresh token issued to `user` (logs them out everywhere)."""
    for token in OutstandingToken.objects.filter(user=user).exclude(blacklistedtoken__isnull=False):
        BlacklistedToken.objects.get_or_create(token=token)


class UserService(BaseService):
    repository_class = UserRepository

    def create(self, data, user=None):
        if self.repository.email_exists(data['email']):
            raise ValidationError({'email': 'Un utilisateur avec cet email existe déjà.'})
        return self.repository.create(**data)

    def update(self, instance, data):
        data = dict(data)
        password = data.pop('password', None)
        if 'email' in data and self.repository.email_exists(data['email'], exclude_pk=instance.pk):
            raise ValidationError({'email': 'Un utilisateur avec cet email existe déjà.'})
        instance = self.repository.update(instance, **data)
        if password:
            self.repository.set_password(instance, password)
        if password or not instance.is_active:
            revoke_all_sessions(instance)
        return instance

    def delete(self, instance):
        # Soft delete keeps audit trails (created_by) intact.
        self.repository.update(instance, is_active=False)
        revoke_all_sessions(instance)
