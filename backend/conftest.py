import pytest
from rest_framework.test import APIClient

from users.models import User


@pytest.fixture
def api_client() -> APIClient:
    return APIClient()


@pytest.fixture
def user(db) -> User:
    return User.objects.create_user(
        email='user@example.com',
        password='TestPass123',
        is_email_verified=True,
    )


@pytest.fixture
def user2(db) -> User:
    return User.objects.create_user(
        email='user2@example.com',
        password='TestPass123',
        is_email_verified=True,
    )


@pytest.fixture
def admin_user(db) -> User:
    return User.objects.create_user(
        email='admin@example.com',
        password='AdminPass123',
        is_email_verified=True,
        is_staff=True,
        is_superuser=True,
    )


@pytest.fixture
def auth_client(api_client: APIClient, user: User) -> APIClient:
    api_client.force_authenticate(user=user)
    return api_client


@pytest.fixture
def auth_client2(api_client: APIClient, user2: User) -> APIClient:
    client = APIClient()
    client.force_authenticate(user=user2)
    return client


@pytest.fixture
def admin_client(api_client: APIClient, admin_user: User) -> APIClient:
    client = APIClient()
    client.force_authenticate(user=admin_user)
    return client
