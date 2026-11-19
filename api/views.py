from .analyzer import analyze_text_hybrid
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import viewsets, generics, permissions
from .utils import icerik_cek
from .ai_service import metni_analiz_et
from .notion_service import add_word_to_notion
from .models import User, MediaSource, ContextualWord, NotionSyncLog, FlashcardSession
from .serializers import (
    UserSerializer,
    MediaSourceSerializer,
    ContextualWordSerializer,
    NotionSyncLogSerializer,
    FlashcardSessionSerializer,
)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return User.objects.filter(id=self.request.user.id)


class MediaSourceViewSet(viewsets.ModelViewSet):
    queryset = MediaSource.objects.all()
    serializer_class = MediaSourceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.request.user.media_sources.all()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['post'])
    def process_url(self, request):
        url = request.data.get('url')
        text = request.data.get('text')
        level = request.data.get('level', 'B1')

        if url:
            cekim_sonucu = icerik_cek(url)
            if not cekim_sonucu['basarili']:
                return Response({"hata": cekim_sonucu['hata']}, status=400)
            ham_metin = cekim_sonucu['metin']
        elif text:
            ham_metin = text
        else:
            return Response({"hata": "Lütfen bir 'url' veya 'text' gönderin."}, status=400)

        def ai_yedek(metin, seviye):
            sonuc = metni_analiz_et(metin, kullanici_seviyesi=seviye)
            if sonuc.get('basarili'):
                return sonuc.get('veri', [])
            return []

        bulunan_kelimeler = analyze_text_hybrid(
            ham_metin,
            user_level=level,
            ai_fallback_fn=ai_yedek,
        )

        return Response({
            "mesaj": "Metin başarıyla analiz edildi.",
            "orijinal_metin_uzunlugu": len(ham_metin),
            "ham_metin": ham_metin,
            "bulunan_kelimeler": bulunan_kelimeler
        }, status=200)


class ContextualWordViewSet(viewsets.ModelViewSet):
    queryset = ContextualWord.objects.all()
    serializer_class = ContextualWordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.request.user.contextual_words.all().order_by('-created_at')

    def perform_create(self, serializer):
        word_obj = serializer.save(user=self.request.user)
        add_word_to_notion(self.request.user, word_obj)


class NotionSyncLogViewSet(viewsets.ModelViewSet):
    queryset = NotionSyncLog.objects.all()
    serializer_class = NotionSyncLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.request.user.notion_sync_logs.all()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class FlashcardSessionViewSet(viewsets.ModelViewSet):
    queryset = FlashcardSession.objects.all()
    serializer_class = FlashcardSessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.request.user.flashcard_sessions.all()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

