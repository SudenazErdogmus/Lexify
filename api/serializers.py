from rest_framework import serializers
from .models import User, MediaSource, ContextualWord, NotionSyncLog, FlashcardSession

class UserSerializer(serializers.ModelSerializer):
    # Şifre alanını ekliyoruz ve sadece yazılabilir (write_only) yapıyoruz ki API'de geri dönerken görünmesin
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'native_language', 'target_language']

    # Kullanıcı oluşturulurken şifreyi güvenli bir şekilde (hash'leyerek) kaydetmek için bu metodu eziyoruz
    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            native_language=validated_data.get('native_language', ''),
            target_language=validated_data.get('target_language', '')
        )
        return user

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