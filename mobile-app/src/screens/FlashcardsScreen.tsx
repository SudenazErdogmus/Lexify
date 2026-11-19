import React, { useState, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ImageBackground,
  Platform,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  BackHandler,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useVideoPlayer, VideoView } from 'expo-video';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const API_URL = 'http://192.168.1.107:8000';
const bgSource = require('../../assets/login-bg.jpeg');

const trueVideo = require('../../assets/videos/true.mp4');
const falseVideo = require('../../assets/videos/false.mp4');

interface SavedWord {
  id: number;
  word: string;
  cefr_level?: string;
  translation: string;
  definition: string;
  context_sentence: string;
  status: string;
}

function FeedbackVideoOverlay({
  isCorrect,
  onFinish,
}: {
  isCorrect: boolean;
  onFinish: () => void;
}) {
  const player = useVideoPlayer(isCorrect ? trueVideo : falseVideo, (p) => {
    p.loop = false;
    p.play();
  });

  useEffect(() => {
    const subscription = player.addListener('playToEnd', () => {
      onFinish();
    });
    return () => {
      subscription.remove();
    };
  }, [player, onFinish]);

  useEffect(() => {
    const backSub = BackHandler.addEventListener('hardwareBackPress', () => {
      onFinish();
      return true;
    });
    return () => backSub.remove();
  }, [onFinish]);

  return (
    <View style={styles.videoOverlay}>
      <VideoView
        player={player}
        style={styles.videoFull}
        contentFit="cover"
        nativeControls={false}
      />
      <TouchableOpacity style={styles.videoBackButton} onPress={onFinish} activeOpacity={0.8}>
        <Ionicons name="arrow-back" size={22} color="#FDF4FF" />
      </TouchableOpacity>
    </View>
  );
}

export default function FlashcardsScreen() {
  const [words, setWords] = useState<SavedWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [checkResult, setCheckResult] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [showVideo, setShowVideo] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWords = async () => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${API_URL}/api/contextual-words/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setWords(data);
        setCurrentIndex(0);
        setUserInput('');
        setCheckResult('idle');
        setShowVideo(false);
        setShowHint(false);
        setCorrectCount(0);
        setIsFinished(false);
      }
    } catch (error) {
      Alert.alert('Hata', 'Kartlar yüklenirken sunucuya ulaşılamadı.');
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchWords();
    }, [])
  );

  const currentWord = words[currentIndex];

  const getMaskedContext = (sentence: string, word: string) => {
    if (!sentence || !word) return '';
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'gi');
    return sentence.replace(regex, '_____');
  };

  const handleCheck = async () => {
    if (!currentWord) return;
    const cleanedInput = userInput.trim().toLowerCase();
    const cleanedTarget = currentWord.word.trim().toLowerCase();

    if (!cleanedInput) {
      Alert.alert('Boş Cevap', 'Lütfen kontrol etmeden önce kelimeyi yaz.');
      return;
    }

    if (cleanedInput === cleanedTarget) {
      setCheckResult('correct');
      setShowVideo(true);
      setCorrectCount((prev) => prev + 1);

      try {
        const token = await AsyncStorage.getItem('userToken');
        await fetch(`${API_URL}/api/contextual-words/${currentWord.id}/`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: 'mastered' }),
        });
      } catch (e) {
        // Sessiz geç
      }
    } else {
      setCheckResult('wrong');
      setShowVideo(true);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < words.length) {
      setCurrentIndex((prev) => prev + 1);
      setUserInput('');
      setCheckResult('idle');
      setShowVideo(false);
      setShowHint(false);
    } else {
      setIsFinished(true);
    }
  };

  const handleRetryCurrent = () => {
    setUserInput('');
    setCheckResult('idle');
    setShowVideo(false);
  };

  const restartSession = () => {
    setCurrentIndex(0);
    setUserInput('');
    setCheckResult('idle');
    setShowVideo(false);
    setShowHint(false);
    setCorrectCount(0);
    setIsFinished(false);
  };

  const hintText = currentWord
    ? `${currentWord.word.charAt(0).toUpperCase()}${'•'.repeat(Math.max(currentWord.word.length - 1, 1))} (${currentWord.word.length} harf)`
    : '';

  return (
    <ImageBackground source={bgSource} style={styles.backgroundImage}>
      <LinearGradient
        colors={['rgba(26, 11, 46, 0.6)', 'rgba(26, 11, 46, 0.9)', 'rgba(26, 11, 46, 1)']}
        style={styles.overlay}
      >
        <SafeAreaView style={styles.container}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
          >
            <View style={styles.header}>
              <View style={styles.iconButtonPlaceholder} />
              <Text style={styles.title}>Kartlar</Text>
              <View style={styles.counterBadge}>
                <Text style={styles.counterText}>
                  {words.length > 0 && !isFinished ? `${currentIndex + 1} / ${words.length}` : `${words.length}`}
                </Text>
              </View>
            </View>

            {isLoading ? (
              <View style={styles.centerState}>
                <ActivityIndicator size="large" color="#FEF08A" />
                <Text style={styles.stateSubtitle}>Kartların hazırlanıyor...</Text>
              </View>
            ) : words.length === 0 ? (
              <View style={styles.centerState}>
                <Ionicons name="layers-outline" size={56} color="#C4B5FD" />
                <Text style={styles.stateTitle}>Çalışılacak Kart Yok</Text>
                <Text style={styles.stateSubtitle}>
                  Ana sayfadan metin analiz edip sözlüğüne kelime eklediğinde burada test kartların otomatik oluşur.
                </Text>
              </View>
            ) : isFinished ? (
              <View style={styles.centerState}>
                <View style={styles.trophyCircle}>
                  <Ionicons name="trophy" size={48} color="#FEF08A" />
                </View>
                <Text style={styles.stateTitle}>Test Tamamlandı!</Text>
                <Text style={styles.stateSubtitle}>
                  Toplam {words.length} kelimeden {correctCount} tanesini doğru bildin.
                </Text>
                <TouchableOpacity style={styles.restartButton} onPress={restartSession} activeOpacity={0.85}>
                  <Ionicons name="refresh" size={20} color="#1E1B4B" style={{ marginRight: 8 }} />
                  <Text style={styles.restartButtonText}>Tekrar Çalış</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <BlurView intensity={45} tint="dark" style={styles.flashcard}>
                  <View style={styles.cardTopRow}>
                    <View style={styles.levelBadge}>
                      <Text style={styles.levelBadgeText}>{currentWord.cefr_level || 'B2'}</Text>
                    </View>
                    {checkResult === 'idle' && (
                      <TouchableOpacity
                        style={styles.hintButton}
                        onPress={() => setShowHint((prev) => !prev)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="bulb-outline" size={16} color="#FEF08A" />
                        <Text style={styles.hintButtonText}>İpucu</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <Text style={styles.promptLabel}>TÜRKÇE ANLAMI</Text>
                  <Text style={styles.translation}>{currentWord.translation}</Text>
                  <Text style={styles.definition}>{currentWord.definition}</Text>

                  {currentWord.context_sentence ? (
                    <View style={styles.contextBox}>
                      <Text style={styles.contextLabel}>Bağlam</Text>
                      <Text style={styles.contextText}>
                        "
                        {checkResult === 'idle'
                          ? getMaskedContext(currentWord.context_sentence, currentWord.word)
                          : currentWord.context_sentence}
                        "
                      </Text>
                    </View>
                  ) : null}

                  {showHint && checkResult === 'idle' && (
                    <View style={styles.hintBox}>
                      <Text style={styles.hintText}>İpucu: {hintText}</Text>
                    </View>
                  )}

                  {/* YAZMA ALANI */}
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={[
                        styles.input,
                        checkResult === 'correct' && styles.inputCorrect,
                        checkResult === 'wrong' && styles.inputWrong,
                      ]}
                      placeholder="İngilizce kelimeyi yaz..."
                      placeholderTextColor="#94A3B8"
                      value={userInput}
                      onChangeText={setUserInput}
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={checkResult === 'idle'}
                      onSubmitEditing={handleCheck}
                    />
                  </View>

                  {/* KONTROL SONUCU */}
                  {checkResult === 'correct' && (
                    <View style={styles.feedbackCorrect}>
                      <Ionicons name="checkmark-circle" size={22} color="#86EFAC" />
                      <Text style={styles.feedbackCorrectText}>
                        Doğru! "{currentWord.word}" öğrenildi olarak işaretlendi.
                      </Text>
                    </View>
                  )}

                  {checkResult === 'wrong' && (
                    <View style={styles.feedbackWrong}>
                      <Ionicons name="close-circle" size={22} color="#FDA4AF" />
                      <Text style={styles.feedbackWrongText}>
                        Doğru cevap: <Text style={{ fontWeight: 'bold', color: '#FEF08A' }}>{currentWord.word}</Text>
                      </Text>
                    </View>
                  )}

                  {/* KARTI TAM DOLDURAN VİDEO KATMANI */}
                  {showVideo && checkResult !== 'idle' && (
                    <FeedbackVideoOverlay
                      key={`${currentIndex}-${checkResult}`}
                      isCorrect={checkResult === 'correct'}
                      onFinish={() => setShowVideo(false)}
                    />
                  )}
                </BlurView>

                {/* ALT BUTONLAR */}
                {checkResult === 'idle' ? (
                  <TouchableOpacity style={styles.primaryButton} onPress={handleCheck} activeOpacity={0.85}>
                    <Ionicons name="checkmark-done" size={20} color="#1E1B4B" style={{ marginRight: 8 }} />
                    <Text style={styles.primaryButtonText}>Kontrol Et</Text>
                  </TouchableOpacity>
                ) : checkResult === 'wrong' ? (
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.retryButton]}
                      onPress={handleRetryCurrent}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="refresh-outline" size={20} color="#C4B5FD" />
                      <Text style={styles.retryText}>Tekrar Yaz</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.nextButton]}
                      onPress={handleNext}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.nextText}>Sonraki Kart</Text>
                      <Ionicons name="arrow-forward" size={20} color="#1E1B4B" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.primaryButton} onPress={handleNext} activeOpacity={0.85}>
                    <Text style={styles.primaryButtonText}>
                      {currentIndex + 1 < words.length ? 'Sonraki Kart' : 'Sonucu Gör'}
                    </Text>
                    <Ionicons name="arrow-forward" size={20} color="#1E1B4B" style={{ marginLeft: 8 }} />
                  </TouchableOpacity>
                )}
              </ScrollView>
            )}
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: { flex: 1, width: '100%', height: '100%' },
  overlay: { flex: 1 },
  container: { flex: 1, paddingTop: Platform.OS === 'android' ? 36 : 8 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  iconButtonPlaceholder: { width: 52 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#FDF4FF', letterSpacing: 0.3 },
  counterBadge: {
    backgroundColor: 'rgba(254, 240, 138, 0.14)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(254, 240, 138, 0.3)',
  },
  counterText: { color: '#FEF08A', fontSize: 13, fontWeight: 'bold' },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  trophyCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(254, 240, 138, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(254, 240, 138, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  stateTitle: { fontSize: 22, fontWeight: 'bold', color: '#FDF4FF', marginTop: 12, marginBottom: 8 },
  stateSubtitle: { fontSize: 14, color: '#C4B5FD', textAlign: 'center', lineHeight: 22 },
  restartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF08A',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 24,
  },
  restartButtonText: { color: '#1E1B4B', fontSize: 16, fontWeight: 'bold' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingBottom: 28 },
  flashcard: {
    position: 'relative',
    backgroundColor: 'rgba(30, 15, 50, 0.5)',
    borderRadius: 28,
    padding: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(254, 240, 138, 0.3)',
    overflow: 'hidden',
    marginBottom: 18,
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
    backgroundColor: '#000',
  },
  videoFull: {
    width: '100%',
    height: '100%',
  },
  videoBackButton: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: 'rgba(19, 11, 41, 0.7)',
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(254, 240, 138, 0.3)',
  },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  levelBadge: {
    backgroundColor: 'rgba(254, 240, 138, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(254, 240, 138, 0.45)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  levelBadgeText: { color: '#FEF08A', fontSize: 13, fontWeight: 'bold' },
  hintButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(254, 240, 138, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  hintButtonText: { color: '#FEF08A', fontSize: 13, fontWeight: '600' },
  promptLabel: { color: '#94A3B8', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 6 },
  translation: { color: '#FEF08A', fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  definition: { color: '#C4B5FD', fontSize: 15, lineHeight: 22, marginBottom: 16 },
  contextBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 14,
    borderRadius: 14,
    borderLeftWidth: 2,
    borderLeftColor: '#FEF08A',
    marginBottom: 16,
  },
  contextLabel: { color: '#94A3B8', fontSize: 11, fontWeight: '700', letterSpacing: 0.6, marginBottom: 4 },
  contextText: { color: '#E2E8F0', fontSize: 14, fontStyle: 'italic', lineHeight: 20 },
  hintBox: {
    backgroundColor: 'rgba(254, 240, 138, 0.1)',
    padding: 10,
    borderRadius: 10,
    marginBottom: 14,
  },
  hintText: { color: '#FEF08A', fontSize: 13, fontWeight: '600' },
  inputWrapper: { marginTop: 4 },
  input: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: 14,
    padding: 15,
    color: '#FDF4FF',
    fontSize: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(167, 139, 250, 0.4)',
  },
  inputCorrect: { borderColor: '#86EFAC', backgroundColor: 'rgba(134, 239, 172, 0.1)' },
  inputWrong: { borderColor: '#FDA4AF', backgroundColor: 'rgba(244, 63, 94, 0.1)' },
  feedbackCorrect: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    backgroundColor: 'rgba(134, 239, 172, 0.12)',
    padding: 12,
    borderRadius: 12,
  },
  feedbackCorrectText: { color: '#86EFAC', fontSize: 14, fontWeight: '600', flex: 1 },
  feedbackWrong: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    backgroundColor: 'rgba(244, 63, 94, 0.14)',
    padding: 12,
    borderRadius: 12,
  },
  feedbackWrongText: { color: '#FDA4AF', fontSize: 14, flex: 1 },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: '#FEF08A',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { color: '#1E1B4B', fontSize: 17, fontWeight: 'bold' },
  actionRow: { flexDirection: 'row', gap: 12 },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 16,
    gap: 8,
  },
  retryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(196, 181, 253, 0.35)',
  },
  retryText: { color: '#C4B5FD', fontSize: 15, fontWeight: 'bold' },
  nextButton: { backgroundColor: '#FEF08A' },
  nextText: { color: '#1E1B4B', fontSize: 15, fontWeight: 'bold' },
});