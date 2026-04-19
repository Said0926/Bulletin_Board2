import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from users.models import User, EmailVerification


@pytest.fixture
def client() -> APIClient:
    return APIClient()


@pytest.mark.django_db
def test_register_creates_user_and_sends_code(client: APIClient, mailoutbox: list) -> None:
    url = reverse('auth-register')
    response = client.post(url, {'email': 'test@example.com', 'password': 'StrongPass123'})
    assert response.status_code == 201
    assert User.objects.filter(email='test@example.com').exists()
    assert EmailVerification.objects.filter(user__email='test@example.com').exists()
    assert len(mailoutbox) == 1
    assert 'test@example.com' in mailoutbox[0].to


@pytest.mark.django_db
def test_register_duplicate_email_fails(client: APIClient) -> None:
    User.objects.create_user(email='test@example.com', password='pass')
    response = client.post(reverse('auth-register'), {'email': 'test@example.com', 'password': 'pass2'})
    assert response.status_code == 400


@pytest.mark.django_db
def test_verify_email_returns_tokens(client: APIClient) -> None:
    from datetime import timedelta
    from django.utils import timezone

    user = User.objects.create_user(email='v@example.com', password='pass')
    EmailVerification.objects.create(
        user=user, code='123456',
        expires_at=timezone.now() + timedelta(minutes=10),
    )

    response = client.post(reverse('auth-verify'), {'email': 'v@example.com', 'code': '123456'})
    assert response.status_code == 200
    assert 'access' in response.data
    assert 'refresh' in response.data
    user.refresh_from_db()
    assert user.is_email_verified is True


@pytest.mark.django_db
def test_verify_wrong_code_fails(client: APIClient) -> None:
    from datetime import timedelta
    from django.utils import timezone

    user = User.objects.create_user(email='v2@example.com', password='pass')
    EmailVerification.objects.create(
        user=user, code='999999',
        expires_at=timezone.now() + timedelta(minutes=10),
    )
    response = client.post(reverse('auth-verify'), {'email': 'v2@example.com', 'code': '000000'})
    assert response.status_code == 400


@pytest.mark.django_db
def test_login_returns_tokens(client: APIClient) -> None:
    User.objects.create_user(email='login@example.com', password='TestPass123', is_email_verified=True)
    response = client.post(reverse('auth-login'), {'email': 'login@example.com', 'password': 'TestPass123'})
    assert response.status_code == 200
    assert 'access' in response.data
