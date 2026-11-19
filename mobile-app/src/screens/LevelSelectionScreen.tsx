import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ImageBackground, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import AsyncStorage from '@react-native-async-storage/async-storage';

const bgSource = require('../../assets/login-bg.jpeg');
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export default function LevelSelectionScreen({ navigation }: any) {
  const [selectedLevel, setSelectedLevel] = useState<string>('B1');

  const handleSaveLevel = async () => {
    try {
      await AsyncStorage.setItem('userLevel', selectedLevel);
      navigation.replace('MainApp');
    } catch (error) {
      console.error('Seviye kaydedilemedi:', error);
    }
  };

  return (
    <ImageBackground source={bgSource} style={styles.backgroundImage}>
      <LinearGradient
        colors={['rgba(26, 11, 46, 0.5)', 'rgba(26, 11, 46, 0.85)', 'rgba(26, 11, 46, 1)']}
        style={styles.overlay}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.title}>Seviyenizi Seçin</Text>
            <Text style={styles.subtitle}>
              Size en uygun kelimeleri bulabilmemiz için seviyenizi belirleyin. Daha sonra profilinizden değiştirebilirsiniz.
            </Text>

            <View style={styles.grid}>
              {LEVELS.map((level) => {
                const isSelected = selectedLevel === level;
                return (
                  <TouchableOpacity
                    key={level}
                    style={styles.cardWrapper}
                    onPress={() => setSelectedLevel(level)}
                    activeOpacity={0.8}
                  >
                    <BlurView
                      intensity={isSelected ? 55 : 30}
                      tint="dark"
                      style={[styles.levelCard, isSelected && styles.levelCardSelected]}
                    >
                      <Text style={[styles.levelText, isSelected && styles.levelTextSelected]}>
                        {level}
                      </Text>
                    </BlurView>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={handleSaveLevel} activeOpacity={0.85}>
              <Text style={styles.primaryButtonText}>Seviyemi Kaydet ve Başla</Text>
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
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 40 : 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FDF4FF',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#C4B5FD',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 36,
    paddingHorizontal: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 36,
  },
  cardWrapper: {
    width: '30.5%',
    aspectRatio: 1.25,
    marginBottom: 14,
    borderRadius: 18,
    overflow: 'hidden',
  },
  levelCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(30, 15, 50, 0.4)',
    borderWidth: 1.5,
    borderColor: 'rgba(167, 139, 250, 0.3)',
    borderRadius: 18,
  },
  levelCardSelected: {
    backgroundColor: 'rgba(254, 240, 138, 0.16)',
    borderColor: '#FEF08A',
  },
  levelText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#C4B5FD',
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  levelTextSelected: {
    color: '#FEF08A',
  },
  primaryButton: {
    backgroundColor: '#FEF08A',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#1E1B4B',
    fontSize: 17,
    fontWeight: 'bold',
  },
});