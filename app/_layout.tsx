import { useEffect } from 'react';
import Toast from 'react-native-toast-message';
import { View, Platform, useColorScheme as useGlobalColorScheme } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import * as SecureStore from 'expo-secure-store';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '../global.css';

import { LanguageProvider } from '@/hooks/useTranslation';

export default function RootLayout() {
  const { colorScheme, setColorScheme } = useColorScheme();
  const systemTheme = useGlobalColorScheme();

  // Load Theme Preference
  useEffect(() => {
    const loadTheme = async () => {
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
    };

    loadTheme();
  }, []);

  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <View className={`flex-1 ${colorScheme === 'dark' ? 'dark bg-background' : 'bg-background'}`}>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
            <Stack.Screen name="index" options={{ headerShown: false }} />
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
