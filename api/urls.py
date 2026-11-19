from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    UserViewSet, MediaSourceViewSet, ContextualWordViewSet, 
    NotionSyncLogViewSet, FlashcardSessionViewSet, RegisterView, WordLookupView
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'media-sources', MediaSourceViewSet)
router.register(r'contextual-words', ContextualWordViewSet)
router.register(r'notion-sync-logs', NotionSyncLogViewSet)
router.register(r'flashcard-sessions', FlashcardSessionViewSet)

urlpatterns = [
    path('', include(router.urls)),
    # JWT Giriş ve Kayıt
    path('register/', RegisterView.as_view(), name='register'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('word-lookup/', WordLookupView.as_view(), name='word_lookup'),
]