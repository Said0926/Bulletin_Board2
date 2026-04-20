import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from users.models import User
from .models import Ad, Response as AdResponse


# ────────────────────────── helpers ──────────────────────────


def make_ad(author: User, **kwargs) -> Ad:
    defaults = {
        'title': 'Ищу хила в рейд',
        'content': '<p>Нужен опытный хилер.</p>',
        'category': 'healer',
    }
    defaults.update(kwargs)
    return Ad.objects.create(author=author, **defaults)


def make_response(ad: Ad, author: User, text: str = 'Я готов помочь!') -> AdResponse:
    return AdResponse.objects.create(ad=ad, author=author, text=text)


# ────────────────────────── categories ──────────────────────────


@pytest.mark.django_db
def test_categories_list(api_client: APIClient) -> None:
    res = api_client.get(reverse('categories'))
    assert res.status_code == 200
    values = [c['value'] for c in res.data]
    assert 'healer' in values
    assert 'tank' in values
    assert len(res.data) == 10


# ────────────────────────── list ads ──────────────────────────


@pytest.mark.django_db
def test_list_ads_anonymous(api_client: APIClient, user: User) -> None:
    make_ad(user)
    res = api_client.get(reverse('ad-list-create'))
    assert res.status_code == 200
    assert res.data['count'] == 1


@pytest.mark.django_db
def test_list_ads_filter_by_category(api_client: APIClient, user: User) -> None:
    make_ad(user, category='healer')
    make_ad(user, category='tank', title='Ищу танка')
    url = reverse('ad-list-create')
    res = api_client.get(url, {'category': 'healer'})
    assert res.status_code == 200
    assert res.data['count'] == 1
    assert res.data['results'][0]['category'] == 'healer'


@pytest.mark.django_db
def test_list_ads_unknown_category_returns_empty(api_client: APIClient, user: User) -> None:
    make_ad(user)
    res = api_client.get(reverse('ad-list-create'), {'category': 'nonexistent'})
    assert res.status_code == 200
    assert res.data['count'] == 0


# ────────────────────────── create ad ──────────────────────────


@pytest.mark.django_db
def test_create_ad_authenticated(auth_client: APIClient, user: User) -> None:
    data = {'title': 'Тест', 'content': '<p>ok</p>', 'category': 'tank'}
    res = auth_client.post(reverse('ad-list-create'), data, format='json')
    assert res.status_code == 201
    assert Ad.objects.filter(author=user, category='tank').exists()


@pytest.mark.django_db
def test_create_ad_anonymous_fails(api_client: APIClient) -> None:
    data = {'title': 'Тест', 'content': '<p>ok</p>', 'category': 'tank'}
    res = api_client.post(reverse('ad-list-create'), data, format='json')
    assert res.status_code in (401, 403)


@pytest.mark.django_db
def test_create_ad_invalid_category_fails(auth_client: APIClient) -> None:
    data = {'title': 'Тест', 'content': '<p>ok</p>', 'category': 'wizard'}
    res = auth_client.post(reverse('ad-list-create'), data, format='json')
    assert res.status_code == 400


@pytest.mark.django_db
def test_create_ad_strips_xss(auth_client: APIClient) -> None:
    data = {
        'title': 'Тест',
        'content': '<p>ok</p><script>alert(1)</script>',
        'category': 'tank',
    }
    res = auth_client.post(reverse('ad-list-create'), data, format='json')
    assert res.status_code == 201
    assert '<script>' not in res.data['content']


# ────────────────────────── ad detail ──────────────────────────


@pytest.mark.django_db
def test_get_ad_detail_anonymous(api_client: APIClient, user: User) -> None:
    ad = make_ad(user)
    res = api_client.get(reverse('ad-detail', args=[ad.pk]))
    assert res.status_code == 200
    assert res.data['title'] == ad.title
    assert res.data['author_email'] == user.email


@pytest.mark.django_db
def test_get_nonexistent_ad_returns_404(api_client: APIClient) -> None:
    res = api_client.get(reverse('ad-detail', args=[9999]))
    assert res.status_code == 404


# ────────────────────────── update ad ──────────────────────────


@pytest.mark.django_db
def test_patch_ad_by_author(auth_client: APIClient, user: User) -> None:
    ad = make_ad(user)
    res = auth_client.patch(
        reverse('ad-detail', args=[ad.pk]),
        {'title': 'Новый заголовок'},
        format='json',
    )
    assert res.status_code == 200
    ad.refresh_from_db()
    assert ad.title == 'Новый заголовок'


@pytest.mark.django_db
def test_patch_ad_by_non_author_fails(auth_client2: APIClient, user: User) -> None:
    ad = make_ad(user)
    res = auth_client2.patch(
        reverse('ad-detail', args=[ad.pk]),
        {'title': 'Взлом'},
        format='json',
    )
    assert res.status_code == 403


@pytest.mark.django_db
def test_patch_ad_anonymous_fails(api_client: APIClient, user: User) -> None:
    ad = make_ad(user)
    res = api_client.patch(
        reverse('ad-detail', args=[ad.pk]),
        {'title': 'Аноним'},
        format='json',
    )
    assert res.status_code in (401, 403)


# ────────────────────────── delete ad ──────────────────────────


@pytest.mark.django_db
def test_delete_ad_by_author(auth_client: APIClient, user: User) -> None:
    ad = make_ad(user)
    res = auth_client.delete(reverse('ad-detail', args=[ad.pk]))
    assert res.status_code == 204
    assert not Ad.objects.filter(pk=ad.pk).exists()


@pytest.mark.django_db
def test_delete_ad_by_non_author_fails(auth_client2: APIClient, user: User) -> None:
    ad = make_ad(user)
    res = auth_client2.delete(reverse('ad-detail', args=[ad.pk]))
    assert res.status_code == 403
    assert Ad.objects.filter(pk=ad.pk).exists()


# ────────────────────────── create response ──────────────────────────


@pytest.mark.django_db
def test_create_response(auth_client2: APIClient, user: User, user2: User) -> None:
    ad = make_ad(user)
    res = auth_client2.post(
        reverse('ad-response-create', args=[ad.pk]),
        {'text': 'Хочу в группу!'},
        format='json',
    )
    assert res.status_code == 201
    assert AdResponse.objects.filter(ad=ad, author=user2).exists()


@pytest.mark.django_db
def test_create_response_sends_email(
    auth_client2: APIClient, user: User, mailoutbox: list
) -> None:
    ad = make_ad(user)
    auth_client2.post(
        reverse('ad-response-create', args=[ad.pk]),
        {'text': 'Хочу в группу!'},
        format='json',
    )
    assert len(mailoutbox) == 1
    assert user.email in mailoutbox[0].to


@pytest.mark.django_db
def test_create_response_to_own_ad_fails(auth_client: APIClient, user: User) -> None:
    ad = make_ad(user)
    res = auth_client.post(
        reverse('ad-response-create', args=[ad.pk]),
        {'text': 'Себе нельзя'},
        format='json',
    )
    assert res.status_code == 400


@pytest.mark.django_db
def test_create_duplicate_response_fails(
    auth_client2: APIClient, user: User, user2: User
) -> None:
    ad = make_ad(user)
    make_response(ad, user2)
    res = auth_client2.post(
        reverse('ad-response-create', args=[ad.pk]),
        {'text': 'Снова'},
        format='json',
    )
    assert res.status_code == 400


@pytest.mark.django_db
def test_create_response_anonymous_fails(api_client: APIClient, user: User) -> None:
    ad = make_ad(user)
    res = api_client.post(
        reverse('ad-response-create', args=[ad.pk]),
        {'text': 'Аноним'},
        format='json',
    )
    assert res.status_code in (401, 403)


@pytest.mark.django_db
def test_create_response_to_nonexistent_ad_fails(auth_client: APIClient) -> None:
    res = auth_client.post(
        reverse('ad-response-create', args=[9999]),
        {'text': 'Нет такого'},
        format='json',
    )
    assert res.status_code == 404


# ────────────────────────── accept response ──────────────────────────


@pytest.mark.django_db
def test_accept_response_by_ad_author(
    auth_client: APIClient, user: User, user2: User
) -> None:
    ad = make_ad(user)
    resp = make_response(ad, user2)
    res = auth_client.post(reverse('response-accept', args=[resp.pk]))
    assert res.status_code == 200
    resp.refresh_from_db()
    assert resp.status == AdResponse.Status.ACCEPTED


@pytest.mark.django_db
def test_accept_response_auto_rejects_others(
    auth_client: APIClient, user: User, user2: User, admin_user: User
) -> None:
    """Принятие одного отклика автоматически отклоняет остальные на это объявление."""
    ad = make_ad(user)
    accepted = make_response(ad, user2)
    rejected = make_response(ad, admin_user, text='Другой отклик')

    auth_client.post(reverse('response-accept', args=[accepted.pk]))

    rejected.refresh_from_db()
    assert rejected.status == AdResponse.Status.REJECTED


@pytest.mark.django_db
def test_accept_response_by_non_author_fails(
    auth_client2: APIClient, user: User, user2: User
) -> None:
    ad = make_ad(user)
    resp = make_response(ad, user2)
    res = auth_client2.post(reverse('response-accept', args=[resp.pk]))
    assert res.status_code == 403


@pytest.mark.django_db
def test_accept_response_twice_fails(
    auth_client: APIClient, user: User, user2: User
) -> None:
    ad = make_ad(user)
    resp = make_response(ad, user2)
    auth_client.post(reverse('response-accept', args=[resp.pk]))
    res = auth_client.post(reverse('response-accept', args=[resp.pk]))
    assert res.status_code == 400


# ────────────────────────── delete response ──────────────────────────


@pytest.mark.django_db
def test_delete_response_by_ad_author(
    auth_client: APIClient, user: User, user2: User
) -> None:
    ad = make_ad(user)
    resp = make_response(ad, user2)
    res = auth_client.delete(reverse('response-delete', args=[resp.pk]))
    assert res.status_code == 204
    assert not AdResponse.objects.filter(pk=resp.pk).exists()


@pytest.mark.django_db
def test_delete_response_by_responder_fails(
    auth_client2: APIClient, user: User, user2: User
) -> None:
    """Автор отклика не может удалить его сам — только автор объявления."""
    ad = make_ad(user)
    resp = make_response(ad, user2)
    res = auth_client2.delete(reverse('response-delete', args=[resp.pk]))
    assert res.status_code == 403


@pytest.mark.django_db
def test_delete_nonexistent_response_returns_404(auth_client: APIClient) -> None:
    res = auth_client.delete(reverse('response-delete', args=[9999]))
    assert res.status_code == 404


# ────────────────────────── my responses ──────────────────────────


@pytest.mark.django_db
def test_my_responses_shows_only_own_ads(
    auth_client: APIClient, auth_client2: APIClient, user: User, user2: User
) -> None:
    my_ad = make_ad(user)
    other_ad = make_ad(user2, title='Чужое')
    make_response(my_ad, user2)
    make_response(other_ad, user)

    res = auth_client.get(reverse('my-responses'))
    assert res.status_code == 200
    # Должен вернуть только отклик на моё объявление
    assert len(res.data) == 1
    assert res.data[0]['ad'] == my_ad.pk


@pytest.mark.django_db
def test_my_responses_filter_by_ad(
    auth_client: APIClient, user: User, user2: User, admin_user: User
) -> None:
    ad1 = make_ad(user, title='Объявление 1')
    ad2 = make_ad(user, title='Объявление 2')
    make_response(ad1, user2)
    make_response(ad2, admin_user)

    res = auth_client.get(reverse('my-responses'), {'ad': ad1.pk})
    assert res.status_code == 200
    assert len(res.data) == 1
    assert res.data[0]['ad'] == ad1.pk


@pytest.mark.django_db
def test_my_responses_anonymous_fails(api_client: APIClient) -> None:
    res = api_client.get(reverse('my-responses'))
    assert res.status_code in (401, 403)
