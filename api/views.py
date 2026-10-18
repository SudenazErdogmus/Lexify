from rest_framework import viewsets, generics, permissions
from .models import User, MediaSource, ContextualWord, NotionSyncLog, FlashcardSession
from .serializers import (
    UserSerializer, 
    MediaSourceSerializer, 
    ContextualWordSerializer, 
    NotionSyncLogSerializer, 
    FlashcardSessionSerializer
)

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all() # Router için gerekli
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return User.objects.filter(id=self.request.user.id)

class MediaSourceViewSet(viewsets.ModelViewSet):
    queryset = MediaSource.objects.all() # Router için gerekli
    serializer_class = MediaSourceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.request.user.media_sources.all()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class ContextualWordViewSet(viewsets.ModelViewSet):
    queryset = ContextualWord.objects.all() # Router için gerekli
    serializer_class = ContextualWordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.request.user.contextual_words.all()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class NotionSyncLogViewSet(viewsets.ModelViewSet):
    queryset = NotionSyncLog.objects.all() # Router için gerekli
    serializer_class = NotionSyncLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.request.user.notion_sync_logs.all()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class FlashcardSessionViewSet(viewsets.ModelViewSet):
    queryset = FlashcardSession.objects.all() # Router için gerekli
    serializer_class = FlashcardSessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.request.user.flashcard_sessions.all()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)