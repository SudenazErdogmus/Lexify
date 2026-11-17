import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';

// DİKKAT: Bilgisayarının IPv4 adresini buraya yaz (ipconfig komutunda gördüğün adres)
const API_URL = "http://192.168.1.107:8000"; 

export default function App() {
  const [url, setUrl] = useState('');
  const [level, setLevel] = useState('B1');
  const [isLoading, setIsLoading] = useState(false);

  const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  const handleAnalyze = async () => {
    if (!url) return;
    setIsLoading(true);

    try {
      // 1. ADIM: Token Al (Kendi kullanıcı adı ve şifreni yaz)
      const tokenResponse = await fetch(`${API_URL}/api/token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'ladypadme', // KENDİ KULLANICI ADIN
          password: 'Karakedi82@' // KENDİ ŞİFREN
        })
      });

      if (!tokenResponse.ok) {
        Alert.alert("Hata", "Giriş yapılamadı. Kullanıcı adı veya şifre yanlış.");
        setIsLoading(false);
        return;
      }
      
      const tokenData = await tokenResponse.json();
      const token = tokenData.access;

      // 2. ADIM: Analiz İsteği Gönder
      const response = await fetch(`${API_URL}/api/media-sources/process_url/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ url: url })
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Başarılı!", `Harika! ${data.kaydedilen_kelime_sayisi} kelime bulundu ve veritabanına kaydedildi.`);
        console.log("Gelen Veri:", data);
      } else {
        Alert.alert("Hata", `${data.hata || data.detail}`);
      }

    } catch (error) {
      console.error(error);
      Alert.alert("Bağlantı Hatası", "Sunucuya ulaşılamadı. Django çalışıyor mu?");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          <View style={styles.header}>
            <Text style={styles.title}>Lexify</Text>
            <Text style={styles.subtitle}>Yapay Zeka Destekli Dil Öğrenme Asistanı</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>İçerik Linki (YouTube, Medium, Blog)</Text>
            <TextInput
              style={styles.input}
              placeholder="https://www.youtube.com/watch?v=..."
              placeholderTextColor="#64748b"
              value={url}
              onChangeText={setUrl}
              autoCapitalize="none"
              keyboardType="url"
            />

            <Text style={[styles.label, { marginTop: 20 }]}>Seviyeniz</Text>
            <View style={styles.levelContainer}>
              {levels.map((lvl) => (
                <TouchableOpacity
                  key={lvl}
                  style={[styles.levelButton, level === lvl && styles.levelButtonActive]}
                  onPress={() => setLevel(lvl)}
                >
                  <Text style={[styles.levelText, level === lvl && styles.levelTextActive]}>
                    {lvl}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity 
              style={[styles.button, isLoading && styles.buttonDisabled]} 
              onPress={handleAnalyze}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>
                {isLoading ? 'Analiz Ediliyor...' : 'Metni Analiz Et'}
              </Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  header: { alignItems: 'center', marginBottom: 40, marginTop: 20 },
  title: { fontSize: 48, fontWeight: 'bold', color: '#818cf8', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#94a3b8', textAlign: 'center' },
  card: { backgroundColor: '#1e293b', padding: 24, borderRadius: 24, borderWidth: 1, borderColor: '#334155' },
  label: { color: '#e2e8f0', fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { backgroundColor: '#0f172a', color: '#fff', padding: 16, borderRadius: 12, fontSize: 16, borderWidth: 1, borderColor: '#334155' },
  levelContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  levelButton: { backgroundColor: '#0f172a', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: '#334155' },
  levelButtonActive: { backgroundColor: '#6366f1', borderColor: '#818cf8' },
  levelText: { color: '#94a3b8', fontWeight: 'bold' },
  levelTextActive: { color: '#fff' },
  button: { backgroundColor: '#6366f1', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 30 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});