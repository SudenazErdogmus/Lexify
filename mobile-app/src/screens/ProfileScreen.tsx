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
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const API_URL = 'http://192.168.1.107:8000';
const bgSource = require('../../assets/login-bg.jpeg');
const LEVELS = ['A2', 'B1', 'B2', 'C1', 'C2'];

export default function ProfileScreen({ onLogout }: any) {
  const [username, setUsername] = useState('ladypadme');
  const [email, setEmail] = useState('ladypadme@lexify.app');
  const [newEmail, setNewEmail] = useState('');
  const [isEditingEmail, setIsEditingEmail] = useState(false);

  const [level, setLevel] = useState('B1');
  const [totalWords, setTotalWords] = useState(0);
  const [masteredWords, setMasteredWords] = useState(0);

  const [isPro, setIsPro] = useState(false);
  const [showProModal, setShowProModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');

  const loadProfileData = async () => {
    try {
      const savedLevel = await AsyncStorage.getItem('userLevel');
      const savedEmail = await AsyncStorage.getItem('userEmail');
      const savedUser = await AsyncStorage.getItem('username');
      const savedPro = await AsyncStorage.getItem('isPro');
      const token = await AsyncStorage.getItem('userToken');

      if (savedLevel) setLevel(savedLevel);
      if (savedEmail) setEmail(savedEmail);
      if (savedUser) setUsername(savedUser);
      if (savedPro === 'true') setIsPro(true);

      if (token) {
        const response = await fetch(`${API_URL}/api/contextual-words/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setTotalWords(data.length);
          setMasteredWords(data.filter((w: any) => w.status === 'mastered').length);
        }
      }
    } catch (e) {
      // Sunucu kapalıysa mevcut değerlerle devam et
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadProfileData();
    }, [])
  );

  const handleSaveEmail = async () => {
    const trimmed = newEmail.trim();
    if (!trimmed || !trimmed.includes('@')) {
      Alert.alert('Geçersiz E-posta', 'Lütfen geçerli bir e-posta adresi gir.');
      return;
    }
    setEmail(trimmed);
    await AsyncStorage.setItem('userEmail', trimmed);
    setIsEditingEmail(false);
    setNewEmail('');
    Alert.alert('Güncellendi', 'E-posta adresin başarıyla güncellendi.');
  };

  const handleSelectLevel = (lvl: string) => {
    if (lvl === level) return;

    Alert.alert(
      'Seviye Değişikliği',
      `İngilizce seviyeni ${lvl} olarak güncellemek istediğine emin misin? Analiz sonuçları bu seviyeye göre belirlenecek.`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Evet, Güncelle',
          onPress: async () => {
            setLevel(lvl);
            await AsyncStorage.setItem('userLevel', lvl);
          },
        },
      ]
    );
  };

  const handleActivatePro = async () => {
    setIsPro(true);
    await AsyncStorage.setItem('isPro', 'true');
    setShowProModal(false);
    Alert.alert('Hoş Geldin!', 'Lexify Pro aboneliğin aktif edildi.');
  };

  const confirmLogout = () => {
    Alert.alert('Çıkış Yap', 'Hesabından çıkış yapmak istediğine emin misin?', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Çıkış Yap', style: 'destructive', onPress: onLogout },
    ]);
  };

  return (
    <ImageBackground source={bgSource} style={styles.backgroundImage}>
      <LinearGradient
        colors={['rgba(26, 11, 46, 0.6)', 'rgba(26, 11, 46, 0.9)', 'rgba(26, 11, 46, 1)']}
        style={styles.overlay}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Profil</Text>
          </View>

          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            {/* KULLANICI KARTI */}
            <BlurView intensity={45} tint="dark" style={styles.profileCard}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarLetter}>{username.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.profileInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.username}>{username}</Text>
                  <View style={[styles.planBadge, isPro && styles.planBadgePro]}>
                    <Text style={[styles.planBadgeText, isPro && styles.planBadgeTextPro]}>
                      {isPro ? 'PRO' : 'ÜCRETSİZ'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.emailText}>{email}</Text>
              </View>
            </BlurView>

            {/* CANLI İSTATİSTİKLER */}
            <View style={styles.statsRow}>
              <BlurView intensity={35} tint="dark" style={styles.statBox}>
                <Ionicons name="book-outline" size={22} color="#FEF08A" />
                <Text style={styles.statValue}>{totalWords}</Text>
                <Text style={styles.statLabel}>Kayıtlı Kelime</Text>
              </BlurView>

              <BlurView intensity={35} tint="dark" style={styles.statBox}>
                <Ionicons name="checkmark-done-circle-outline" size={22} color="#86EFAC" />
                <Text style={styles.statValue}>{masteredWords}</Text>
                <Text style={styles.statLabel}>Öğrenilen</Text>
              </BlurView>

              <BlurView intensity={35} tint="dark" style={styles.statBox}>
                <Ionicons name="school-outline" size={22} color="#C4B5FD" />
                <Text style={styles.statValue}>{level}</Text>
                <Text style={styles.statLabel}>Seviye</Text>
              </BlurView>
            </View>

            {/* ABONELİK (LEXIFY PRO) KARTI */}
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => !isPro && setShowProModal(true)}
            >
              <LinearGradient
                colors={
                  isPro
                    ? ['rgba(134, 239, 172, 0.22)', 'rgba(30, 15, 50, 0.6)']
                    : ['rgba(254, 240, 138, 0.25)', 'rgba(167, 139, 250, 0.18)']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.proBanner}
              >
                <View style={styles.proIconWrap}>
                  <Ionicons name={isPro ? 'shield-checkmark' : 'sparkles'} size={24} color="#FEF08A" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.proTitle}>
                    {isPro ? 'Lexify Pro Aktif' : "Lexify Pro'ya Yükselt"}
                  </Text>
                  <Text style={styles.proSubtitle}>
                    {isPro
                      ? 'Sınırsız AI analiz ve Notion senkronizasyonu açık.'
                      : 'Sınırsız PDF/YouTube analizi, reklamsız kartlar ve özel raporlar.'}
                  </Text>
                </View>
                {!isPro && <Ionicons name="chevron-forward" size={20} color="#FEF08A" />}
              </LinearGradient>
            </TouchableOpacity>

            {/* SEVİYE GÜNCELLEME */}
            <BlurView intensity={35} tint="dark" style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>İngilizce Seviyem</Text>
              <View style={styles.levelRow}>
                {LEVELS.map((lvl) => {
                  const active = level === lvl;
                  return (
                    <TouchableOpacity
                      key={lvl}
                      style={[styles.levelChip, active && styles.levelChipActive]}
                      onPress={() => handleSelectLevel(lvl)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.levelChipText, active && styles.levelChipTextActive]}>
                        {lvl}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </BlurView>

            {/* HESAP AYARLARI */}
            <BlurView intensity={35} tint="dark" style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Hesap Ayarları</Text>

              {/* E-posta Güncelleme */}
              <TouchableOpacity
                style={styles.menuRow}
                onPress={() => {
                  setNewEmail(email);
                  setIsEditingEmail((prev) => !prev);
                }}
              >
                <View style={styles.menuLeft}>
                  <Ionicons name="mail-outline" size={20} color="#C4B5FD" />
                  <Text style={styles.menuText}>E-posta Adresini Güncelle</Text>
                </View>
                <Ionicons
                  name={isEditingEmail ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color="#94A3B8"
                />
              </TouchableOpacity>

              {isEditingEmail && (
                <View style={styles.editEmailBox}>
                  <TextInput
                    style={styles.input}
                    value={newEmail}
                    onChangeText={setNewEmail}
                    placeholder="Yeni e-posta adresin..."
                    placeholderTextColor="#94A3B8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  <TouchableOpacity style={styles.saveBtn} onPress={handleSaveEmail}>
                    <Text style={styles.saveBtnText}>Kaydet</Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.divider} />

              {/* Notion Durumu */}
              <View style={styles.menuRow}>
                <View style={styles.menuLeft}>
                  <Ionicons name="sync-circle-outline" size={20} color="#86EFAC" />
                  <Text style={styles.menuText}>Notion Senkronizasyonu</Text>
                </View>
                <View style={styles.connectedPill}>
                  <Text style={styles.connectedText}>Bağlı</Text>
                </View>
              </View>
            </BlurView>

            {/* ÇIKIŞ YAP */}
            <TouchableOpacity style={styles.logoutButton} onPress={confirmLogout} activeOpacity={0.85}>
              <Ionicons name="log-out-outline" size={20} color="#FDA4AF" />
              <Text style={styles.logoutText}>Çıkış Yap</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* ABONELİK MODAL */}
          <Modal visible={showProModal} transparent animationType="slide">
            <View style={styles.modalBackdrop}>
              <BlurView intensity={60} tint="dark" style={styles.modalCard}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Lexify Pro</Text>
                  <TouchableOpacity onPress={() => setShowProModal(false)}>
                    <Ionicons name="close" size={24} color="#C4B5FD" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.modalSubtitle}>
                  Yapay zeka destekli kelime öğrenimini sınırsız hale getir.
                </Text>

                <TouchableOpacity
                  style={[styles.planOption, selectedPlan === 'yearly' && styles.planOptionActive]}
                  onPress={() => setSelectedPlan('yearly')}
                >
                  <View>
                    <Text style={styles.planName}>Yıllık Plan</Text>
                    <Text style={styles.planDesc}>%40 İndirim • Aylık ₺59,90</Text>
                  </View>
                  <Text style={styles.planPrice}>₺719 / yıl</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.planOption, selectedPlan === 'monthly' && styles.planOptionActive]}
                  onPress={() => setSelectedPlan('monthly')}
                >
                  <View>
                    <Text style={styles.planName}>Aylık Plan</Text>
                    <Text style={styles.planDesc}>İstediğin zaman iptal et</Text>
                  </View>
                  <Text style={styles.planPrice}>₺99 / ay</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.upgradeBtn} onPress={handleActivatePro}>
                  <Text style={styles.upgradeBtnText}>7 Gün Ücretsiz Dene</Text>
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
  header: { alignItems: 'center', paddingVertical: 14 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#FDF4FF', letterSpacing: 0.3 },
  scroll: { paddingHorizontal: 20, paddingBottom: 32 },

  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 15, 50, 0.5)',
    padding: 18,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(254, 240, 138, 0.25)',
    overflow: 'hidden',
    marginBottom: 16,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(254, 240, 138, 0.2)',
    borderWidth: 1.5,
    borderColor: '#FEF08A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarLetter: { color: '#FEF08A', fontSize: 26, fontWeight: 'bold' },
  profileInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  username: { color: '#FDF4FF', fontSize: 20, fontWeight: 'bold' },
  planBadge: {
    backgroundColor: 'rgba(196, 181, 253, 0.18)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  planBadgePro: { backgroundColor: '#FEF08A' },
  planBadgeText: { color: '#C4B5FD', fontSize: 10, fontWeight: 'bold' },
  planBadgeTextPro: { color: '#1E1B4B' },
  emailText: { color: '#94A3B8', fontSize: 13, marginTop: 4 },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statBox: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(30, 15, 50, 0.45)',
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(254, 240, 138, 0.15)',
    overflow: 'hidden',
  },
  statValue: { color: '#FDF4FF', fontSize: 18, fontWeight: 'bold', marginTop: 6 },
  statLabel: { color: '#94A3B8', fontSize: 11, marginTop: 2 },

  proBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(254, 240, 138, 0.4)',
    marginBottom: 16,
    gap: 12,
  },
  proIconWrap: {
    backgroundColor: 'rgba(254, 240, 138, 0.15)',
    padding: 10,
    borderRadius: 14,
  },
  proTitle: { color: '#FEF08A', fontSize: 16, fontWeight: 'bold' },
  proSubtitle: { color: '#E2E8F0', fontSize: 12, marginTop: 3, lineHeight: 17 },

  sectionCard: {
    backgroundColor: 'rgba(30, 15, 50, 0.45)',
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(196, 181, 253, 0.2)',
    overflow: 'hidden',
    marginBottom: 16,
  },
  sectionTitle: { color: '#C4B5FD', fontSize: 13, fontWeight: '700', marginBottom: 14, letterSpacing: 0.4 },
  levelRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  levelChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(196, 181, 253, 0.2)',
  },
  levelChipActive: { backgroundColor: '#FEF08A', borderColor: '#FEF08A' },
  levelChipText: { color: '#C4B5FD', fontSize: 14, fontWeight: '600' },
  levelChipTextActive: { color: '#1E1B4B', fontWeight: 'bold' },

  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  menuText: { color: '#FDF4FF', fontSize: 15, fontWeight: '500' },
  editEmailBox: { flexDirection: 'row', gap: 10, marginTop: 12 },
  input: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#FDF4FF',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.35)',
  },
  saveBtn: {
    backgroundColor: '#FEF08A',
    paddingHorizontal: 18,
    borderRadius: 12,
    justifyContent: 'center',
  },
  saveBtnText: { color: '#1E1B4B', fontWeight: 'bold', fontSize: 14 },
  divider: { height: 1, backgroundColor: 'rgba(255, 255, 255, 0.08)', marginVertical: 14 },
  connectedPill: {
    backgroundColor: 'rgba(134, 239, 172, 0.16)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  connectedText: { color: '#86EFAC', fontSize: 12, fontWeight: 'bold' },

  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(244, 63, 94, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.4)',
    paddingVertical: 15,
    borderRadius: 16,
  },
  logoutText: { color: '#FDA4AF', fontSize: 16, fontWeight: 'bold' },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  modalCard: {
    backgroundColor: 'rgba(26, 11, 46, 0.95)',
    borderRadius: 28,
    padding: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(254, 240, 138, 0.35)',
    overflow: 'hidden',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modalTitle: { color: '#FEF08A', fontSize: 22, fontWeight: 'bold' },
  modalSubtitle: { color: '#C4B5FD', fontSize: 14, marginBottom: 18, lineHeight: 20 },
  planOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1.5,
    borderColor: 'rgba(196, 181, 253, 0.2)',
    marginBottom: 12,
  },
  planOptionActive: {
    borderColor: '#FEF08A',
    backgroundColor: 'rgba(254, 240, 138, 0.12)',
  },
  planName: { color: '#FDF4FF', fontSize: 16, fontWeight: 'bold' },
  planDesc: { color: '#94A3B8', fontSize: 12, marginTop: 3 },
  planPrice: { color: '#FEF08A', fontSize: 16, fontWeight: 'bold' },
  upgradeBtn: {
    backgroundColor: '#FEF08A',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 6,
  },
  upgradeBtnText: { color: '#1E1B4B', fontSize: 16, fontWeight: 'bold' },
});