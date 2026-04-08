from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MessageViewSet, CannedResponseViewSet, AgentViewSet

router = DefaultRouter()
router.register(r'messages', MessageViewSet, basename='message')
router.register(r'canned', CannedResponseViewSet, basename='canned')
router.register(r'agents', AgentViewSet, basename='agent')

urlpatterns = [
    path('', include(router.urls)),
]
