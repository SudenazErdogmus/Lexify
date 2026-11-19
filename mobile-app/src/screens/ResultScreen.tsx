import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ImageBackground,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.1.107:8000';
const bgSource = require('../../assets/login-bg.jpeg');

interface WordItem {
  kelime: string;
  seviye?: string;
  turkce_ceviri: string;
  ingilizce_tanim: string;
  baglam: string;
}

export default function ResultScreen({ route, navigation }: any) {
  const { contentType, content } = route?.params || {};
  const [words, setWords] = useState<WordItem[]>([]);
  const [saved, setSaved] = useState<string[]>([]);
  const [savingWord, setSavingWord] = useState<string | null>(null);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    analyzeContent();
  }, []);

  const analyzeContent = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const token = await AsyncStorage.getItem('userToken');
      const level = (await AsyncStorage.getItem('userLevel')) || 'B1';

      const bodyData =
        contentType === 'link'
          ? { url: content, level }
          : { text: content, level };

      const [analyzeRes, savedRes] = await Promise.all([
        fetch(`${API_URL}/api/media-sources/process_url/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(bodyData),
        }),
        fetch(`${API_URL}/api/contextual-words/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      const data = await analyzeRes.json();
      let existingWords = new Set<string>();

      if (savedRes.ok) {
        const savedList = await savedRes.json();
        existingWords = new Set(
          savedList.map((w: any) => w.word?.trim().toLowerCase())
        );
      }

      if (analyzeRes.ok) {
        const rawWords: WordItem[] = data.bulunan_kelimeler || [];
        const newWordsOnly = rawWords.filter(
          (item) => !existingWords.has(item.kelime?.trim().toLowerCase())
        );
        setWords(newWordsOnly);

        // Analiz edilen metni (veya YouTube transkriptini) "Metinlerim" ekranına otomatik kaydet
        const extractedText = (data.ham_metin || (typeof content === 'string' ? content : '')).trim();
        if (contentType !== 'image' && extractedText) {
          const rawSaved = await AsyncStorage.getItem('savedTexts');
          const list = rawSaved ? JSON.parse(rawSaved) : [];

          const alreadyExists = list.some((t: any) => t.content === extractedText);
          if (!alreadyExists) {
            const title =
              contentType === 'link'
                ? `YouTube / Link (${new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })})`
                : extractedText.split(/\s+/).slice(0, 5).join(' ') + '...';

            const newItem = {
              id: Date.now().toString(),
              title,
              content: extractedText,
              type: contentType === 'link' ? 'link' : 'text',
              date: new Date().toLocaleDateString('tr-TR'),
            };
            await AsyncStorage.setItem('savedTexts', JSON.stringify([newItem, ...list]));
          }
        }
      } else {
        setErrorMessage(data.hata || 'Analiz sırasında bir hata oluştu.');
      }
    } catch (error) {
      setErrorMessage("Sunucuya bağlanılamadı. Django'nun açık olduğundan emin olun.");
    } finally {
      setIsLoading(false);
    }
  };

  const saveWordToBackend = async (item: WordItem) => {
    if (saved.includes(item.kelime)) return;

    setSavingWord(item.kelime);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${API_URL}/api/contextual-words/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          word: item.kelime,
          cefr_level: item.seviye || 'B2',
          translation: item.turkce_ceviri,
          definition: item.ingilizce_tanim,
          context_sentence: item.baglam,
          status: 'new',
        }),
      });

      if (response.ok) {
        setSaved((current) => [...current, item.kelime]);
      } else {
        const errText = await response.text();
        Alert.alert('Hata', `Kelime kaydedilemedi: ${response.status} ${errText}`);
      }
    } catch (error) {
      Alert.alert('Bağlantı Hatası', 'Sunucuya ulaşılamadı.');
    } finally {
      setSavingWord(null);
    }
  };

  const saveAll = async () => {
    const unsavedWords = words.filter((item) => !saved.includes(item.kelime));
    if (unsavedWords.length === 0) return;

    setIsSavingAll(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const newlySaved: string[] = [];

      for (const item of unsavedWords) {
        const response = await fetch(`${API_URL}/api/contextual-words/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            word: item.kelime,
            cefr_level: item.seviye || 'B2',
            translation: item.turkce_ceviri,
            definition: item.ingilizce_tanim,
            context_sentence: item.baglam,
            status: 'new',
          }),
        });
        if (response.ok) {
          newlySaved.push(item.kelime);
        }
      }

      setSaved((current) => [...current, ...newlySaved]);
    } catch (error) {
      Alert.alert('Hata', 'Bazı kelimeler kaydedilemedi.');
    } finally {
      setIsSavingAll(false);
    }
  };

  const allSaved = words.length > 0 && saved.length === words.length;

  return (
    <ImageBackground source={bgSource} style={styles.backgroundImage}>
      <LinearGradient
        colors={['rgba(26, 11, 46, 0.6)', 'rgba(26, 11, 46, 0.9)', 'rgba(26, 11, 46, 1)']}
        style={styles.overlay}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={22} color="#C4B5FD" />
            </TouchableOpacity>
            <Text style={styles.title}>Analiz Sonucu</Text>
            <View style={styles.iconButtonPlaceholder} />
          </View>

          {isLoading ? (
            <View style={styles.centerState}>
              <View style={styles.loaderCircle}>
                <ActivityIndicator size="large" color="#FEF08A" />
              </View>
              <Text style={styles.stateTitle}>İçerik Analiz Ediliyor</Text>
              <Text style={styles.stateSubtitle}>
                Metin çıkarılıyor ve seviyenizin üzerindeki kelimeler belirleniyor...
              </Text>
            </View>
          ) : errorMessage ? (
            <View style={styles.centerState}>
              <Ionicons name="alert-circle-outline" size={52} color="#F43F5E" />
              <Text style={styles.stateTitle}>Bir Sorun Oluştu</Text>
              <Text style={styles.stateSubtitle}>{errorMessage}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={analyzeContent}>
                <Text style={styles.primaryButtonText}>Tekrar Dene</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <BlurView intensity={40} tint="dark" style={styles.successBanner}>
                  <View style={styles.successIcon}>
                    <Ionicons name="sparkles" size={22} color="#FEF08A" />
                  </View>
                  <View style={styles.successTextWrap}>
                    <Text style={styles.successTitle}>{words.length} yeni kelime bulundu</Text>
                    <Text style={styles.successSubtitle}>
                      {saved.length === 0
                        ? 'Sözlüğüne eklemek istediklerini seç.'
                        : `${saved.length} kelime sözlüğüne kaydedildi.`}
                    </Text>
                  </View>
                </BlurView>

                {words.map((item, index) => {
                  const isSaved = saved.includes(item.kelime);
                  const isSavingThis = savingWord === item.kelime;
                  return (
                    <BlurView key={`${item.kelime}-${index}`} intensity={35} tint="dark" style={styles.wordCard}>
                      <View style={styles.wordHeader}>
                        <View style={styles.wordTitleRow}>
                          <Text style={styles.wordTitle}>{item.kelime}</Text>
                          <View style={styles.levelBadge}>
                            <Text style={styles.levelBadgeText}>{item.seviye || 'B2'}</Text>
                          </View>
                        </View>
                        <View style={styles.audioButton}>
                          <Ionicons name="volume-high" size={18} color="#FEF08A" />
                        </View>
                      </View>
                      <Text style={styles.wordTranslation}>{item.turkce_ceviri}</Text>
                      <Text style={styles.wordDefinition}>{item.ingilizce_tanim}</Text>

                      <View style={styles.contextBox}>
                        <Text style={styles.contextLabel}>Bağlam</Text>
                        <Text style={styles.contextText}>"{item.baglam}"</Text>
                      </View>

                      <TouchableOpacity
                        style={[styles.addButton, isSaved && styles.addButtonSaved]}
                        onPress={() => saveWordToBackend(item)}
                        disabled={isSaved || isSavingThis}
                        activeOpacity={0.8}
                      >
                        {isSavingThis ? (
                          <ActivityIndicator size="small" color="#1E1B4B" />
                        ) : (
                          <>
                            <Ionicons
                              name={isSaved ? 'checkmark-circle' : 'add-circle-outline'}
                              size={20}
                              color="#1E1B4B"
                            />
                            <Text style={styles.addButtonText}>{isSaved ? 'Sözlüğe Eklendi' : 'Sözlüğüme Ekle'}</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </BlurView>
                  );
                })}
              </ScrollView>

              <View style={styles.footer}>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={allSaved ? () => navigation.goBack() : saveAll}
                  disabled={isSavingAll}
                  activeOpacity={0.85}
                >
                  {isSavingAll ? (
                    <ActivityIndicator size="small" color="#1E1B4B" />
                  ) : (
                    <>
                      <Ionicons
                        name={allSaved ? 'arrow-back' : 'library-outline'}
                        size={20}
                        color="#1E1B4B"
                        style={{ marginRight: 8 }}
                      />
                      <Text style={styles.primaryButtonText}>{allSaved ? 'Ana Sayfaya Dön' : 'Tümünü Ekle'}</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
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
  iconButton: { padding: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12 },
  iconButtonPlaceholder: { width: 38 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#FDF4FF', letterSpacing: 0.3 },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  loaderCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(254, 240, 138, 0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(254, 240, 138, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  stateTitle: { fontSize: 20, fontWeight: 'bold', color: '#FDF4FF', marginTop: 12, marginBottom: 8 },
  stateSubtitle: { fontSize: 14, color: '#C4B5FD', textAlign: 'center', lineHeight: 21 },
  retryButton: {
    marginTop: 24,
    backgroundColor: '#FEF08A',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
  },
  scroll: { paddingHorizontal: 20, paddingBottom: 24 },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 15, 50, 0.45)',
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(254, 240, 138, 0.3)',
    overflow: 'hidden',
  },
  successIcon: {
    backgroundColor: 'rgba(254, 240, 138, 0.12)',
    padding: 10,
    borderRadius: 12,
    marginRight: 12,
  },
  successTextWrap: { flex: 1 },
  successTitle: { color: '#FDF4FF', fontSize: 16, fontWeight: 'bold' },
  successSubtitle: { color: '#C4B5FD', fontSize: 13, marginTop: 4 },
  wordCard: {
    backgroundColor: 'rgba(30, 15, 50, 0.4)',
    padding: 18,
    borderRadius: 22,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(254, 240, 138, 0.22)',
    overflow: 'hidden',
  },
  wordHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  wordTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  wordTitle: { color: '#FDF4FF', fontSize: 24, fontWeight: 'bold', textTransform: 'capitalize' },
  levelBadge: {
    backgroundColor: 'rgba(254, 240, 138, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(254, 240, 138, 0.45)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  levelBadgeText: { color: '#FEF08A', fontSize: 12, fontWeight: 'bold' },
  audioButton: { backgroundColor: 'rgba(254, 240, 138, 0.12)', padding: 8, borderRadius: 50 },
  wordTranslation: { color: '#FEF08A', fontSize: 17, fontWeight: '600', marginBottom: 8 },
  wordDefinition: { color: '#C4B5FD', fontSize: 15, marginBottom: 14, lineHeight: 22 },
  contextBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#FEF08A',
    marginBottom: 14,
  },
  contextLabel: { color: '#94A3B8', fontSize: 11, fontWeight: '700', letterSpacing: 0.6, marginBottom: 4 },
  contextText: { color: '#E2E8F0', fontSize: 14, fontStyle: 'italic', lineHeight: 20 },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF08A',
    padding: 12,
    borderRadius: 12,
  },
  addButtonSaved: { backgroundColor: '#86EFAC' },
  addButtonText: { color: '#1E1B4B', fontSize: 15, fontWeight: '700', marginLeft: 8 },
  footer: { paddingHorizontal: 20, paddingBottom: Platform.OS === 'android' ? 18 : 12, paddingTop: 8 },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: '#FEF08A',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { color: '#1E1B4B', fontSize: 17, fontWeight: 'bold' },
});