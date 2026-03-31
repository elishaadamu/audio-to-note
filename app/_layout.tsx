import { useEffect } from 'react';
import Toast from 'react-native-toast-message';
import { View, Platform, useColorScheme as useGlobalColorScheme } from 'react-native';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import * as SecureStore from 'expo-secure-store';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '../global.css';

import { LanguageProvider } from '@/hooks/useTranslation';

export default function RootLayout() {
  const { colorScheme, setColorScheme } = useColorScheme();
  const systemTheme = useGlobalColorScheme();

  useEffect(() => {
    const initializeApp = async () => {
      // 1. Load Theme
      try {
        let savedTheme = null;
        if (Platform.OS === 'web') {
          savedTheme = localStorage.getItem('THEME_MODE');
        } else {
          savedTheme = await SecureStore.getItemAsync('THEME_MODE');
        }

        if (savedTheme === 'dark' || savedTheme === 'light') {
          setColorScheme(savedTheme);
        } else if (systemTheme) {
          setColorScheme(systemTheme);
        }
      } catch (e) {
        console.error('Failed to load theme preference', e);
      }

      // 2. Check Authentication
      try {
        let token = null;
        if (Platform.OS === 'web') {
          token = localStorage.getItem('AUTH_TOKEN');
        } else {
          token = await SecureStore.getItemAsync('AUTH_TOKEN');
        }

        if (!token) {
          // No token, redirect to auth welcome screen
          router.replace('/(auth)/welcome');
        } else {
          // Token exists, proceed to app
          router.replace('/(tabs)');
        }
      } catch (e) {
        console.error('Auth check error', e);
        router.replace('/(auth)/welcome');
      }
    };

    initializeApp();
  }, []);

  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <View className={`flex-1 ${colorScheme === 'dark' ? 'dark bg-background' : 'bg-background'}`}>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="note/[id]"
              options={{
                headerShown: false,
                animation: 'slide_from_right',
              }}
            />
          </Stack>
          <Toast />
        </View>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
