from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.throttling import ScopedRateThrottle
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .serializers import RegisterSerializer, VerifyEmailSerializer, UserSerializer


class RegisterView(APIView):
    """POST /api/auth/register/ — регистрация, отправка кода на email."""

    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'register'

    def post(self, request: Request) -> Response:
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = serializer.create(serializer.validated_data)
        return Response(
            {'detail': f'Код подтверждения отправлен на {result["email"]}'},
            status=status.HTTP_201_CREATED,
        )


class VerifyEmailView(APIView):
    """POST /api/auth/verify/ — подтверждение кода, возврат JWT."""

    permission_classes = [AllowAny]

    def post(self, request: Request) -> Response:
        serializer = VerifyEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        tokens = serializer.save()
        return Response(tokens, status=status.HTTP_200_OK)


class MeView(APIView):
    """GET /api/auth/me/ — данные текущего пользователя."""

    def get(self, request: Request) -> Response:
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


# Стандартные JWT-эндпоинты simplejwt
LoginView = TokenObtainPairView      # POST /api/auth/login/
RefreshTokenView = TokenRefreshView  # POST /api/auth/token/refresh/
