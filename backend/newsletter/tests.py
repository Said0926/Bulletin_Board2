import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from users.models import User
from .models import Newsletter


@pytest.mark.django_db
def test_send_newsletter_as_admin(admin_client: APIClient, user: User) -> None:
    res = admin_client.post(
        reverse('newsletter-send'),
        {'subject': 'Новости гильдии', 'body': 'Привет всем!'},
        format='json',
    )
    assert res.status_code == 200
    assert Newsletter.objects.filter(subject='Новости гильдии', is_sent=True).exists()
    nl = Newsletter.objects.get(subject='Новости гильдии')
    # user + admin_user — оба верифицированы
    assert nl.recipients_count == 2
    assert nl.sent_at is not None


@pytest.mark.django_db
def test_send_newsletter_sends_emails(
    admin_client: APIClient, user: User, mailoutbox: list
) -> None:
    admin_client.post(
        reverse('newsletter-send'),
        {'subject': 'Анонс', 'body': 'Большое событие!'},
        format='json',
    )
    # user + admin_user — оба верифицированы
    assert len(mailoutbox) == 2
    all_recipients = [addr for msg in mailoutbox for addr in msg.to]
    assert user.email in all_recipients


@pytest.mark.django_db
def test_send_newsletter_non_admin_fails(auth_client: APIClient) -> None:
    res = auth_client.post(
        reverse('newsletter-send'),
        {'subject': 'Взлом', 'body': 'Не должно отправиться'},
        format='json',
    )
    assert res.status_code == 403
    assert not Newsletter.objects.exists()


@pytest.mark.django_db
def test_send_newsletter_anonymous_fails(api_client: APIClient) -> None:
    res = api_client.post(
        reverse('newsletter-send'),
        {'subject': 'Аноним', 'body': 'Нет'},
        format='json',
    )
    assert res.status_code in (401, 403)


@pytest.mark.django_db
def test_send_newsletter_no_verified_users(admin_client: APIClient) -> None:
    """Если нет верифицированных пользователей — вернуть 200 с пояснением."""
    User.objects.all().update(is_email_verified=False)
    res = admin_client.post(
        reverse('newsletter-send'),
        {'subject': 'Пусто', 'body': 'Нет получателей'},
        format='json',
    )
    assert res.status_code == 200
    assert 'Нет' in res.data['detail']


@pytest.mark.django_db
def test_send_newsletter_only_verified_recipients(
    admin_client: APIClient, db: None
) -> None:
    """Только верифицированные пользователи получают рассылку."""
    User.objects.create_user(email='verified@ex.com', password='pass', is_email_verified=True)
    User.objects.create_user(email='unverified@ex.com', password='pass', is_email_verified=False)
    # admin_user уже создан через admin_client fixture, тоже верифицирован
    res = admin_client.post(
        reverse('newsletter-send'),
        {'subject': 'Тест', 'body': 'Тело'},
        format='json',
    )
    assert res.status_code == 200
    nl = Newsletter.objects.get()
    # admin + verified = 2, не считая unverified
    assert nl.recipients_count == 2
