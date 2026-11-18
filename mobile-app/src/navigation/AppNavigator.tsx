import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage'; 

import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import ResultScreen from '../screens/ResultScreen';
import LevelSelectionScreen from '../screens/LevelSelectionScreen'; // YENİ SAYFAMIZ İÇERİ AKTARILDI

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Henüz oluşturmadığımız sayfalar için geçici (dummy) bileşenler
const DictionaryScreen = () => null;
const FlashcardsScreen = () => null;
const ProfileScreen = () => null;
// LevelSelectionScreen boş tanımı buradan silindi!

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: '#130B29', borderTopWidth: 1, borderTopColor: 'rgba(254, 240, 138, 0.1)', paddingBottom: 8, paddingTop: 8, height: 65 },
        tabBarActiveTintColor: '#FEF08A', 
        tabBarInactiveTintColor: '#64748B',
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Dictionary') iconName = focused ? 'book' : 'book-outline';
          else if (route.name === 'Flashcards') iconName = focused ? 'layers' : 'layers-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline'; 
          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Ana Sayfa' }} />
      <Tab.Screen name="Dictionary" component={DictionaryScreen} options={{ tabBarLabel: 'Sözlüğüm' }} />
      <Tab.Screen name="Flashcards" component={FlashcardsScreen} options={{ tabBarLabel: 'Kartlar' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Profil' }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const [initialRoute, setInitialRoute] = useState('Welcome');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const userToken = await AsyncStorage.getItem('userToken');
        if (userToken) {
          setInitialRoute('MainApp'); 
        }
      } catch (error) {
        console.error('Oturum kontrolü sırasında hata:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#130B29', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FEF08A" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="LevelSelection" component={LevelSelectionScreen} />
        <Stack.Screen name="MainApp" component={MainTabs} />
        <Stack.Screen name="Result" component={ResultScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}