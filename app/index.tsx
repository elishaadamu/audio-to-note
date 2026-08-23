import { useEffect, useState } from 'react';
import { View, ActivityIndicator, Platform } from 'react-native';
import { Redirect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

export default function Index() {
  const [target, setTarget] = useState<string | null>(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        let token = null;
        if (Platform.OS === 'web') {
          token = localStorage.getItem('AUTH_TOKEN');
        } else {
          token = await SecureStore.getItemAsync('AUTH_TOKEN');
        }

        if (!token) {
          setTarget('/(auth)/welcome');
          return;
        }

        let lastLoginTime = null;
        if (Platform.OS === 'web') {
          lastLoginTime = localStorage.getItem('LAST_LOGIN_TIME');
        } else {
          lastLoginTime = await SecureStore.getItemAsync('LAST_LOGIN_TIME');
        }

        const twentyFourHours = 24 * 60 * 60 * 1000;
        const now = Date.now();

        if (lastLoginTime && (now - parseInt(lastLoginTime, 10)) < twentyFourHours) {
          setTarget('/(tabs)');
        } else {
          setTarget('/(auth)/login');
        }
      } catch (e) {
        console.error('Error during initial auth check', e);
        setTarget('/(auth)/welcome');
      }
    }

    checkAuth();
  }, []);

  if (!target) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0B0F19' }}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return <Redirect href={target as any} />;
}
