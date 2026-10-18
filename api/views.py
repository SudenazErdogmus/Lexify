from rest_framework import viewsets
from .models import User, MediaSource, ContextualWord, NotionSyncLog, FlashcardSession
from .serializers import (
    UserSerializer, 
    MediaSourceSerializer, 
    ContextualWordSerializer, 
    NotionSyncLogSerializer, 
    FlashcardSessionSerializer
)

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

class MediaSourceViewSet(viewsets.ModelViewSet):
    queryset = MediaSource.objects.all()
    serializer_class = MediaSourceSerializer

class ContextualWordViewSet(viewsets.ModelViewSet):
    queryset = ContextualWord.objects.all()
    serializer_class = ContextualWordSerializer

class NotionSyncLogViewSet(viewsets.ModelViewSet):
    queryset = NotionSyncLog.objects.all()
    serializer_class = NotionSyncLogSerializer

class FlashcardSessionViewSet(viewsets.ModelViewSet):
    queryset = FlashcardSession.objects.all()
    serializer_class = FlashcardSessionSerializer