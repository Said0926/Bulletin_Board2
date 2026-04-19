from django.db import models


class Newsletter(models.Model):
    """Запись о рассылке."""

    subject = models.CharField(max_length=255, verbose_name='Тема')
    body = models.TextField(verbose_name='Содержание')
    sent_at = models.DateTimeField(null=True, blank=True, verbose_name='Отправлено')
    is_sent = models.BooleanField(default=False, verbose_name='Отправлено?')
    recipients_count = models.PositiveIntegerField(default=0, verbose_name='Получателей')

    class Meta:
        verbose_name = 'Рассылка'
        verbose_name_plural = 'Рассылки'
        ordering = ['-sent_at']

    def __str__(self) -> str:
        return self.subject
