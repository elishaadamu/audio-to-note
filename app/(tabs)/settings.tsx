import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Switch,
  Platform,
  Alert,
  Modal,
  Pressable,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import Colors from '@/constants/Colors';
import { authService } from '@/services/authService';
import { notesService } from '@/services/notesService';
import { useTranslation } from '@/hooks/useTranslation';
import { Language } from '@/constants/Translations';

const LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Chinese', 'Arabic'];
const MODELS = ['Whisper Base', 'Whisper Medium', 'Whisper Large'];
const SUMMARY_STYLES = ['Concise', 'Detailed', 'Bullet Points', 'Academic'];
const AI_MODELS = ['Gemini (Default)', 'OpenAI GPT-4o'];

function SectionHeader({ title }: { title: string }) {
  return (
    <Text className="text-accent text-[11px] font-bold tracking-[1.5px] mb-2 mt-2 px-0.5">
      {title.toUpperCase()}
    </Text>
  );
}

function SettingRow({
  icon,
  label,
  value,
  onPress,
  rightElement,
  destructive,
}: {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  destructive?: boolean;
}) {
  return (
    <TouchableOpacity
      className="flex-row items-center py-[14px] px-4 gap-3 border-b border-surfaceBorder"
      onPress={onPress}
      activeOpacity={onPress ? 0.75 : 1}
    >
      <View
        className={`w-[34px] h-[34px] rounded-[9px] items-center justify-center ${destructive ? 'bg-[#FF475718]' : 'bg-accentGlow'}`}
      >
        <MaterialIcons
          name={icon as any}
          size={18}
          color={destructive ? Colors.danger : Colors.accent}
        />
      </View>
      <Text className={`flex-1 text-[15px] font-medium ${destructive ? 'text-danger' : 'text-textPrimary'}`}>
        {label}
      </Text>
      <View className="flex-row items-center gap-1.5">
        {value && <Text className="text-textMuted text-[13px]">{value}</Text>}
        {rightElement}
        {onPress && !rightElement && (
          <MaterialIcons name="chevron-right" size={18} color={Colors.textMuted} />
        )}
      </View>
    </TouchableOpacity>
  );
}

function SettingsCard({ children }: { children: React.ReactNode }) {
  return <View className="bg-surfaceElevated rounded-2xl border border-surfaceBorder overflow-hidden mb-1.5">{children}</View>;
}

export default function SettingsScreen() {
  const { language: globalLang, setLanguage: setGlobalLang, t } = useTranslation();
  const [model, setModel] = useState('Whisper Large');
  const [aiModel, setAiModel] = useState('Gemini (Default)');
  const [summaryStyle, setSummaryStyle] = useState('Detailed');
  const [autoProcess, setAutoProcess] = useState(true);
  const [saveLocally, setSaveLocally] = useState(true);
  
  const [userName, setUserName] = useState('User');
  const [userEmail, setUserEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Profile Edit State
  const [editModal, setEditModal] = useState({ visible: false, type: '', value: '', title: '' });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await authService.getMe();
        setUserName(userData.name || 'User');
        setUserEmail(userData.email || '');
      } catch (err: any) {
        if (err.message.includes('401')) {
          router.replace('/(auth)/signup');
        } else {
          console.warn("Could not sync user profile:", err);
        }
      }
    };
    loadUser();
  }, []);

  const handleUpdateProfile = async (field: string, newValue: string) => {
    setIsLoading(true);
    try {
      const data = await authService.updateMe({ [field]: newValue });
      if (field === 'name') setUserName(data.name);
      if (field === 'email') setUserEmail(data.email);
      Alert.alert("Success", `${field.charAt(0).toUpperCase() + field.slice(1)} updated successfully.`);
    } catch (error: any) {
      Alert.alert("Update Failed", error.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
      setEditModal({ ...editModal, visible: false });
    }
  };

  const handleClearAllNotes = async () => {
    Alert.alert(
      t('clearAllNotes'),
      t('clearAllConfirm'),
      [
        { text: t('cancel'), style: "cancel" },
        { 
          text: t('delete'), 
          style: "destructive",
          onPress: async () => {
            setIsLoading(true);
            try {
              await notesService.clearAllNotes();
              Alert.alert("Cleared", "All notes have been deleted.");
            } catch (err: any) {
              Alert.alert("Error", err.message || "Network error.");
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleSignOut = async () => {
    if (Platform.OS === 'web') {
      localStorage.removeItem('AUTH_TOKEN');
      router.replace('/(auth)/login');
    } else {
      Alert.alert(
        t('secureSignOut'),
        t('signOutConfirm'),
        [
          { text: t('cancel'), style: 'cancel' },
          { 
            text: t('signOut'), 
            style: 'destructive',
            onPress: async () => {
              await SecureStore.deleteItemAsync('AUTH_TOKEN');
              router.replace('/(auth)/login');
            }
          }
        ]
      );
    }
  };

  // Dark Mode
  const { colorScheme, setColorScheme } = useColorScheme();
  const darkMode = colorScheme === 'dark';

  const toggleDarkMode = async (val: boolean) => {
    const newTheme = val ? 'dark' : 'light';
    setColorScheme(newTheme);
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem('THEME_MODE', newTheme);
      } else {
        await SecureStore.setItemAsync('THEME_MODE', newTheme);
      }
    } catch (e) {}
  };

  // Notifications (Mocked to preserve Expo Go SDK 53 stability)
  const [notifications, setNotifications] = useState(false);

  const toggleNotifications = async (val: boolean) => {
    if (val) {
      Alert.alert(
        'Notifications Mock', 
        'Pretend you just granted push notification permissions! (Expo Go restricts true background push routing on SDK 53).' 
        );
    }
    setNotifications(val);
  };

  const [pickerModal, setPickerModal] = useState<{
    visible: boolean;
    title: string;
    options: string[];
    value: string;
    setValue: (val: string) => void;
  }>({ visible: false, title: '', options: [], value: '', setValue: () => {} });

  const openPicker = (
    title: string,
    options: string[],
    current: string,
    setter: (v: string) => void
  ) => {
    setPickerModal({ 
      visible: true, 
      title, 
      options, 
      value: current, 
      setValue: async (val) => {
        setter(val);
        if (title === 'Language') {
            await setGlobalLang(val as Language);
        }
      } 
    });
  };

  const containerPaddingTop = Platform.OS === 'ios' ? 'pt-4' : 'pt-16';

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View className={`px-5 gap-1 ${containerPaddingTop}`}>
          {/* Header */}
          <Animated.View entering={FadeInDown.delay(50).springify()} className="mb-4">
            <Text className="text-[30px] font-extrabold text-textPrimary tracking-tight">{t('settings')}</Text>
            <Text className="text-[13px] text-textMuted mt-1">{t('customizeExperience')}</Text>
          </Animated.View>

          {/* Profile card */}
          <Animated.View entering={FadeInDown.delay(100).springify()} className="flex-row items-center bg-surfaceElevated rounded-2xl border border-surfaceBorder p-4 gap-3.5 mb-5">
            <View className="w-[52px] h-[52px] rounded-full bg-accentGlow border-2 border-accent items-center justify-center">
              <MaterialIcons name="person" size={28} color={Colors.accent} />
            </View>
            <View className="flex-1 gap-1">
              <Text className="text-textPrimary text-[15px] font-semibold">{userName}</Text>
              <Text className="text-textMuted text-[11px]">{userEmail}</Text>
            </View>
            <TouchableOpacity 
              className="bg-[#FF475718] border border-[#FF475730] px-4 py-2 rounded-full"
              onPress={handleSignOut}
            >
              <Text className="text-danger text-[13px] font-semibold">{t('signOut')}</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Account Settings */}
          <Animated.View entering={FadeInDown.delay(120).springify()}>
            <SectionHeader title={t('accountProfile')} />
            <SettingsCard>
              <SettingRow
                icon="person-outline"
                label={t('name')}
                value={userName}
                onPress={() => setEditModal({ visible: true, type: 'name', value: userName, title: t('editName') })}
              />
              <SettingRow
                icon="mail-outline"
                label={t('email')}
                value={userEmail}
                onPress={() => setEditModal({ visible: true, type: 'email', value: userEmail, title: t('editEmail') })}
              />
              <SettingRow
                icon="lock-outline"
                label={t('change4DigitPin')}
                onPress={() => setEditModal({ visible: true, type: 'password', value: '', title: t('setNewPin') })}
              />
            </SettingsCard>
          </Animated.View>

          {/* Recording */}
          <Animated.View entering={FadeInDown.delay(150).springify()}>
            <SectionHeader title={t('recording')} />
            <SettingsCard>
              <SettingRow
                icon="record-voice-over"
                label={t('speechModel')}
                value={model}
                onPress={() => openPicker(t('speechModel'), MODELS, model, setModel)}
              />
              <SettingRow
                icon="translate"
                label={t('language')}
                value={globalLang}
                onPress={() => openPicker(t('language'), LANGUAGES, globalLang, () => {})}
              />
              <SettingRow
                icon="auto-awesome"
                label={t('autoProcess')}
                rightElement={
                  <Switch
                    value={autoProcess}
                    onValueChange={setAutoProcess}
                    trackColor={{ true: Colors.accent, false: Colors.surfaceBorder }}
                    thumbColor={Colors.textPrimary}
                  />
                }
              />
            </SettingsCard>
          </Animated.View>

          {/* AI Providers / Summarization */}
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <SectionHeader title={t('aiProvider')} />
            <SettingsCard>
              <SettingRow
                icon="smart-toy"
                label={t('aiProvider')}
                value={aiModel}
                onPress={() => openPicker(t('aiProvider'), AI_MODELS, aiModel, setAiModel)}
              />
              <SettingRow
                icon="style"
                label={t('summaryStyle')}
                value={summaryStyle}
                onPress={() => openPicker(t('summaryStyle'), SUMMARY_STYLES, summaryStyle, setSummaryStyle)}
              />
              <SettingRow
                icon="format-list-bulleted"
                label={t('includeKeyTerms')}
                rightElement={
                  <Switch
                    value={true}
                    onValueChange={() => {}}
                    trackColor={{ true: Colors.accent, false: Colors.surfaceBorder }}
                    thumbColor={Colors.textPrimary}
                  />
                }
              />
            </SettingsCard>
          </Animated.View>

          {/* Storage */}
          <Animated.View entering={FadeInDown.delay(250).springify()}>
            <SectionHeader title={t('storagePrivacy')} />
            <SettingsCard>
              <SettingRow
                icon="save"
                label={t('saveAudioLocally')}
                rightElement={
                  <Switch
                    value={saveLocally}
                    onValueChange={setSaveLocally}
                    trackColor={{ true: Colors.accent, false: Colors.surfaceBorder }}
                    thumbColor={Colors.textPrimary}
                  />
                }
              />
              <SettingRow
                icon="cloud-upload"
                label={t('cloudBackup')}
                value="Off"
                onPress={() => {}}
              />
              <SettingRow
                icon="storage"
                label={t('storageUsed')}
                value="142 MB"
              />
            </SettingsCard>
          </Animated.View>

          {/* App */}
          <Animated.View entering={FadeInDown.delay(300).springify()}>
            <SectionHeader title={t('app')} />
            <SettingsCard>
              <SettingRow
                icon="dark-mode"
                label={t('darkMode')}
                rightElement={
                  <Switch
                    value={darkMode}
                    onValueChange={toggleDarkMode}
                    trackColor={{ true: Colors.accent, false: Colors.surfaceBorder }}
                    thumbColor={darkMode ? Colors.textPrimary : '#FFFFFF'}
                  />
                }
              />
              <SettingRow
                icon="notifications"
                label={t('notifications')}
                rightElement={
                  <Switch
                    value={notifications}
                    onValueChange={toggleNotifications}
                    trackColor={{ true: Colors.accent, false: Colors.surfaceBorder }}
                    thumbColor={darkMode ? Colors.textPrimary : '#FFFFFF'}
                  />
                }
              />
              <SettingRow
                icon="info-outline"
                label={t('about')}
                value="v1.0.0"
                onPress={() => {}}
              />
              <SettingRow
                icon="help-outline"
                label={t('helpSupport')}
                onPress={() => {}}
              />
            </SettingsCard>
          </Animated.View>

          {/* Danger zone */}
          <Animated.View entering={FadeInDown.delay(350).springify()}>
            <SectionHeader title={t('dangerZone')} />
            <SettingsCard>
              <SettingRow
                icon="delete-forever"
                label={t('clearAllNotes')}
                onPress={handleClearAllNotes}
                destructive
              />
            </SettingsCard>
          </Animated.View>

          {/* Version */}
          <Text className="text-center text-textPlaceholder text-[11px] mt-4">
            LectureNote AI • v1.0.0 Beta
          </Text>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={editModal.visible} transparent animationType="fade">
        <View className="flex-1 bg-black/60 justify-center px-6">
          <Animated.View entering={FadeInDown} className="bg-surfaceElevated rounded-3xl p-6 border border-surfaceBorder shadow-2xl">
            <Text className="text-textPrimary text-xl font-extrabold mb-2">{editModal.title}</Text>
            <Text className="text-textMuted text-[13px] mb-5">{t('updateSafely')}</Text>
            
            <TextInput
              className="bg-background border border-surfaceBorder rounded-xl px-4 py-3.5 text-textPrimary text-[15px] mb-6"
              value={editModal.value}
              onChangeText={(v) => setEditModal({ ...editModal, value: v })}
              placeholder={
                editModal.type === 'name' ? t('enterName') : 
                editModal.type === 'email' ? t('enterEmail') : 
                t('enterPin')
              }
              placeholderTextColor={Colors.textPlaceholder}
              autoFocus
              keyboardType={editModal.type === 'password' ? 'number-pad' : 'default'}
              maxLength={editModal.type === 'password' ? 4 : 50}
              secureTextEntry={editModal.type === 'password'}
            />

            <View className="flex-row gap-3">
              <TouchableOpacity 
                className="flex-1 py-3.5 items-center justify-center rounded-xl bg-surfaceElevated border border-surfaceBorder"
                onPress={() => setEditModal({ ...editModal, visible: false })}
              >
                <Text className="text-textSecondary font-semibold">{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                className="flex-1 py-3.5 items-center justify-center rounded-xl bg-accent"
                onPress={() => handleUpdateProfile(editModal.type, editModal.value)}
                disabled={isLoading}
              >
                {isLoading ? <ActivityIndicator color="#FFF" /> : <Text className="text-white font-bold">{t('saveChanges')}</Text>}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Premium Selection Modal */}
      <Modal visible={pickerModal.visible} transparent animationType="fade">
        <View className="flex-1 bg-black/60 justify-end">
          <Pressable className="absolute top-0 right-0 bottom-0 left-0" onPress={() => setPickerModal({ ...pickerModal, visible: false })} />
          <Animated.View entering={FadeInDown.duration(300).springify()} className="bg-surfaceElevated rounded-t-3xl pt-3 pb-8 px-6 max-h-[75%] border-t border-surfaceBorder overflow-hidden shadow-2xl">
            <View className="w-12 h-[5px] bg-surfaceBorder rounded-full self-center mb-6" />
            <Text className="text-textPrimary text-[22px] font-extrabold mb-5 px-1 tracking-tight">{pickerModal.title}</Text>
            <ScrollView showsVerticalScrollIndicator={false} className="mb-4">
              {pickerModal.options.map((opt) => {
                const isSelected = pickerModal.value === opt;
                return (
                  <TouchableOpacity
                    key={opt}
                    className={`flex-row items-center justify-between py-4 border-b border-surfaceBorder/40 ${isSelected ? 'bg-accentGlow/20 -mx-3 px-3 rounded-2xl border-b-0 mb-1' : ''}`}
                    activeOpacity={0.7}
                    onPress={() => {
                      pickerModal.setValue(opt);
                      setPickerModal({ ...pickerModal, visible: false });
                    }}
                  >
                    <Text className={`text-[17px] font-semibold ${isSelected ? 'text-accent' : 'text-textPrimary'}`}>
                      {opt}
                    </Text>
                    {isSelected && (
                      <View className="w-6 h-6 rounded-full bg-accent items-center justify-center shadow-sm">
                        <MaterialIcons name="check" size={14} color="#FFFFFF" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
