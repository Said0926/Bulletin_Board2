import logging

from django.utils import timezone
from django.core.mail import send_mass_mail
from rest_framework import status
from rest_framework.permissions import IsAdminUser
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from users.models import User
from .models import Newsletter
from .serializers import NewsletterSendSerializer

logger = logging.getLogger(__name__)


class SendNewsletterView(APIView):
    """
    POST /api/newsletter/send/
    Только для администраторов. Отправляет рассылку всем подтверждённым пользователям.
    """

    permission_classes = [IsAdminUser]

    def post(self, request: Request) -> Response:
        serializer = NewsletterSendSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        subject: str = serializer.validated_data['subject']
        body: str = serializer.validated_data['body']

        recipients = list(
            User.objects.filter(is_email_verified=True).values_list('email', flat=True)
        )

        if not recipients:
            return Response({'detail': 'Нет подтверждённых пользователей для рассылки.'})

        # Создаём запись ДО отправки — при ошибке след остаётся в БД для отладки
        newsletter = Newsletter.objects.create(
            subject=subject,
            body=body,
            sent_at=None,
            is_sent=False,
            recipients_count=len(recipients),
        )

        messages = tuple(
            (subject, body, None, [email])
            for email in recipients
        )

        try:
            send_mass_mail(messages, fail_silently=False)
        except Exception as exc:
            logger.error(
                'Ошибка при отправке рассылки #%d: %s',
                newsletter.id,
                exc,
                exc_info=True,
            )
            return Response(
                {
                    'detail': 'Ошибка при отправке рассылки. Запись сохранена в БД.',
                    'newsletter_id': newsletter.id,
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        newsletter.is_sent = True
        newsletter.sent_at = timezone.now()
        newsletter.save(update_fields=['is_sent', 'sent_at'])

        return Response({
            'detail': f'Рассылка отправлена {len(recipients)} пользователям.',
            'newsletter_id': newsletter.id,
        })
