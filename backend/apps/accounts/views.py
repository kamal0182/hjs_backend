from django.conf import settings
from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.permissions import IsAdminRole
from apps.common.views import ServiceViewSet

from .models import User
from .serializers import LoginSerializer, UserInputSerializer, UserSerializer
from .services import AuthService, UserService
from .throttling import LoginAccountThrottle


def _set_refresh_cookie(response, raw_refresh):
    cookie = settings.JWT_REFRESH_COOKIE
    response.set_cookie(
        cookie['name'],
        raw_refresh,
        max_age=int(settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds()),
        path=cookie['path'],
        secure=cookie['secure'],
        httponly=cookie['httponly'],
        samesite=cookie['samesite'],
    )


def _clear_refresh_cookie(response):
    cookie = settings.JWT_REFRESH_COOKIE
    response.delete_cookie(cookie['name'], path=cookie['path'], samesite=cookie['samesite'])


def _read_refresh_cookie(request):
    return request.COOKIES.get(settings.JWT_REFRESH_COOKIE['name'])


def _session_response(user, access, refresh):
    response = Response({'access': access, 'user': UserSerializer(user).data})
    _set_refresh_cookie(response, refresh)
    return response


class _PublicAuthView(APIView):
    """Unauthenticated endpoint that still answers auth failures with 401, not 403."""

    authentication_classes = []
    permission_classes = [AllowAny]

    def get_authenticate_header(self, request):
        return 'Bearer realm="api"'


class LoginView(_PublicAuthView):
    """POST {email, password} -> {access, user}; refresh token is set as an HttpOnly cookie."""

    throttle_scope = 'login'
    throttle_classes = [ScopedRateThrottle, LoginAccountThrottle]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user, access, refresh = AuthService().login(request, **serializer.validated_data)
        return _session_response(user, access, refresh)


class RefreshView(_PublicAuthView):
    """POST (cookie only) -> {access, user}; rotates the refresh cookie."""

    throttle_scope = 'token_refresh'

    def post(self, request):
        try:
            user, access, refresh = AuthService().refresh(_read_refresh_cookie(request))
        except AuthenticationFailed as exc:
            response = Response({'detail': exc.detail}, status=status.HTTP_401_UNAUTHORIZED)
            _clear_refresh_cookie(response)
            return response
        return _session_response(user, access, refresh)


class LogoutView(_PublicAuthView):
    """POST -> blacklists the refresh token and clears the cookie."""

    def post(self, request):
        AuthService().logout(_read_refresh_cookie(request))
        response = Response(status=status.HTTP_204_NO_CONTENT)
        _clear_refresh_cookie(response)
        return response


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class UserViewSet(ServiceViewSet):
    """Admin-only user management."""

    service_class = UserService
    serializer_class = UserSerializer
    input_serializer_class = UserInputSerializer
    permission_classes = [IsAdminRole]
    paginate = True

    def get_filters(self):
        return {'search': self.request.query_params.get('search', '').strip() or None}

    def update(self, request, pk=None, partial=False):
        # An admin cannot lock themselves out (deactivate or demote their own account).
        if str(pk) == str(request.user.pk):
            if request.data.get('isActive') is False:
                return Response({'detail': 'Vous ne pouvez pas désactiver votre propre compte.'},
                                status=status.HTTP_400_BAD_REQUEST)
            if 'role' in request.data and request.data['role'] != User.Role.ADMIN:
                return Response({'detail': 'Vous ne pouvez pas retirer votre propre rôle administrateur.'},
                                status=status.HTTP_400_BAD_REQUEST)
        return super().update(request, pk, partial)

    def destroy(self, request, pk=None):
        service = self.get_service()
        user = service.get(pk)
        if user.pk == request.user.pk:
            return Response({'detail': 'Vous ne pouvez pas désactiver votre propre compte.'},
                            status=status.HTTP_400_BAD_REQUEST)
        service.delete(user)
        return Response(status=status.HTTP_204_NO_CONTENT)
