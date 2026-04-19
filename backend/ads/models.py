from django.db import models
from django.conf import settings


class Category(models.TextChoices):
    TANK        = 'tank',        'Танки'
    HEALER      = 'healer',      'Хилы'
    DPS         = 'dps',         'ДД'
    TRADER      = 'trader',      'Торговцы'
    GUILDMASTER = 'guildmaster', 'Гилдмастеры'
    QUESTGIVER  = 'questgiver',  'Квестгиверы'
    BLACKSMITH  = 'blacksmith',  'Кузнецы'
    TANNER      = 'tanner',      'Кожевники'
    ALCHEMIST   = 'alchemist',   'Зельевары'
    SPELLMASTER = 'spellmaster', 'Мастера заклинаний'


class Ad(models.Model):
    """Объявление на доске."""

    title = models.CharField(max_length=255, verbose_name='Заголовок')
    content = models.TextField(verbose_name='Содержание (HTML)')
    category = models.CharField(
        max_length=20,
        choices=Category.choices,
        verbose_name='Категория',
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='ads',
        verbose_name='Автор',
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Создано')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Обновлено')

    class Meta:
        verbose_name = 'Объявление'
        verbose_name_plural = 'Объявления'
        ordering = ['-created_at']

    def __str__(self) -> str:
        return f'[{self.get_category_display()}] {self.title}'


class Response(models.Model):
    """Отклик пользователя на объявление."""

    class Status(models.TextChoices):
        PENDING  = 'pending',  'Ожидает'
        ACCEPTED = 'accepted', 'Принят'
        REJECTED = 'rejected', 'Отклонён'

    ad = models.ForeignKey(Ad, on_delete=models.CASCADE, related_name='responses')
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_responses',
        verbose_name='Автор отклика',
    )
    text = models.TextField(verbose_name='Текст отклика')
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.PENDING,
        verbose_name='Статус',
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Создано')

    class Meta:
        verbose_name = 'Отклик'
        verbose_name_plural = 'Отклики'
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(
                fields=['ad', 'author'],
                name='unique_response_per_ad',
            )
        ]

    def __str__(self) -> str:
        return f'Отклик от {self.author.email} на «{self.ad.title}»'
