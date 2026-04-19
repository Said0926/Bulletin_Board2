import os
import uuid

from django.conf import settings
from django.core.mail import send_mail
from rest_framework import status, generics
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import BasePermission, IsAuthenticated, IsAuthenticatedOrReadOnly, AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Ad, Response as AdResponse, Category
from .serializers import (
    AdListSerializer, AdDetailSerializer, AdWriteSerializer,
    ResponseSerializer, ImageUploadSerializer,
)


class IsAdAuthor(BasePermission):
    """Разрешает запись только автору объявления (или отклика через obj.ad.author)."""

    def has_object_permission(self, request, view, obj) -> bool:
        owner = obj.ad.author if hasattr(obj, 'ad') else obj.author
        return owner == request.user


class AdListCreateView(APIView):
    """
    GET  /api/ads/          — список всех объявлений, фильтр по ?category=
    POST /api/ads/          — создать объявление (только auth)
    """

    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request: Request) -> Response:
        qs = Ad.objects.select_related('author').all()
        category = request.query_params.get('category')
        if category:
            qs = qs.filter(category=category)
        paginator = PageNumberPagination()
        page = paginator.paginate_queryset(qs, request)
        serializer = AdListSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    def post(self, request: Request) -> Response:
        serializer = AdWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        ad = serializer.save(author=request.user)
        return Response(AdDetailSerializer(ad).data, status=status.HTTP_201_CREATED)


class AdDetailView(APIView):
    """
    GET    /api/ads/{id}/  — детальная страница
    PUT    /api/ads/{id}/  — редактировать (только автор)
    PATCH  /api/ads/{id}/  — частичное обновление (только автор)
    DELETE /api/ads/{id}/  — удалить (только автор)
    """

    permission_classes = [IsAuthenticatedOrReadOnly, IsAdAuthor]

    def _get_ad(self, pk: int) -> Ad:
        try:
            return Ad.objects.select_related('author').get(pk=pk)
        except Ad.DoesNotExist:
            from rest_framework.exceptions import NotFound
            raise NotFound('Объявление не найдено.')

    def get(self, request: Request, pk: int) -> Response:
        ad = self._get_ad(pk)
        return Response(AdDetailSerializer(ad).data)

    def put(self, request: Request, pk: int) -> Response:
        return self._update(request, pk, partial=False)

    def patch(self, request: Request, pk: int) -> Response:
        return self._update(request, pk, partial=True)

    def _update(self, request: Request, pk: int, partial: bool) -> Response:
        ad = self._get_ad(pk)
        self.check_object_permissions(request, ad)
        serializer = AdWriteSerializer(ad, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(AdDetailSerializer(ad).data)

    def delete(self, request: Request, pk: int) -> Response:
        ad = self._get_ad(pk)
        self.check_object_permissions(request, ad)
        ad.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdResponseCreateView(APIView):
    """POST /api/ads/{id}/responses/ — оставить отклик на объявление."""

    permission_classes = [IsAuthenticated]

    def post(self, request: Request, pk: int) -> Response:
        try:
            ad = Ad.objects.select_related('author').get(pk=pk)
        except Ad.DoesNotExist:
            return Response({'detail': 'Объявление не найдено.'}, status=status.HTTP_404_NOT_FOUND)

        if ad.author == request.user:
            return Response({'detail': 'Нельзя откликаться на собственные объявления.'}, status=status.HTTP_400_BAD_REQUEST)

        if AdResponse.objects.filter(ad=ad, author=request.user).exists():
            return Response({'detail': 'Вы уже оставляли отклик на это объявление.'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = ResponseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        response_obj = serializer.save(ad=ad, author=request.user)

        # Уведомляем автора объявления по email
        send_mail(
            subject=f'Новый отклик на ваше объявление «{ad.title}»',
            message=(
                f'Пользователь {request.user.email} оставил отклик:\n\n'
                f'{response_obj.text}'
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[ad.author.email],
            fail_silently=True,
        )

        return Response(ResponseSerializer(response_obj).data, status=status.HTTP_201_CREATED)


class MyResponsesView(APIView):
    """GET /api/my/responses/ — отклики на мои объявления. ?ad={id} — фильтр."""

    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        qs = (
            AdResponse.objects
            .filter(ad__author=request.user)
            .select_related('ad', 'author')
        )
        ad_id = request.query_params.get('ad')
        if ad_id:
            qs = qs.filter(ad_id=ad_id)
        serializer = ResponseSerializer(qs, many=True)
        return Response(serializer.data)


class ResponseDeleteView(APIView):
    """DELETE /api/responses/{id}/ — удалить отклик (только автор объявления)."""

    permission_classes = [IsAuthenticated, IsAdAuthor]

    def delete(self, request: Request, pk: int) -> Response:
        try:
            response_obj = AdResponse.objects.select_related('ad__author').get(pk=pk)
        except AdResponse.DoesNotExist:
            return Response({'detail': 'Отклик не найден.'}, status=status.HTTP_404_NOT_FOUND)

        self.check_object_permissions(request, response_obj)
        response_obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ResponseAcceptView(APIView):
    """POST /api/responses/{id}/accept/ — принять отклик (только автор объявления)."""

    permission_classes = [IsAuthenticated, IsAdAuthor]

    def post(self, request: Request, pk: int) -> Response:
        try:
            response_obj = AdResponse.objects.select_related('ad__author', 'author').get(pk=pk)
        except AdResponse.DoesNotExist:
            return Response({'detail': 'Отклик не найден.'}, status=status.HTTP_404_NOT_FOUND)

        self.check_object_permissions(request, response_obj)

        if response_obj.status == AdResponse.Status.ACCEPTED:
            return Response({'detail': 'Отклик уже принят.'}, status=status.HTTP_400_BAD_REQUEST)

        response_obj.status = AdResponse.Status.ACCEPTED
        response_obj.save(update_fields=['status'])

        # Авто-отклоняем все остальные ожидающие отклики на это объявление
        AdResponse.objects.filter(
            ad=response_obj.ad,
            status=AdResponse.Status.PENDING,
        ).exclude(pk=pk).update(status=AdResponse.Status.REJECTED)

        # Уведомляем автора отклика
        send_mail(
            subject=f'Ваш отклик принят!',
            message=(
                f'Ваш отклик на объявление «{response_obj.ad.title}» был принят!\n\n'
                f'Ваш текст: {response_obj.text}'
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[response_obj.author.email],
            fail_silently=True,
        )

        return Response(ResponseSerializer(response_obj).data)


class CategoriesView(APIView):
    """GET /api/categories/ — список всех категорий."""

    permission_classes = [AllowAny]

    def get(self, request: Request) -> Response:
        categories = [
            {'value': value, 'label': label}
            for value, label in Category.choices
        ]
        return Response(categories)


class ImageUploadView(APIView):
    """POST /api/upload/image/ — загрузка изображения для TipTap-редактора."""

    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request: Request) -> Response:
        serializer = ImageUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        image = serializer.validated_data['image']
        ext = os.path.splitext(image.name)[1].lower()
        filename = f'{uuid.uuid4()}{ext}'
        upload_path = os.path.join(settings.MEDIA_ROOT, 'uploads', filename)

        os.makedirs(os.path.dirname(upload_path), exist_ok=True)
        with open(upload_path, 'wb') as f:
            for chunk in image.chunks():
                f.write(chunk)

        url = f'{settings.MEDIA_URL}uploads/{filename}'
        return Response({'url': url}, status=status.HTTP_201_CREATED)
