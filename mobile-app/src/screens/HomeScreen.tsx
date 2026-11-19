import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView, ScrollView, Image, Dimensions, ImageBackground, Platform, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker'; 
import AsyncStorage from '@react-native-async-storage/async-storage'; // Hafıza kontrolü için eklendi

const { width } = Dimensions.get('window');
const bgSource = require('../../assets/login-bg.jpeg'); 

export default function HomeScreen({ route, navigation, onLogout }: any) {
  const [activeTab, setActiveTab] = useState<'link' | 'text' | 'image'>('link');
  const [inputValue, setInputValue] = useState('');
  const [image, setImage] = useState<string | null>(null);

  const username = route?.params?.username || 'ladypadme';

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  
const handleAnalyze = () => {
    if (activeTab === 'image' && !image) {
      Alert.alert('Eksik içerik', 'Lütfen analiz için bir fotoğraf seç.');
      return;
    }
  
    if (activeTab !== 'image' && !inputValue.trim()) {
      Alert.alert('Eksik içerik', 'Lütfen analiz edilecek içeriği gir.');
      return;
    }
  
    navigation.navigate('Result', {
      contentType: activeTab,
      content: activeTab === 'image' ? image : inputValue.trim(),
    });
  };
  

  // ÇIKIŞ YAPMA FONKSİYONU
  const handleLogout = () => {
    Alert.alert(
      "Çıkış Yap",
      "Hesabınızdan çıkmak istediğinize emin misiniz?",
      [
        { text: "İptal", style: "cancel" },
        { 
          text: "Çıkış", 
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.removeItem('userToken'); // Cihaz hafızasındaki kaydı siler
            navigation.replace('Welcome'); // En başa döndürür
          }
        }
      ]
    );
  };

  return (
    <ImageBackground source={bgSource} style={styles.backgroundImage}>
      <LinearGradient 
        colors={['rgba(26, 11, 46, 0.6)', 'rgba(26, 11, 46, 0.9)', 'rgba(26, 11, 46, 1)']} 
        style={styles.overlay}
      >
        <SafeAreaView style={styles.container}>
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            
            {/* HEADER */}
            <View style={styles.header}>
              <View style={styles.headerTextContainer}>
                <Text style={styles.greeting}>Merhaba, {username}</Text>
                <Text style={styles.subGreeting}>İçeriklerini kişisel sözlüğüne dönüştür.</Text>
              </View>
              <View style={styles.headerIcons}>
                <TouchableOpacity style={styles.iconButton}>
                  <Ionicons name="notifications-outline" size={26} color="#C4B5FD" />
                </TouchableOpacity>
                {/* Çıkış Yap Butonu */}
                <TouchableOpacity style={styles.iconButton} onPress={onLogout}>
                  <Ionicons name="log-out-outline" size={26} color="#F43F5E" />
                </TouchableOpacity>
              </View>
            </View>

            {/* İSTATİSTİK KARTLARI */}
            <View style={styles.statsContainer}>
              <BlurView intensity={40} tint="dark" style={styles.statBox}>
                <View style={styles.statIconWrapper}>
                  <Ionicons name="flame" size={22} color="#FEF08A" />
                </View>
                <View style={styles.statTextWrapper}>
                  <Text style={styles.statValue}>3 Gün</Text>
                  <Text style={styles.statLabel}>Çalışma Serisi</Text>
                </View>
              </BlurView>

              <BlurView intensity={40} tint="dark" style={styles.statBox}>
                <View style={styles.statIconWrapper}>
                  <Ionicons name="library" size={22} color="#FEF08A" />
                </View>
                <View style={styles.statTextWrapper}>
                  <Text style={styles.statValue}>142</Text>
                  <Text style={styles.statLabel}>Öğrenilen Kelime</Text>
                </View>
              </BlurView>
            </View>

            {/* ANA KART */}
            <BlurView intensity={40} tint="dark" style={styles.glassCard}>
              
              {/* SEKMELER */}
              <View style={styles.tabContainer}>
                <TouchableOpacity style={[styles.tabButton, activeTab === 'link' && styles.activeTab]} onPress={() => setActiveTab('link')}>
                  <Ionicons name="link" size={20} color={activeTab === 'link' ? '#FEF08A' : '#C4B5FD'} />
                  <Text style={[styles.tabText, activeTab === 'link' && styles.activeTabText]}>Link</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={[styles.tabButton, activeTab === 'text' && styles.activeTab]} onPress={() => setActiveTab('text')}>
                  <Ionicons name="document-text" size={20} color={activeTab === 'text' ? '#FEF08A' : '#C4B5FD'} />
                  <Text style={[styles.tabText, activeTab === 'text' && styles.activeTabText]}>Metin</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.tabButton, activeTab === 'image' && styles.activeTab]} onPress={() => setActiveTab('image')}>
                  <Ionicons name="camera" size={20} color={activeTab === 'image' ? '#FEF08A' : '#C4B5FD'} />
                  <Text style={[styles.tabText, activeTab === 'image' && styles.activeTabText]}>Fotoğraf</Text>
                </TouchableOpacity>
              </View>

              {/* İÇERİK ALANI */}
              <View style={styles.inputArea}>
                {activeTab === 'link' && (
                  <TextInput
                    style={styles.input}
                    placeholder="YouTube veya Blog linki yapıştırın..."
                    placeholderTextColor="#94A3B8"
                    value={inputValue}
                    onChangeText={setInputValue}
                  />
                )}
                
                {activeTab === 'text' && (
                  <TextInput
                    style={[styles.input, { height: 120, textAlignVertical: 'top' }]}
                    placeholder="Analiz edilecek metni buraya yapıştırın..."
                    placeholderTextColor="#94A3B8"
                    multiline
                    value={inputValue}
                    onChangeText={setInputValue}
                  />
                )}

                {activeTab === 'image' && (
                  <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                    {image ? (
                      <Image source={{ uri: image }} style={styles.previewImage} />
                    ) : (
                      <>
                        <Ionicons name="cloud-upload-outline" size={40} color="#FEF08A" />
                        <Text style={styles.imageText}>Kitap veya ekran fotoğrafı seç</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>

              {/* ANALİZ BUTONU */}
              <TouchableOpacity style={styles.primaryButton} onPress={handleAnalyze}>
                <Ionicons name="sparkles" size={20} color="#1E1B4B" style={{ marginRight: 8 }} />
                <Text style={styles.primaryButtonText}>AI ile Analiz Et</Text>
              </TouchableOpacity>
            </BlurView>

          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: { flex: 1, width: '100%', height: '100%' },
  overlay: { flex: 1 },
  container: { flex: 1 },
  scroll: { 
    flexGrow: 1, 
    justifyContent: 'center', 
    paddingHorizontal: 20, 
    paddingTop: Platform.OS === 'android' ? 50 : 20,
    paddingBottom: 20 
  },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 25 },
  headerTextContainer: { flex: 1, paddingRight: 10 },
  greeting: { fontSize: 26, fontWeight: 'bold', color: '#FDF4FF', letterSpacing: 0.5 },
  subGreeting: { fontSize: 14, color: '#C4B5FD', marginTop: 6, lineHeight: 20 },
  headerIcons: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconButton: { padding: 4, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12 },

  statsContainer: { flexDirection: 'row', gap: 15, marginBottom: 25 },
  statBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(30, 15, 50, 0.4)', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(254, 240, 138, 0.15)', overflow: 'hidden' },
  statIconWrapper: { backgroundColor: 'rgba(254, 240, 138, 0.1)', padding: 10, borderRadius: 12, marginRight: 12 },
  statTextWrapper: { flex: 1 },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#FDF4FF' },
  statLabel: { fontSize: 12, color: '#94A3B8', marginTop: 2 },

  glassCard: { backgroundColor: 'rgba(30, 15, 50, 0.4)', borderRadius: 30, padding: 24, borderWidth: 1, borderColor: 'rgba(254, 240, 138, 0.3)', overflow: 'hidden' },
  
  tabContainer: { flexDirection: 'row', backgroundColor: 'rgba(0, 0, 0, 0.3)', borderRadius: 16, padding: 6, marginBottom: 24 },
  tabButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, gap: 6 },
  activeTab: { backgroundColor: 'rgba(254, 240, 138, 0.15)' },
  tabText: { color: '#C4B5FD', fontWeight: '600', fontSize: 15 },
  activeTabText: { color: '#FEF08A', fontWeight: 'bold' },
  
  inputArea: { marginBottom: 24 },
  input: { backgroundColor: 'rgba(0, 0, 0, 0.3)', borderRadius: 16, padding: 16, color: '#FFF', fontSize: 15, borderWidth: 1, borderColor: 'rgba(167, 139, 250, 0.3)' },
  
  imagePicker: { height: 160, backgroundColor: 'rgba(0, 0, 0, 0.3)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(254, 240, 138, 0.4)', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  imageText: { color: '#C4B5FD', marginTop: 12, fontSize: 14, fontWeight: '500' },
  
  primaryButton: { flexDirection: 'row', backgroundColor: '#FEF08A', padding: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: '#1E1B4B', fontSize: 18, fontWeight: 'bold' },
});