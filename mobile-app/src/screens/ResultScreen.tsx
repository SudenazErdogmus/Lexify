import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView, ImageBackground, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

const bgSource = require('../../assets/login-bg.jpeg');

const WORDS = [
  { kelime: 'ubiquitous', ceviri: 'her yerde bulunan', tanim: 'seeming to be everywhere or in several places at the same time', baglam: 'The ubiquitous nature of technology...' },
  { kelime: 'paradigm', ceviri: 'paradigma, model', tanim: 'a typical example, pattern, or system of ideas', baglam: '...fundamentally altered our paradigm of communication.' },
  { kelime: 'fundamentally', ceviri: 'esaslı bir şekilde', tanim: 'in a basic and most important way', baglam: '...has fundamentally altered our paradigm...' },
];

export default function ResultScreen({ navigation }: any) {
  const [saved, setSaved] = useState<string[]>([]);

  const toggleSave = (word: string) => {
    setSaved((current) =>
      current.includes(word) ? current.filter((item) => item !== word) : [...current, word]
    );
  };

  const saveAll = () => {
    setSaved(WORDS.map((item) => item.kelime));
  };

  const allSaved = saved.length === WORDS.length;

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

          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <BlurView intensity={40} tint="dark" style={styles.successBanner}>
              <View style={styles.successIcon}>
                <Ionicons name="sparkles" size={22} color="#FEF08A" />
              </View>
              <View style={styles.successTextWrap}>
                <Text style={styles.successTitle}>{WORDS.length} yeni kelime bulundu</Text>
                <Text style={styles.successSubtitle}>
                  {saved.length === 0 ? 'Sözlüğüne eklemek istediklerini seç.' : `${saved.length} kelime sözlüğüne eklendi.`}
                </Text>
              </View>
            </BlurView>

            {WORDS.map((item) => {
              const isSaved = saved.includes(item.kelime);
              return (
                <BlurView key={item.kelime} intensity={35} tint="dark" style={styles.wordCard}>
                  <View style={styles.wordHeader}>
                    <Text style={styles.wordTitle}>{item.kelime}</Text>
                    <View style={styles.audioButton}>
                      <Ionicons name="volume-high" size={18} color="#FEF08A" />
                    </View>
                  </View>
                  <Text style={styles.wordTranslation}>{item.ceviri}</Text>
                  <Text style={styles.wordDefinition}>{item.tanim}</Text>

                  <View style={styles.contextBox}>
                    <Text style={styles.contextLabel}>Bağlam</Text>
                    <Text style={styles.contextText}>"{item.baglam}"</Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.addButton, isSaved && styles.addButtonSaved]}
                    onPress={() => toggleSave(item.kelime)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={isSaved ? 'checkmark-circle' : 'add-circle-outline'}
                      size={20}
                      color="#1E1B4B"
                    />
                    <Text style={styles.addButtonText}>{isSaved ? 'Eklendi' : 'Sözlüğüme Ekle'}</Text>
                  </TouchableOpacity>
                </BlurView>
              );
            })}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={allSaved ? () => navigation.goBack() : saveAll}
              activeOpacity={0.85}
            >
              <Ionicons
                name={allSaved ? 'arrow-back' : 'library-outline'}
                size={20}
                color="#1E1B4B"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.primaryButtonText}>{allSaved ? 'Ana Sayfaya Dön' : 'Tümünü Ekle'}</Text>
            </TouchableOpacity>
          </View>
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
  wordTitle: { color: '#FDF4FF', fontSize: 24, fontWeight: 'bold', textTransform: 'capitalize' },
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
  addButtonSaved: { backgroundColor: '#FDE68A' },
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
