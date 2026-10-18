from rest_framework import serializers
from .models import User, MediaSource, ContextualWord, NotionSyncLog, FlashcardSession

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'native_language', 'target_language']

class MediaSourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = MediaSource
        fields = '__all__'

class ContextualWordSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContextualWord
        fields = '__all__'

class NotionSyncLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotionSyncLog
        fields = '__all__'

class FlashcardSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = FlashcardSession
        fields = '__all__'