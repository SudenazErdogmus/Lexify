from .analyzer import analyze_text_hybrid, fetch_contextual_details, get_lemma_candidates
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import viewsets, generics, permissions
from .utils import icerik_cek
from .ai_service import metni_analiz_et
from .notion_service import add_word_to_notion, remove_word_from_notion
from .models import User, MediaSource, ContextualWord, NotionSyncLog, FlashcardSession, CEFRWord
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

    def perform_destroy(self, instance):
        remove_word_from_notion(self.request.user, instance)
        instance.delete()


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


class WordLookupView(APIView):
    def post(self, request):
        word = (request.data.get("word") or request.data.get("kelime") or "").strip().lower()
        context = (request.data.get("context") or request.data.get("baglam") or "").strip()

        if not word:
            return Response({"error": "Kelime gerekli"}, status=400)

        # 1) Önce yerel veritabanında (önbellekte) hazır mı diye bak
        candidates = get_lemma_candidates(word)
        cefr_entry = CEFRWord.objects.filter(word__in=candidates).first()

        if cefr_entry and cefr_entry.turkish_translation and cefr_entry.english_definition:
            return Response({
                "kelime": word,
                "turkce_ceviri": cefr_entry.turkish_translation,
                "ingilizce_tanim": cefr_entry.english_definition,
                "ornek_cumle": cefr_entry.example_sentence or "",
                "kaynak": "cache",
            })

        # 2) Yoksa sadece bu tek kelime için Ollama'yı çalıştır
        lemma = cefr_entry.word if cefr_entry else candidates[0]
        tr, en_def, ex = fetch_contextual_details(lemma, context, use_ollama=True)

        # 3) Bir daha beklememek için veritabanına kaydet
        if cefr_entry:
            cefr_entry.turkish_translation = tr or cefr_entry.turkish_translation
            cefr_entry.english_definition = en_def or cefr_entry.english_definition
            cefr_entry.example_sentence = ex or cefr_entry.example_sentence
            cefr_entry.save()

        return Response({
            "kelime": word,
            "turkce_ceviri": tr,
            "ingilizce_tanim": en_def,
            "ornek_cumle": ex,
            "kaynak": "ollama",
        })