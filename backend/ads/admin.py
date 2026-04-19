from django.contrib import admin
from .models import Ad, Response


@admin.register(Ad)
class AdAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'author', 'created_at']
    list_filter = ['category']
    search_fields = ['title', 'author__email']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Response)
class ResponseAdmin(admin.ModelAdmin):
    list_display = ['ad', 'author', 'status', 'created_at']
    list_filter = ['status']
    search_fields = ['ad__title', 'author__email']
    readonly_fields = ['created_at']
