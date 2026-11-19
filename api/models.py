from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings


class User(AbstractUser):
    email = models.EmailField(unique=True)
    native_language = models.CharField(max_length=50, blank=True)
    target_language = models.CharField(max_length=50, blank=True)
    notion_api_key = models.CharField(max_length=255, blank=True)
    notion_database_id = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.username


class MediaSource(models.Model):
    SOURCE_TYPES = [
        ('article', 'Article'),
        ('book', 'Book'),
        ('paper', 'Academic Paper'),
        ('web', 'Web Page'),
        ('other', 'Other'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='media_sources'
    )
    title = models.CharField(max_length=255)
    source_type = models.CharField(max_length=20, choices=SOURCE_TYPES, default='article')
    url = models.URLField(blank=True)
    content = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title


class ContextualWord(models.Model):
    STATUS_CHOICES = [
        ('new', 'New'),
        ('learning', 'Learning'),
        ('known', 'Known'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='contextual_words'
    )
    media_source = models.ForeignKey(
        MediaSource,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='contextual_words'
    )
    word = models.CharField(max_length=255)
    lemma = models.CharField(max_length=255, blank=True)
    context_sentence = models.TextField(blank=True)
    definition = models.TextField(blank=True)
    translation = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new')
    notion_page_id = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    cefr_level = models.CharField(max_length=10, default='B2', blank=True)

    def __str__(self):
        return self.word


class NotionSyncLog(models.Model):
    STATUS_CHOICES = [
        ('success', 'Success'),
        ('failed', 'Failed'),
        ('partial', 'Partial'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notion_sync_logs'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    message = models.TextField(blank=True)
    items_synced = models.PositiveIntegerField(default=0)
    started_at = models.DateTimeField(auto_now_add=True)
    finished_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.username} - {self.status} - {self.started_at}"


class FlashcardSession(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='flashcard_sessions'
    )
    contextual_word = models.ForeignKey(
        ContextualWord,
        on_delete=models.CASCADE,
        related_name='flashcard_sessions'
    )
    correct_count = models.PositiveIntegerField(default=0)
    incorrect_count = models.PositiveIntegerField(default=0)
    total_cards = models.PositiveIntegerField(default=0)
    duration_seconds = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.contextual_word.word} - {self.created_at}"

class CEFRWord(models.Model):
    LEVEL_CHOICES = [
        ('A1', 'A1'),
        ('A2', 'A2'),
        ('B1', 'B1'),
        ('B2', 'B2'),
        ('C1', 'C1'),
        ('C2', 'C2'),
    ]

    word = models.CharField(max_length=100, unique=True, db_index=True)
    cefr_level = models.CharField(max_length=5, choices=LEVEL_CHOICES, db_index=True)
    turkish_translation = models.CharField(max_length=255, blank=True, default='')
    english_definition = models.TextField(blank=True, default='')
    example_sentence = models.TextField(blank=True, default='')

    def __str__(self):
        return f"{self.word} ({self.cefr_level})"