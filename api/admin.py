from django.contrib import admin
from .models import User, MediaSource, ContextualWord, NotionSyncLog, FlashcardSession


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'native_language', 'target_language')


@admin.register(MediaSource)
class MediaSourceAdmin(admin.ModelAdmin):
    list_display = ('title', 'source_type', 'user', 'created_at')


@admin.register(ContextualWord)
class ContextualWordAdmin(admin.ModelAdmin):
    list_display = ('word', 'status', 'user', 'created_at')


@admin.register(NotionSyncLog)
class NotionSyncLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'status', 'items_synced', 'started_at')


@admin.register(FlashcardSession)
class FlashcardSessionAdmin(admin.ModelAdmin):
    list_display = ('user', 'contextual_word', 'correct_count', 'created_at')