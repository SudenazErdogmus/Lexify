from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserViewSet, MediaSourceViewSet, ContextualWordViewSet, 
    NotionSyncLogViewSet, FlashcardSessionViewSet
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'media-sources', MediaSourceViewSet)
router.register(r'contextual-words', ContextualWordViewSet)
router.register(r'notion-sync-logs', NotionSyncLogViewSet)
router.register(r'flashcard-sessions', FlashcardSessionViewSet)

urlpatterns = [
    path('', include(router.urls)),
]