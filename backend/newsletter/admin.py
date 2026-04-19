from django.contrib import admin
from django.utils import timezone
from django.core.mail import send_mass_mail
from django.contrib import messages

from users.models import User
from .models import Newsletter


@admin.register(Newsletter)
class NewsletterAdmin(admin.ModelAdmin):
    list_display = ['subject', 'is_sent', 'recipients_count', 'sent_at']
    readonly_fields = ['sent_at', 'is_sent', 'recipients_count']
    actions = ['send_newsletter']

    @admin.action(description='Отправить выбранные рассылки пользователям')
    def send_newsletter(self, request, queryset):
        recipients = list(
            User.objects.filter(is_email_verified=True).values_list('email', flat=True)
        )
        if not recipients:
            self.message_user(request, 'Нет подтверждённых пользователей.', level=messages.WARNING)
            return

        for newsletter in queryset.filter(is_sent=False):
            msgs = tuple((newsletter.subject, newsletter.body, None, [e]) for e in recipients)
            send_mass_mail(msgs, fail_silently=False)
            newsletter.is_sent = True
            newsletter.sent_at = timezone.now()
            newsletter.recipients_count = len(recipients)
            newsletter.save()

        self.message_user(request, f'Рассылка отправлена {len(recipients)} пользователям.')
