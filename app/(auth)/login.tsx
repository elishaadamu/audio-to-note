import Colors from "@/constants/Colors";
import { MaterialIcons } from "@expo/vector-icons";
import { Link, router, useLocalSearchParams } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Pressable
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import Toast from "react-native-toast-message";
import { authService } from "@/services/authService";
import { useTranslation } from "@/hooks/useTranslation";
import { Language } from "@/constants/Translations";

export default function LoginScreen() {
  const params = useLocalSearchParams();
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPinOnly, setIsPinOnly] = useState(false);
  const { setLanguage } = useTranslation();

  React.useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    let savedEmail = null;
    if (Platform.OS === "web") {
      savedEmail = localStorage.getItem("LAST_USER_EMAIL");
    } else {
      savedEmail = await SecureStore.getItemAsync("LAST_USER_EMAIL");
    }
    
    if (savedEmail) {
      setEmail(savedEmail);
      setIsPinOnly(true); // Default to PIN-only if we have a saved email
    }
  };

  const handleLogin = async (finalPin?: string) => {
    const pinToUse = finalPin || pin;
    if (!email || pinToUse.length !== 4) {
      if (!email) {
        Toast.show({
          type: "error",
          text1: "Missing Email",
          text2: "Please enter your email address.",
        });
      }
      return;
    }

    setIsLoading(true);
    try {
      const data = await authService.login(email, pinToUse);

      if (data.user.preferredLanguage) {
        await setLanguage(data.user.preferredLanguage as Language);
      }

      const loginTime = Date.now().toString();

      if (Platform.OS === "web") {
        localStorage.setItem("AUTH_TOKEN", data.token);
        localStorage.setItem("USER_ID", data.user.id);
        localStorage.setItem("USER_NAME", data.user.name || "User");
        localStorage.setItem("LAST_USER_EMAIL", data.user.email);
        localStorage.setItem("LAST_LOGIN_TIME", loginTime);
      } else {
        await SecureStore.setItemAsync("AUTH_TOKEN", data.token);
        await SecureStore.setItemAsync("USER_ID", data.user.id);
        await SecureStore.setItemAsync("USER_NAME", data.user.name || "User");
        await SecureStore.setItemAsync("LAST_USER_EMAIL", data.user.email);
        await SecureStore.setItemAsync("LAST_LOGIN_TIME", loginTime);
      }

      router.replace("/(tabs)");
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Login Failed",
        text2: error.message,
      });
      setPin(""); // Clear PIN on error
    } finally {
      setIsLoading(false);
    }
  };

  const onPinChange = (val: string) => {
    const clean = val.replace(/\D/g, "").slice(0, 4);
    setPin(clean);
    if (clean.length === 4) {
      handleLogin(clean);
    }
  };

  // Blinking Cursor Logic
  const [isCursorVisible, setIsCursorVisible] = useState(true);
  React.useEffect(() => {
    const interval = setInterval(() => {
      setIsCursorVisible((v) => !v);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const inputRef = React.useRef<TextInput>(null);

  const handleSwitchAccount = async () => {
    setIsPinOnly(false);
    setPin("");
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 32,
            paddingBottom: 40,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View className="flex-1 justify-center" entering={FadeInDown.duration(600).springify()}>
            <View className="items-center mb-10">
              <View className="w-24 h-24 rounded-full bg-accentLight items-center justify-center border-4 border-surfaceBorder mb-6 overflow-hidden">
                <MaterialIcons name={isPinOnly ? "lock" : "fingerprint"} size={56} color={Colors.textPrimary} />
              </View>
              <Text className="text-3xl font-extrabold text-textPrimary tracking-tight">
                {isPinOnly ? "Welcome Back" : "Sign In"}
              </Text>
              <Text className="text-textSecondary mt-2 text-center px-4">
                {isPinOnly 
                  ? "Enter your security PIN to access your notes" 
                  : "Enter your account details to continue"}
              </Text>
            </View>

            <View className="gap-6">
              {!isPinOnly ? (
                <Animated.View entering={FadeInUp.duration(400)} className="bg-surfaceElevated border border-surfaceBorder rounded-2xl flex-row items-center px-4 py-1">
                  <MaterialIcons name="mail-outline" size={20} color={Colors.textMuted} />
                  <TextInput
                    className="flex-1 py-4 px-3 text-textPrimary text-[15px]"
                    placeholder="Email Address"
                    placeholderTextColor={Colors.textMuted}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </Animated.View>
              ) : null}

              {/* PIN Entry */}
              <View className="items-center">
                <Pressable 
                  onPress={() => inputRef.current?.focus()}
                  className="relative items-center"
                >
                  <TextInput
                    ref={inputRef}
                    className="absolute opacity-0 w-full h-full z-10"
                    value={pin}
                    onChangeText={onPinChange}
                    keyboardType="number-pad"
                    maxLength={4}
                    autoFocus={true}
                  />
                  
                  <View className="flex-row gap-4">
                    {[...Array(4)].map((_, i) => (
                      <View 
                        key={i} 
                        className={`w-14 h-16 rounded-2xl border-2 items-center justify-center bg-surfaceElevated shadow-sm ${
                          pin.length === i ? 'border-accent' : 'border-surfaceBorder'
                        }`}
                      >
                        {pin.length > i ? (
                          <View key="dot" className="w-3.5 h-3.5 rounded-full bg-textPrimary" />
                        ) : pin.length === i ? (
                          <View 
                            key="cursor"
                            style={{ opacity: isCursorVisible ? 1 : 0 }} 
                            className="w-[2px] h-6 bg-accent" 
                          />
                        ) : (
                          <View key="placeholder" className="w-2.5 h-2.5 rounded-full bg-surfaceBorder/40" />
                        )}
                      </View>
                    ))}
                  </View>
                </Pressable>

                <View className="flex-row justify-center w-full mt-6">
                  <Link href="/(auth)/forgot-password" asChild>
                    <TouchableOpacity>
                      <Text className="text-textSecondary text-[13px] font-medium border-b border-surfaceBorder/20">
                        Forgot security PIN?
                      </Text>
                    </TouchableOpacity>
                  </Link>
                </View>
              </View>
            </View>

            <View className="mt-14 items-center gap-6">
              {isLoading && <ActivityIndicator color={Colors.accent} size="large" />}
              
              <View className="items-center gap-4">
                {isPinOnly ? (
                  <TouchableOpacity onPress={handleSwitchAccount}>
                    <Text className="text-accentLight font-bold text-[14px]">Switch Account</Text>
                  </TouchableOpacity>
                ) : (
                  <View className="flex-row justify-center items-center">
                    <Text className="text-textMuted text-[14px]">Need an account? </Text>
                    <Link href="/(auth)/signup" asChild>
                      <TouchableOpacity>
                        <Text className="text-accentLight font-bold text-[14px]">Create New One</Text>
                      </TouchableOpacity>
                    </Link>
                  </View>
                )}
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
