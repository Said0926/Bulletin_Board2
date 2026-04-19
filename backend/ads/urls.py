from django.urls import path
from .views import (
    AdListCreateView, AdDetailView,
    AdResponseCreateView, MyResponsesView,
    ResponseDeleteView, ResponseAcceptView,
    CategoriesView, ImageUploadView,
)

urlpatterns = [
    path('ads/', AdListCreateView.as_view(), name='ad-list-create'),
    path('ads/<int:pk>/', AdDetailView.as_view(), name='ad-detail'),
    path('ads/<int:pk>/responses/', AdResponseCreateView.as_view(), name='ad-response-create'),
    path('my/responses/', MyResponsesView.as_view(), name='my-responses'),
    path('responses/<int:pk>/', ResponseDeleteView.as_view(), name='response-delete'),
    path('responses/<int:pk>/accept/', ResponseAcceptView.as_view(), name='response-accept'),
    path('categories/', CategoriesView.as_view(), name='categories'),
    path('upload/image/', ImageUploadView.as_view(), name='image-upload'),
]
