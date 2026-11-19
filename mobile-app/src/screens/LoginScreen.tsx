import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, Image, Dimensions, ImageBackground, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, AntDesign } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useVideoPlayer, VideoView } from 'expo-video';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const API_URL = "http://192.168.1.107:8000"; 

const logoSource = require('../../assets/lexify-logo.png');
const bgSource = require('../../assets/login-bg.jpeg'); 
const rabbitVideo = require('../../assets/welcome-bg.mp4'); 

export default function LoginScreen({ navigation }: any) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false); 

  const player = useVideoPlayer(rabbitVideo, player => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  const handleAuth = async () => {
    if (email.trim() === '' || password.trim() === '') {
      Alert.alert("Eksik Bilgi", "Lütfen kullanıcı adı ve şifrenizi giriniz.");
      return;
    }

    setIsLoading(true); 

    try {
      const response = await fetch(`${API_URL}/api/token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: email, 
          password: password
        })
      });

      const data = await response.json();

      if (response.ok) {
        await AsyncStorage.setItem('userToken', data.access);
        await AsyncStorage.setItem('username', email); 
        navigation.replace('LevelSelection');
      } else {
        Alert.alert("Giriş Başarısız", "Kullanıcı adı veya şifre hatalı. Lütfen tekrar deneyin.");
      }
    } catch (error) {
      Alert.alert("Bağlantı Hatası", "Sunucuya ulaşılamadı. Django'nun açık olduğundan emin olun.");
    } finally {
      setIsLoading(false); 
    }
  };

  const handleGoogleLogin = () => {
    Alert.alert("Bilgi", "Google hesabı ile giriş yapılıyor... (Demo)");
    setTimeout(() => {
      navigation.replace('LevelSelection');
    }, 1000);
  };

  return (
    <ImageBackground source={bgSource} style={styles.backgroundImage}>
      <LinearGradient 
        colors={['rgba(26, 11, 46, 0.4)', 'rgba(26, 11, 46, 0.85)', 'rgba(26, 11, 46, 0.95)']} 
        style={styles.overlay}
      >
        <SafeAreaView style={styles.container}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              
              <View style={styles.headerContainer}>
                <View style={styles.videoCircle}>
                  <VideoView style={styles.video} player={player} nativeControls={false} contentFit="cover" />
                </View>
                <Image source={logoSource} style={styles.logo} resizeMode="contain" />
              </View>

              <BlurView intensity={40} tint="dark" style={styles.glassCard}>
                <Text style={styles.formTitle}>{isLogin ? 'Tekrar Hoş Geldiniz' : 'Hesap Oluştur'}</Text>
                
                <View style={styles.inputContainer}>
                  <Ionicons name="person-outline" size={20} color="#FEF08A" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Kullanıcı adınızı girin"
                    placeholderTextColor="#C4B5FD"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color="#FEF08A" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Şifreniz"
                    placeholderTextColor="#C4B5FD"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                </View>

                <TouchableOpacity 
                  style={[styles.primaryButton, isLoading && { opacity: 0.7 }]} 
                  onPress={handleAuth}
                  disabled={isLoading}
                >
                  <Text style={styles.primaryButtonText}>
                    {isLoading ? 'Giriş Yapılıyor...' : (isLogin ? 'Giriş Yap' : 'Kayıt Ol')}
                  </Text>
                </TouchableOpacity>

                <View style={styles.dividerContainer}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>veya</Text>
                  <View style={styles.dividerLine} />
                </View>

                <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin}>
                  <AntDesign name="google" size={22} color="#DB4437" />
                  <Text style={styles.googleButtonText}>Google ile Devam Et</Text>
                </TouchableOpacity>
              </BlurView>

              <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={styles.switchTextContainer}>
                <Text style={styles.switchText}>
                  {isLogin ? 'Hesabınız yok mu? ' : 'Zaten hesabınız var mı? '}
                  <Text style={styles.switchTextHighlight}>{isLogin ? 'Kayıt Olun' : 'Giriş Yapın'}</Text>
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: { flex: 1, width: '100%', height: '100%' },
  overlay: { flex: 1 },
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingTop: 40, paddingBottom: 20 },
  headerContainer: { alignItems: 'center', marginBottom: 20 },
  videoCircle: { width: 140, height: 140, borderRadius: 70, overflow: 'hidden', borderWidth: 2, borderColor: 'rgba(254, 240, 138, 0.4)', marginBottom: 10 },
  video: { width: '100%', height: '100%' },
  logo: { width: width * 0.9, height: undefined, aspectRatio: 2.5, marginTop: 5, marginBottom: 10, shadowColor: '#FFFFFF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 20, transform: [{ scale: 1.4 }] },
  glassCard: { backgroundColor: 'rgba(30, 15, 50, 0.4)', padding: 24, borderRadius: 30, borderWidth: 1, borderColor: 'rgba(254, 240, 138, 0.3)', overflow: 'hidden' },
  formTitle: { fontSize: 20, fontWeight: 'bold', color: '#FDF4FF', marginBottom: 20, textAlign: 'center', letterSpacing: 1 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.3)', borderRadius: 16, marginBottom: 16, paddingHorizontal: 16, borderWidth: 1, borderColor: 'rgba(167, 139, 250, 0.3)' },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, color: '#FFF', paddingVertical: 16, fontSize: 16 },
  primaryButton: { backgroundColor: '#FEF08A', padding: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  primaryButtonText: { color: '#1E1B4B', fontSize: 18, fontWeight: 'bold' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  dividerText: { color: '#A78BFA', paddingHorizontal: 10, fontSize: 14 },
  googleButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: 16, gap: 10 },
  googleButtonText: { color: '#333', fontSize: 16, fontWeight: '600' },
  switchTextContainer: { marginTop: 20, alignItems: 'center' },
  switchText: { color: '#C4B5FD', fontSize: 14 },
  switchTextHighlight: { color: '#FEF08A', fontWeight: 'bold' },
});