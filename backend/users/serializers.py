import secrets
from datetime import timedelta

from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User, EmailVerification


class RegisterSerializer(serializers.Serializer):
    """Регистрация нового пользователя."""

    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, write_only=True)

    def validate_email(self, value: str) -> str:
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('Пользователь с таким email уже существует.')
        return value

    def create(self, validated_data: dict) -> dict:
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
        )

        # Генерируем 6-значный числовой код
        code = f'{secrets.randbelow(1000000):06d}'
        EmailVerification.objects.create(
            user=user,
            code=code,
            expires_at=timezone.now() + timedelta(minutes=10),
        )

        send_mail(
            subject='Подтверждение регистрации на BulletinBoard',
            message=f'Ваш код подтверждения: {code}\n\nКод действителен 10 минут.',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
        )

        return {'email': user.email}


class VerifyEmailSerializer(serializers.Serializer):
    """Подтверждение email по коду."""

    email = serializers.EmailField()
    code = serializers.CharField(max_length=6)

    def validate(self, data: dict) -> dict:
        try:
            user = User.objects.get(email=data['email'])
        except User.DoesNotExist:
            raise serializers.ValidationError('Пользователь не найден.')

        verification = (
            EmailVerification.objects
            .filter(user=user, code=data['code'], is_used=False)
            .order_by('-created_at')
            .first()
        )

        if not verification:
            raise serializers.ValidationError('Неверный код.')

        if timezone.now() > verification.expires_at:
            raise serializers.ValidationError('Код истёк. Зарегистрируйтесь заново.')

        data['user'] = user
        data['verification'] = verification
        return data

    def save(self) -> dict:
        user: User = self.validated_data['user']
        verification: EmailVerification = self.validated_data['verification']

        user.is_email_verified = True
        user.save(update_fields=['is_email_verified'])

        verification.is_used = True
        verification.save(update_fields=['is_used'])

        # Возвращаем JWT-токены сразу после подтверждения (авто-логин)
        refresh = RefreshToken.for_user(user)
        return {
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }


class UserSerializer(serializers.ModelSerializer):
    """Данные пользователя для ответов API."""

    class Meta:
        model = User
        fields = ['id', 'email', 'is_email_verified', 'date_joined']
        read_only_fields = fields
