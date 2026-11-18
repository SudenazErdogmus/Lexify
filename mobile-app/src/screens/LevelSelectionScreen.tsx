import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Dimensions, ImageBackground, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');
const bgSource = require('../../assets/login-bg.jpeg');

const LEVELS = [
  { id: 'A1', label: 'Başlangıç' },
  { id: 'A2', label: 'Temel' },
  { id: 'B1', label: 'Orta' },
  { id: 'B2', label: 'İyi' },
  { id: 'C1', label: 'İleri' },
  { id: 'C2', label: 'Yetkin' }
];

export default function LevelSelectionScreen({ route, navigation }: any) {
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  
  // Login'den gelen ismi alıyoruz
  const username = route?.params?.username || 'Kullanıcı';

  const handleContinue = () => {
    if (!selectedLevel) return;
    // Seviye seçildikten sonra Ana Ekrana yönlendiriyoruz (ismi de taşıyarak)
    navigation.replace('MainApp', { username, level: selectedLevel });
  };

  return (
    <ImageBackground source={bgSource} style={styles.backgroundImage}>
      <LinearGradient 
        colors={['rgba(26, 11, 46, 0.5)', 'rgba(26, 11, 46, 0.85)', 'rgba(26, 11, 46, 1)']} 
        style={styles.overlay}
      >
        <SafeAreaView style={styles.container}>
          
          <View style={styles.header}>
            <Text style={styles.greeting}>Hoş geldin, {username} 🚀</Text>
            <Text style={styles.subGreeting}>Lexify'ın içerikleri sana uygun analiz edebilmesi için mevcut İngilizce seviyeni seçmelisin.</Text>
          </View>

          <View style={styles.gridContainer}>
            {LEVELS.map((level) => {
              const isSelected = selectedLevel === level.id;
              return (
                <TouchableOpacity 
                  key={level.id} 
                  style={styles.cardWrapper} 
                  onPress={() => setSelectedLevel(level.id)}
                  activeOpacity={0.7}
                >
                  <BlurView 
                    intensity={isSelected ? 60 : 30} 
                    tint="dark" 
                    style={[
                      styles.levelCard, 
                      isSelected && styles.levelCardSelected
                    ]}
                  >
                    <Text style={[styles.levelId, isSelected && styles.levelIdSelected]}>
                      {level.id}
                    </Text>
                    <Text style={[styles.levelLabel, isSelected && styles.levelLabelSelected]}>
                      {level.label}
                    </Text>
                    {isSelected && (
                      <View style={styles.checkIcon}>
                        <Ionicons name="checkmark-circle" size={24} color="#1E1B4B" />
                      </View>
                    )}
                  </BlurView>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Devam Et Butonu - Sadece seviye seçildiğinde aktif olur */}
          <TouchableOpacity 
            style={[styles.primaryButton, !selectedLevel && styles.primaryButtonDisabled]} 
            onPress={handleContinue}
            disabled={!selectedLevel}
          >
            <Text style={[styles.primaryButtonText, !selectedLevel && styles.primaryButtonTextDisabled]}>
              Uygulamaya Başla
            </Text>
            <Ionicons 
              name="arrow-forward" 
              size={20} 
              color={selectedLevel ? '#1E1B4B' : '#64748B'} 
              style={{ marginLeft: 8 }} 
            />
          </TouchableOpacity>

        </SafeAreaView>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: { flex: 1, width: '100%', height: '100%' },
  overlay: { flex: 1 },
  container: { 
    flex: 1, 
    paddingHorizontal: 24, 
    justifyContent: 'center',
    paddingTop: Platform.OS === 'android' ? 40 : 20,
    paddingBottom: 30
  },
  
  header: { marginBottom: 40, alignItems: 'center' },
  greeting: { fontSize: 26, fontWeight: 'bold', color: '#FDF4FF', textAlign: 'center', marginBottom: 10 },
  subGreeting: { fontSize: 15, color: '#C4B5FD', textAlign: 'center', lineHeight: 22, paddingHorizontal: 10 },

  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  cardWrapper: {
    width: (width - 65) / 2, // 2 sütunlu grid yapısı
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  levelCard: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.3)',
    borderRadius: 20,
    position: 'relative',
  },
  levelCardSelected: {
    backgroundColor: '#FEF08A', // Seçilince sarı pastel renkle dolar
    borderColor: '#FEF08A',
  },
  
  levelId: { fontSize: 32, fontWeight: 'bold', color: '#FDF4FF', marginBottom: 5 },
  levelIdSelected: { color: '#1E1B4B' }, // Seçilince lacivert/siyah olur
  
  levelLabel: { fontSize: 14, color: '#C4B5FD', fontWeight: '500' },
  levelLabelSelected: { color: '#4338CA', fontWeight: 'bold' },

  checkIcon: { position: 'absolute', top: 10, right: 10 },

  primaryButton: { 
    flexDirection: 'row', 
    backgroundColor: '#FEF08A', 
    padding: 18, 
    borderRadius: 16, 
    alignItems: 'center', 
    justifyContent: 'center',
    shadowColor: '#FEF08A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  primaryButtonDisabled: {
    backgroundColor: 'rgba(30, 15, 50, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.2)',
    shadowOpacity: 0,
  },
  primaryButtonText: { color: '#1E1B4B', fontSize: 18, fontWeight: 'bold' },
  primaryButtonTextDisabled: { color: '#64748B' },
});