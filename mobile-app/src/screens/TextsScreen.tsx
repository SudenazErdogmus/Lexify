import React, { useState, useCallback } from 'react';
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
  Modal,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const API_URL = 'http://192.168.1.107:8000';
const bgSource = require('../../assets/login-bg.jpeg');

interface SavedText {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'link';
  date: string;
}

interface WordLookupResult {
  word: string;
  cefr_level: string;
  translation: string;
  definition: string;
  context_sentence: string;
  alreadySaved?: boolean;
}

export default function TextsScreen() {
  const [texts, setTexts] = useState<SavedText[]>([]);
  const [savedWordsMap, setSavedWordsMap] = useState<Record<string, any>>({});
  const [selectedText, setSelectedText] = useState<SavedText | null>(null);
  const [fontSize, setFontSize] = useState(17);

  // Yeni metin ekleme modalı
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  // Kelime anlamı modalı
  const [lookupWord, setLookupWord] = useState<WordLookupResult | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isSavingWord, setIsSavingWord] = useState(false);

  const loadData = async () => {
    try {
      const raw = await AsyncStorage.getItem('savedTexts');
      if (raw) {
        setTexts(JSON.parse(raw));
      }

      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        const res = await fetch(`${API_URL}/api/contextual-words/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const map: Record<string, any> = {};
          data.forEach((item: any) => {
            map[item.word.toLowerCase()] = item;
          });
          setSavedWordsMap(map);
        }
      }
    } catch (e) {
      // Sessiz geç
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const handleAddText = async () => {
    if (!newContent.trim()) {
      Alert.alert('Eksik İçerik', 'Lütfen kaydetmek istediğin metni yapıştır.');
      return;
    }

    const title =
      newTitle.trim() ||
      newContent.trim().split(/\s+/).slice(0, 5).join(' ') + '...';

    const newItem: SavedText = {
      id: Date.now().toString(),
      title,
      content: newContent.trim(),
      type: 'text',
      date: new Date().toLocaleDateString('tr-TR'),
    };

    const updated = [newItem, ...texts];
    setTexts(updated);
    await AsyncStorage.setItem('savedTexts', JSON.stringify(updated));
    setNewTitle('');
    setNewContent('');
    setShowAddModal(false);
  };

  const handleDeleteText = (id: string) => {
    Alert.alert('Metni Sil', 'Bu metni kütüphanenden silmek istiyor musun?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          const updated = texts.filter((t) => t.id !== id);
          setTexts(updated);
          await AsyncStorage.setItem('savedTexts', JSON.stringify(updated));
        },
      },
    ]);
  };

  const findContextSentence = (fullText: string, word: string) => {
    const sentences = fullText.split(/(?<=[.!?])\s+/);
    const found = sentences.find((s) =>
      s.toLowerCase().includes(word.toLowerCase())
    );
    return found ? found.trim() : fullText.slice(0, 140);
  };

  const handleWordPress = async (rawToken: string) => {
    const cleaned = rawToken.replace(/[^a-zA-Z'-]/g, '').trim();
    if (!cleaned || cleaned.length < 2 || !selectedText) return;

    const lower = cleaned.toLowerCase();
    const context = findContextSentence(selectedText.content, cleaned);

    // 1. Önce kullanıcının sözlüğünde var mı bak (anında açılır)
    if (savedWordsMap[lower]) {
      const existing = savedWordsMap[lower];
      setLookupWord({
        word: existing.word,
        cefr_level: existing.cefr_level || 'B2',
        translation: existing.translation,
        definition: existing.definition,
        context_sentence: existing.context_sentence || context,
        alreadySaved: true,
      });
      return;
    }

    // 2. Sözlükte yoksa AI / Backend üzerinden anlamını çek
    setIsLookingUp(true);
    setLookupWord({
      word: cleaned,
      cefr_level: 'B2',
      translation: 'Anlamı getiriliyor...',
      definition: '',
      context_sentence: context,
      alreadySaved: false,
    });

    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${API_URL}/api/media-sources/process_url/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: context, level: 'A1' }),
      });

      if (response.ok) {
        const data = await response.json();
        const list = data.bulunan_kelimeler || [];
        const match = list.find(
          (item: any) => item.kelime?.toLowerCase() === lower
        );

        if (match) {
          setLookupWord({
            word: match.kelime,
            cefr_level: match.seviye || 'B2',
            translation: match.turkce_ceviri,
            definition: match.ingilizce_tanim,
            context_sentence: match.baglam || context,
            alreadySaved: false,
          });
          setIsLookingUp(false);
          return;
        }
      }

      // Eşleşme bulunamazsa temiz yedek görünüm
      setLookupWord({
        word: cleaned,
        cefr_level: 'B2',
        translation: 'Bağlamdan seçilen kelime',
        definition: 'Bu kelimeyi sözlüğüne ekleyip daha sonra kartlarda çalışabilirsin.',
        context_sentence: context,
        alreadySaved: false,
      });
    } catch (e) {
      setLookupWord({
        word: cleaned,
        cefr_level: 'B2',
        translation: 'Bağlantı sağlanamadı',
        definition: 'Sunucu yanıt vermedi, ancak kelimeyi yine de kaydedebilirsin.',
        context_sentence: context,
        alreadySaved: false,
      });
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleSaveLookedUpWord = async () => {
    if (!lookupWord || lookupWord.alreadySaved) return;
    setIsSavingWord(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${API_URL}/api/contextual-words/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          word: lookupWord.word,
          cefr_level: lookupWord.cefr_level || 'B2',
          translation: lookupWord.translation,
          definition: lookupWord.definition,
          context_sentence: lookupWord.context_sentence,
          status: 'new',
        }),
      });

      if (response.ok) {
        const savedData = await response.json();
        setSavedWordsMap((prev) => ({
          ...prev,
          [lookupWord.word.toLowerCase()]: savedData,
        }));
        setLookupWord((prev) => (prev ? { ...prev, alreadySaved: true } : null));
      } else {
        Alert.alert('Hata', 'Kelime sözlüğe eklenemedi.');
      }
    } catch (e) {
      Alert.alert('Hata', 'Sunucuya ulaşılamadı.');
    } finally {
      setIsSavingWord(false);
    }
  };

  // OKUMA MODU EKRANI
  if (selectedText) {
    const tokens = selectedText.content.split(/(\s+)/);

    return (
      <ImageBackground source={bgSource} style={styles.backgroundImage}>
        <LinearGradient
          colors={['rgba(26, 11, 46, 0.72)', 'rgba(19, 11, 41, 0.94)', 'rgba(19, 11, 41, 1)']}
          style={styles.overlay}
        >
          <SafeAreaView style={styles.container}>
            <View style={styles.readerHeader}>
              <TouchableOpacity
                onPress={() => setSelectedText(null)}
                style={styles.iconButton}
              >
                <Ionicons name="arrow-back" size={22} color="#C4B5FD" />
              </TouchableOpacity>

              <Text style={styles.readerTitle} numberOfLines={1}>
                {selectedText.title}
              </Text>

              <View style={styles.fontControls}>
                <TouchableOpacity
                  onPress={() => setFontSize((s) => Math.max(14, s - 2))}
                  style={styles.fontBtn}
                >
                  <Text style={styles.fontBtnText}>A-</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setFontSize((s) => Math.min(24, s + 2))}
                  style={styles.fontBtn}
                >
                  <Text style={styles.fontBtnText}>A+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.readerHintBar}>
              <Ionicons name="hand-left-outline" size={14} color="#FEF08A" />
              <Text style={styles.readerHintText}>
                Anlamını görmek istediğin herhangi bir kelimeye dokun
              </Text>
            </View>

            <ScrollView
              contentContainerStyle={styles.readerScroll}
              showsVerticalScrollIndicator={false}
            >
              <BlurView intensity={40} tint="dark" style={styles.readerCard}>
                <Text style={[styles.readerText, { fontSize, lineHeight: fontSize * 1.65 }]}>
                  {tokens.map((token, idx) => {
                    if (/^\s+$/.test(token)) {
                      return token;
                    }
                    const clean = token.replace(/[^a-zA-Z'-]/g, '').toLowerCase();
                    const isSaved = !!savedWordsMap[clean];

                    return (
                      <Text
                        key={idx}
                        onPress={() => handleWordPress(token)}
                        style={isSaved ? styles.highlightedWord : undefined}
                      >
                        {token}
                      </Text>
                    );
                  })}
                </Text>
              </BlurView>
            </ScrollView>

            {/* KELİME ANLAMI MODALI */}
            <Modal
              visible={!!lookupWord}
              transparent
              animationType="slide"
              onRequestClose={() => setLookupWord(null)}
            >
              <TouchableOpacity
                style={styles.modalBackdrop}
                activeOpacity={1}
                onPress={() => setLookupWord(null)}
              >
                <TouchableOpacity activeOpacity={1} style={{ width: '100%' }}>
                  <BlurView intensity={65} tint="dark" style={styles.lookupCard}>
                    <View style={styles.lookupHeader}>
                      <View style={styles.lookupTitleRow}>
                        <Text style={styles.lookupWordTitle}>{lookupWord?.word}</Text>
                        <View style={styles.levelBadge}>
                          <Text style={styles.levelBadgeText}>
                            {lookupWord?.cefr_level || 'B2'}
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity onPress={() => setLookupWord(null)}>
                        <Ionicons name="close" size={24} color="#C4B5FD" />
                      </TouchableOpacity>
                    </View>

                    {isLookingUp ? (
                      <View style={styles.lookupLoading}>
                        <ActivityIndicator size="small" color="#FEF08A" />
                        <Text style={styles.lookupLoadingText}>
                          Anlamı analiz ediliyor...
                        </Text>
                      </View>
                    ) : (
                      <>
                        <Text style={styles.lookupTranslation}>
                          {lookupWord?.translation}
                        </Text>
                        {lookupWord?.definition ? (
                          <Text style={styles.lookupDefinition}>
                            {lookupWord.definition}
                          </Text>
                        ) : null}

                        <TouchableOpacity
                          style={[
                            styles.addWordBtn,
                            lookupWord?.alreadySaved && styles.addWordBtnSaved,
                          ]}
                          onPress={handleSaveLookedUpWord}
                          disabled={lookupWord?.alreadySaved || isSavingWord}
                        >
                          {isSavingWord ? (
                            <ActivityIndicator size="small" color="#1E1B4B" />
                          ) : (
                            <>
                              <Ionicons
                                name={
                                  lookupWord?.alreadySaved
                                    ? 'checkmark-circle'
                                    : 'add-circle-outline'
                                }
                                size={20}
                                color="#1E1B4B"
                              />
                              <Text style={styles.addWordBtnText}>
                                {lookupWord?.alreadySaved
                                  ? 'Sözlüğünde Kayıtlı'
                                  : 'Sözlüğüme Ekle'}
                              </Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </>
                    )}
                  </BlurView>
                </TouchableOpacity>
              </TouchableOpacity>
            </Modal>
          </SafeAreaView>
        </LinearGradient>
      </ImageBackground>
    );
  }

  // METİNLERİM LİSTE EKRANI
  return (
    <ImageBackground source={bgSource} style={styles.backgroundImage}>
      <LinearGradient
        colors={['rgba(26, 11, 46, 0.6)', 'rgba(26, 11, 46, 0.9)', 'rgba(26, 11, 46, 1)']}
        style={styles.overlay}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <View style={styles.iconButtonPlaceholder} />
            <Text style={styles.title}>Metinlerim</Text>
            <TouchableOpacity
              style={styles.addHeaderBtn}
              onPress={() => setShowAddModal(true)}
            >
              <Ionicons name="add" size={22} color="#1E1B4B" />
            </TouchableOpacity>
          </View>

          {texts.length === 0 ? (
            <View style={styles.centerState}>
              <Ionicons name="document-text-outline" size={56} color="#C4B5FD" />
              <Text style={styles.stateTitle}>Henüz Kayıtlı Metin Yok</Text>
              <Text style={styles.stateSubtitle}>
                Ana sayfada analiz ettiğin metinler burada otomatik birikir veya sağ üstteki "+" ile yeni metin ekleyebilirsin.
              </Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
              {texts.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.85}
                  onPress={() => setSelectedText(item)}
                >
                  <BlurView intensity={35} tint="dark" style={styles.textCard}>
                    <View style={styles.textCardHeader}>
                      <View style={styles.textTitleRow}>
                        <Ionicons
                          name={item.type === 'link' ? 'link' : 'document-text'}
                          size={18}
                          color="#FEF08A"
                        />
                        <Text style={styles.textTitle} numberOfLines={1}>
                          {item.title}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleDeleteText(item.id)}
                        style={styles.deleteBtn}
                      >
                        <Ionicons name="trash-outline" size={18} color="#F43F5E" />
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.textPreview} numberOfLines={3}>
                      {item.content}
                    </Text>

                    <View style={styles.textFooter}>
                      <Text style={styles.textDate}>{item.date}</Text>
                      <View style={styles.readPill}>
                        <Text style={styles.readPillText}>Oku</Text>
                        <Ionicons name="chevron-forward" size={14} color="#FEF08A" />
                      </View>
                    </View>
                  </BlurView>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* YENİ METİN EKLEME MODALI */}
          <Modal visible={showAddModal} transparent animationType="slide">
            <View style={styles.modalBackdrop}>
              <BlurView intensity={65} tint="dark" style={styles.lookupCard}>
                <View style={styles.lookupHeader}>
                  <Text style={styles.lookupWordTitle}>Yeni Metin Ekle</Text>
                  <TouchableOpacity onPress={() => setShowAddModal(false)}>
                    <Ionicons name="close" size={24} color="#C4B5FD" />
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={styles.input}
                  placeholder="Başlık (isteğe bağlı)..."
                  placeholderTextColor="#94A3B8"
                  value={newTitle}
                  onChangeText={setNewTitle}
                />

                <TextInput
                  style={[styles.input, { height: 140, textAlignVertical: 'top', marginTop: 12 }]}
                  placeholder="Okumak istediğin İngilizce metni buraya yapıştır..."
                  placeholderTextColor="#94A3B8"
                  multiline
                  value={newContent}
                  onChangeText={setNewContent}
                />

                <TouchableOpacity style={styles.addWordBtn} onPress={handleAddText}>
                  <Ionicons name="bookmark-outline" size={20} color="#1E1B4B" />
                  <Text style={styles.addWordBtnText}>Metinlerime Kaydet</Text>
                </TouchableOpacity>
              </BlurView>
            </View>
          </Modal>
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
  iconButtonPlaceholder: { width: 38 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#FDF4FF', letterSpacing: 0.3 },
  addHeaderBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FEF08A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  stateTitle: { fontSize: 20, fontWeight: 'bold', color: '#FDF4FF', marginTop: 14, marginBottom: 8 },
  stateSubtitle: { fontSize: 14, color: '#C4B5FD', textAlign: 'center', lineHeight: 21 },
  scroll: { paddingHorizontal: 20, paddingBottom: 28 },

  textCard: {
    backgroundColor: 'rgba(30, 15, 50, 0.45)',
    padding: 18,
    borderRadius: 22,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(254, 240, 138, 0.22)',
    overflow: 'hidden',
  },
  textCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  textTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, paddingRight: 10 },
  textTitle: { color: '#FDF4FF', fontSize: 17, fontWeight: 'bold', flex: 1 },
  deleteBtn: { backgroundColor: 'rgba(244, 63, 94, 0.12)', padding: 7, borderRadius: 10 },
  textPreview: { color: '#C4B5FD', fontSize: 14, lineHeight: 20, marginBottom: 14 },
  textFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  textDate: { color: '#94A3B8', fontSize: 12 },
  readPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(254, 240, 138, 0.14)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
  },
  readPillText: { color: '#FEF08A', fontSize: 13, fontWeight: 'bold' },

  // READER MODE
  readerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 10,
  },
  iconButton: { padding: 8, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12 },
  readerTitle: { flex: 1, color: '#FDF4FF', fontSize: 18, fontWeight: 'bold' },
  fontControls: { flexDirection: 'row', gap: 6 },
  fontBtn: {
    backgroundColor: 'rgba(254, 240, 138, 0.14)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(254, 240, 138, 0.3)',
  },
  fontBtnText: { color: '#FEF08A', fontSize: 13, fontWeight: 'bold' },
  readerHintBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 12,
  },
  readerHintText: { color: '#C4B5FD', fontSize: 12 },
  readerScroll: { paddingHorizontal: 18, paddingBottom: 32 },
  readerCard: {
    backgroundColor: 'rgba(30, 15, 50, 0.55)',
    padding: 22,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(254, 240, 138, 0.25)',
    overflow: 'hidden',
  },
  readerText: { color: '#F8FAFC', letterSpacing: 0.2 },
  highlightedWord: {
    color: '#FEF08A',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },

  // MODALS
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  lookupCard: {
    backgroundColor: 'rgba(26, 11, 46, 0.96)',
    borderRadius: 28,
    padding: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(254, 240, 138, 0.35)',
    overflow: 'hidden',
  },
  lookupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  lookupTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  lookupWordTitle: { color: '#FDF4FF', fontSize: 22, fontWeight: 'bold', textTransform: 'capitalize' },
  levelBadge: {
    backgroundColor: 'rgba(254, 240, 138, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(254, 240, 138, 0.45)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  levelBadgeText: { color: '#FEF08A', fontSize: 12, fontWeight: 'bold' },
  lookupLoading: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 16 },
  lookupLoadingText: { color: '#C4B5FD', fontSize: 14 },
  lookupTranslation: { color: '#FEF08A', fontSize: 19, fontWeight: 'bold', marginBottom: 8 },
  lookupDefinition: { color: '#C4B5FD', fontSize: 14, lineHeight: 20, marginBottom: 18 },
  addWordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF08A',
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 14,
  },
  addWordBtnSaved: { backgroundColor: '#86EFAC' },
  addWordBtnText: { color: '#1E1B4B', fontSize: 15, fontWeight: 'bold' },
  input: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: 14,
    padding: 14,
    color: '#FDF4FF',
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.35)',
  },
});