import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Image, Dimensions } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const videoSource = require('../../assets/welcome-bg.mp4');
const logoSource = require('../../assets/lexify-logo.png');

export default function WelcomeScreen({ navigation }: any) {
  const player = useVideoPlayer(videoSource, (player) => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  return (
    <View style={styles.container}>
      {/* ARKA PLAN VİDEOSU */}
      <VideoView
        style={StyleSheet.absoluteFill}
        player={player}
        nativeControls={false}
        contentFit="cover"
      />

      {/* RENK PERDESİ */}
      <LinearGradient
        colors={['rgba(26, 11, 46, 0.1)', 'rgba(26, 11, 46, 0.6)', 'rgba(26, 11, 46, 0.95)']}
        style={styles.overlay}
      >
        <SafeAreaView style={styles.safeArea}>
          
          {/* Üst Kısım: Dil Seçimi */}
          <View style={styles.topBar}>
            <View style={styles.langContainer}>
              <TouchableOpacity><Text style={styles.langTextActive}>TR</Text></TouchableOpacity>
              <Text style={styles.langSeparator}>|</Text>
              <TouchableOpacity><Text style={styles.langText}>EN</Text></TouchableOpacity>
            </View>
          </View>

          {/* LOGO: İstenilen yeşil alana (üst orta kısma) taşındı */}
          <Image 
            source={logoSource} 
            style={styles.logo} 
            resizeMode="contain" 
          />

          {/* Alt Kısım: Buton */}
          <View style={styles.bottomContainer}>
            <TouchableOpacity 
              style={styles.startButton} 
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.8}
            >
              <Text style={styles.startButtonText}>HEMEN BAŞLA</Text>
            </TouchableOpacity>
          </View>

        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  overlay: { flex: 1 },
  safeArea: { flex: 1, paddingBottom: 40 },

  topBar: { 
    alignItems: 'flex-end', 
    paddingTop: 20, 
    paddingHorizontal: 20,
    zIndex: 2, // Dil seçici logonun üstünde kalsın
  },
  langContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255,255,255,0.15)', 
    paddingVertical: 8, 
    paddingHorizontal: 15, 
    borderRadius: 20 
  },
  langTextActive: { fontFamily: 'PressStart2P_400Regular', fontSize: 12, color: '#FFF' },
  langSeparator: { color: '#FFF', marginHorizontal: 8, opacity: 0.5 },
  langText: { fontFamily: 'PressStart2P_400Regular', fontSize: 12, color: '#A78BFA' },

  // LOGO AYARLARI: Yeşil alana yerleşmesi için absolute kullanıldı
  logo: {
    position: 'absolute',
    top: '12%', // Ekranın üstünden %22 aşağıda (senin çizdiğin yere denk geliyor)
    alignSelf: 'center',
    width: width * 0.95, // Boyut biraz daha büyütüldü
    height: 200,
    zIndex: 1,
    // Koyu arka planda kaybolmaması için hafif gölge
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },

  // Buton alanı en altta kalması için flex kullanıldı
  bottomContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  startButton: { 
    backgroundColor: '#FEF08A', // Çok daha soluk, pastel bir sarı
    width: '100%', 
    paddingVertical: 20, 
    borderRadius: 20, 
    alignItems: 'center',
    shadowColor: '#FEF08A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  startButtonText: { 
    color: '#1A0B2E', 
    fontSize: 16, 
    fontWeight: '900', 
    letterSpacing: 2 
  },
});