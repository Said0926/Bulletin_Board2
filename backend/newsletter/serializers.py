from rest_framework import serializers


class NewsletterSendSerializer(serializers.Serializer):
    """Валидация входных данных для отправки рассылки."""

    subject = serializers.CharField(max_length=255)
    body = serializers.CharField()
