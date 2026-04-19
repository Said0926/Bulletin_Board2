from django.urls import path
from .views import SendNewsletterView

urlpatterns = [
    path('newsletter/send/', SendNewsletterView.as_view(), name='newsletter-send'),
]
