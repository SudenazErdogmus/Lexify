from django.contrib import admin
from .models import (
    User,
    CEFRWord,
    MediaSource,
    ContextualWord,
    NotionSyncLog,
    FlashcardSession,
)


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'is_staff', 'is_superuser', 'date_joined')
    search_fields = ('username', 'email')


@admin.register(CEFRWord)
class CEFRWordAdmin(admin.ModelAdmin):
    list_display = ('word', 'cefr_level', 'turkish_translation')
    list_filter = ('cefr_level',)
    search_fields = ('word', 'turkish_translation')


@admin.register(ContextualWord)
class ContextualWordAdmin(admin.ModelAdmin):
    list_display = ('word', 'cefr_level', 'translation', 'status', 'user', 'created_at')
    list_filter = ('cefr_level', 'status')
    search_fields = ('word', 'translation', 'user__username')


@admin.register(MediaSource)
class MediaSourceAdmin(admin.ModelAdmin):
    list_display = ('id', 'user')


@admin.register(NotionSyncLog)
class NotionSyncLogAdmin(admin.ModelAdmin):
    list_display = ('id', 'user')


@admin.register(FlashcardSession)
class FlashcardSessionAdmin(admin.ModelAdmin):
    list_display = ('id', 'user')