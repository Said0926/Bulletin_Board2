import nh3
from rest_framework import serializers
from .models import Ad, Response, Category
from users.serializers import UserSerializer

# Теги и атрибуты, которые генерирует TipTap — всё остальное вырезается
_ALLOWED_TAGS: frozenset[str] = frozenset({
    'p', 'br', 'strong', 'em', 'b', 'i', 's', 'u',
    'h1', 'h2', 'h3', 'h4', 'blockquote', 'hr',
    'ul', 'ol', 'li', 'code', 'pre',
    'a', 'img', 'iframe',
})
_ALLOWED_ATTRIBUTES: dict[str, set[str]] = {
    'a':      {'href', 'target'},
    'img':    {'src', 'alt', 'width', 'height'},
    # iframe нужен для YouTube-эмбедов TipTap
    'iframe': {'src', 'width', 'height', 'allowfullscreen', 'frameborder', 'allow'},
}


class AdListSerializer(serializers.ModelSerializer):
    """Краткое представление объявления для списка."""

    author_email = serializers.EmailField(source='author.email', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = Ad
        fields = ['id', 'title', 'category', 'category_display', 'author_email', 'created_at']


class AdDetailSerializer(serializers.ModelSerializer):
    """Полное представление объявления с откликами."""

    author_email = serializers.EmailField(source='author.email', read_only=True)
    author_id = serializers.IntegerField(source='author.id', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = Ad
        fields = [
            'id', 'title', 'content', 'category', 'category_display',
            'author_id', 'author_email', 'created_at', 'updated_at',
        ]


class AdWriteSerializer(serializers.ModelSerializer):
    """Создание и редактирование объявления."""

    class Meta:
        model = Ad
        fields = ['title', 'content', 'category']

    def validate_content(self, value: str) -> str:
        return nh3.clean(value, tags=_ALLOWED_TAGS, attributes=_ALLOWED_ATTRIBUTES)

    def validate_category(self, value: str) -> str:
        if value not in Category.values:
            raise serializers.ValidationError(f'Недопустимая категория: {value}')
        return value


class ResponseSerializer(serializers.ModelSerializer):
    """Отклик — для чтения и создания."""

    author_email = serializers.EmailField(source='author.email', read_only=True)
    author_id = serializers.IntegerField(source='author.id', read_only=True)
    ad_title = serializers.CharField(source='ad.title', read_only=True)

    class Meta:
        model = Response
        fields = ['id', 'ad', 'ad_title', 'author_id', 'author_email', 'text', 'status', 'created_at']
        read_only_fields = ['id', 'ad', 'ad_title', 'author_id', 'author_email', 'status', 'created_at']


class ImageUploadSerializer(serializers.Serializer):
    """Загрузка изображения в TipTap-редактор."""

    image = serializers.ImageField()
