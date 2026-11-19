import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator } from 'react-native';

import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import LevelSelectionScreen from '../screens/LevelSelectionScreen';
import HomeScreen from '../screens/HomeScreen';
import ResultScreen from '../screens/ResultScreen';
import DictionaryScreen from '../screens/DictionaryScreen';
import FlashcardsScreen from '../screens/FlashcardsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import TextsScreen from '../screens/TextsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs({ navigation }: any) {
  const handleLogout = async () => {
    await AsyncStorage.clear();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Welcome' }],
    });
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#130B29',
          borderTopWidth: 1,
          borderTopColor: 'rgba(254, 240, 138, 0.12)',
          paddingBottom: 8,
          paddingTop: 6,
          height: 64,
        },
        tabBarActiveTintColor: '#FEF08A',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Dictionary') iconName = focused ? 'book' : 'book-outline';
          else if (route.name === 'Flashcards') iconName = focused ? 'layers' : 'layers-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          else if (route.name === 'Texts') iconName = focused ? 'document-text' : 'document-text-outline';
          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" options={{ tabBarLabel: 'Ana Sayfa' }}>
        {(props) => <HomeScreen {...props} onLogout={handleLogout} />}
      </Tab.Screen>
      <Tab.Screen name="Dictionary" component={DictionaryScreen} options={{ tabBarLabel: 'Sözlüğüm' }} />
      <Tab.Screen name="Texts" component={TextsScreen} options={{ tabBarLabel: 'Metinlerim' }} />
      <Tab.Screen name="Flashcards" component={FlashcardsScreen} options={{ tabBarLabel: 'Kartlar' }} />
      <Tab.Screen name="Profile" options={{ tabBarLabel: 'Profil' }}>
        {(props) => <ProfileScreen {...props} onLogout={handleLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const [isLoading, setIsLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState('Welcome');

  useEffect(() => {
    const checkAuthAndLevel = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const level = await AsyncStorage.getItem('userLevel');

        if (token && level) {
          setInitialRoute('MainApp');
        } else if (token) {
          setInitialRoute('LevelSelection');
        } else {
          setInitialRoute('Welcome');
        }
      } catch (e) {
        console.error('Oturum veya seviye okunamadı', e);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuthAndLevel();
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