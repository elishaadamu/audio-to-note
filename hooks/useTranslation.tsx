import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { TRANSLATIONS, Language } from '@/constants/Translations';
import { authService } from '@/services/authService';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLang] = useState<Language>('English');

  useEffect(() => {
    const loadLang = async () => {
      try {
        let savedLang: string | null = null;
        if (Platform.OS === 'web') {
          savedLang = localStorage.getItem('PREFERRED_LANG');
        } else {
          savedLang = await SecureStore.getItemAsync('PREFERRED_LANG');
        }
        
        if (savedLang && (TRANSLATIONS as any)[savedLang]) {
          setLang(savedLang as Language);
        } else {
           // Try to get from backend if not in store
           try {
             const user = await authService.getMe();
             if (user.preferredLanguage && (TRANSLATIONS as any)[user.preferredLanguage]) {
                setLang(user.preferredLanguage as Language);
                if (Platform.OS === 'web') {
                  localStorage.setItem('PREFERRED_LANG', user.preferredLanguage);
                } else {
                  await SecureStore.setItemAsync('PREFERRED_LANG', user.preferredLanguage);
                }
             }
           } catch (e) {}
        }
      } catch (e) {
        console.error('Failed to load language', e);
      }
    };
    loadLang();
  }, []);

  const setLanguage = async (lang: Language) => {
    setLang(lang);
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem('PREFERRED_LANG', lang);
      } else {
        await SecureStore.setItemAsync('PREFERRED_LANG', lang);
      }
      // Also update backend only if logged in
      let token = null;
      if (Platform.OS === 'web') {
        token = localStorage.getItem('AUTH_TOKEN');
      } else {
        token = await SecureStore.getItemAsync('AUTH_TOKEN');
      }

      if (token) {
        await authService.updateMe({ preferredLanguage: lang });
      }
    } catch (e) {
      console.error('Failed to save language', e);
    }
  };

  const t = (key: string) => {
    const dict = TRANSLATIONS[language] || TRANSLATIONS.English;
    return dict[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}
