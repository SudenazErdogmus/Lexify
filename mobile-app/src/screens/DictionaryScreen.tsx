import React, { useState, useCallback, useMemo } from 'react';
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
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const API_URL = 'http://192.168.1.107:8000';
const bgSource = require('../../assets/login-bg.jpeg');
const LEVELS = ['Tümü', 'A2', 'B1', 'B2', 'C1', 'C2'];

interface SavedWord {
  id: number;
  word: string;
  cefr_level?: string;
  translation: string;
  definition: string;
  context_sentence: string;
  status: string;
}

export default function DictionaryScreen({ navigation }: any) {
  const [words, setWords] = useState<SavedWord[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<string>('Tümü');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWords = async () => {
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
      }
    } catch (error) {
      Alert.alert('Hata', 'Sözlük yüklenirken sunucuya ulaşılamadı.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchWords();
    }, [])
  );

  const deleteWord = async (id: number) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${API_URL}/api/contextual-words/${id}/`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        setWords((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (error) {
      Alert.alert('Hata', 'Kelime silinemedi.');
    }
  };

  // Seviyeye göre filtrele, A-Z sırala ve baş harfe göre grupla
  const groupedWords = useMemo(() => {
    const filtered =
      selectedLevel === 'Tümü'
        ? words
        : words.filter((item) => (item.cefr_level || 'B2').toUpperCase() === selectedLevel);

    const sorted = [...filtered].sort((a, b) =>
      a.word.toLowerCase().localeCompare(b.word.toLowerCase(), 'en')
    );

    const groups: { letter: string; items: SavedWord[] }[] = [];
    for (const item of sorted) {
      const letter = item.word.trim().charAt(0).toUpperCase() || '#';
      const existingGroup = groups.find((g) => g.letter === letter);
      if (existingGroup) {
        existingGroup.items.push(item);
      } else {
        groups.push({ letter, items: [item] });
      }
    }
    return groups;
  }, [words, selectedLevel]);

  const filteredCount = useMemo(
    () => groupedWords.reduce((sum, group) => sum + group.items.length, 0),
    [groupedWords]
  );

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
            <Text style={styles.title}>Sözlüğüm</Text>
            <View style={styles.iconButtonPlaceholder} />
          </View>

          {/* SEVİYE FİLTRE SEKMELERİ */}
          <View style={styles.levelBarWrap}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.levelBar}
            >
              {LEVELS.map((lvl) => {
                const isActive = selectedLevel === lvl;
                return (
                  <TouchableOpacity
                    key={lvl}
                    style={[styles.levelChip, isActive && styles.levelChipActive]}
                    onPress={() => setSelectedLevel(lvl)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.levelChipText, isActive && styles.levelChipTextActive]}>
                      {lvl}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {isLoading ? (
            <View style={styles.centerState}>
              <ActivityIndicator size="large" color="#FEF08A" />
              <Text style={styles.stateSubtitle}>Kelimelerin yükleniyor...</Text>
            </View>
          ) : groupedWords.length === 0 ? (
            <View style={styles.centerState}>
              <Ionicons name="book-outline" size={52} color="#C4B5FD" />
              <Text style={styles.stateTitle}>
                {selectedLevel === 'Tümü' ? 'Sözlüğün Henüz Boş' : `${selectedLevel} Seviyesinde Kelime Yok`}
              </Text>
              <Text style={styles.stateSubtitle}>
                Metin analiz edip eklediğin kelimeler burada seviyesine ve A-Z sırasına göre listelenir.
              </Text>
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={styles.scroll}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={() => {
                    setRefreshing(true);
                    fetchWords();
                  }}
                  tintColor="#FEF08A"
                />
              }
            >
              {groupedWords.map((group) => (
                <View key={group.letter} style={styles.letterSection}>
                  <View style={styles.letterHeader}>
                    <Text style={styles.letterText}>{group.letter}</Text>
                    <View style={styles.letterLine} />
                  </View>

                  {group.items.map((item) => (
                    <BlurView key={item.id} intensity={35} tint="dark" style={styles.wordCard}>
                      <View style={styles.wordHeader}>
                        <View style={styles.wordTitleRow}>
                          <Text style={styles.wordTitle}>{item.word}</Text>
                          <View style={styles.levelBadge}>
                            <Text style={styles.levelBadgeText}>{item.cefr_level || 'B2'}</Text>
                          </View>
                        </View>
                        <TouchableOpacity onPress={() => deleteWord(item.id)} style={styles.deleteButton}>
                          <Ionicons name="trash-outline" size={18} color="#F43F5E" />
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.wordTranslation}>{item.translation}</Text>
                      <Text style={styles.wordDefinition}>{item.definition}</Text>

                      {item.context_sentence ? (
                        <View style={styles.contextBox}>
                          <Text style={styles.contextLabel}>Bağlam</Text>
                          <Text style={styles.contextText}>"{item.context_sentence}"</Text>
                        </View>
                      ) : null}
                    </BlurView>
                  ))}
                </View>
              ))}
            </ScrollView>
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
  levelBarWrap: { marginBottom: 10 },
  levelBar: { paddingHorizontal: 20, gap: 10 },
  levelChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(196, 181, 253, 0.2)',
  },
  levelChipActive: {
    backgroundColor: '#FEF08A',
    borderColor: '#FEF08A',
  },
  levelChipText: { color: '#C4B5FD', fontSize: 14, fontWeight: '600' },
  levelChipTextActive: { color: '#1E1B4B', fontWeight: 'bold' },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  stateTitle: { fontSize: 20, fontWeight: 'bold', color: '#FDF4FF', marginTop: 14, marginBottom: 8, textAlign: 'center' },
  stateSubtitle: { fontSize: 14, color: '#C4B5FD', textAlign: 'center', lineHeight: 21, marginTop: 8 },
  scroll: { paddingHorizontal: 20, paddingBottom: 24 },
  letterSection: { marginBottom: 12 },
  letterHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  letterText: { color: '#FEF08A', fontSize: 18, fontWeight: 'bold' },
  letterLine: { flex: 1, height: 1, backgroundColor: 'rgba(254, 240, 138, 0.2)' },
  wordCard: {
    backgroundColor: 'rgba(30, 15, 50, 0.4)',
    padding: 18,
    borderRadius: 22,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(254, 240, 138, 0.22)',
    overflow: 'hidden',
  },
  wordHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  wordTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  wordTitle: { color: '#FDF4FF', fontSize: 22, fontWeight: 'bold', textTransform: 'capitalize' },
  levelBadge: {
    backgroundColor: 'rgba(254, 240, 138, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(254, 240, 138, 0.45)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  levelBadgeText: { color: '#FEF08A', fontSize: 12, fontWeight: 'bold' },
  deleteButton: { backgroundColor: 'rgba(244, 63, 94, 0.12)', padding: 8, borderRadius: 10 },
  wordTranslation: { color: '#FEF08A', fontSize: 16, fontWeight: '600', marginBottom: 6 },
  wordDefinition: { color: '#C4B5FD', fontSize: 14, marginBottom: 12, lineHeight: 20 },
  contextBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#FEF08A',
  },
  contextLabel: { color: '#94A3B8', fontSize: 11, fontWeight: '700', letterSpacing: 0.6, marginBottom: 4 },
  contextText: { color: '#E2E8F0', fontSize: 13, fontStyle: 'italic', lineHeight: 19 },
});