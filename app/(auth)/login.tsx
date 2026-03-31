import Colors from "@/constants/Colors";
import { MaterialIcons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import Toast from "react-native-toast-message";
import { authService } from "@/services/authService";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userName, setUserName] = useState("User");

  React.useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    let savedEmail = null;
    let savedName = null;

    if (Platform.OS === "web") {
      savedEmail = localStorage.getItem("LAST_USER_EMAIL");
      savedName = localStorage.getItem("USER_NAME");
    } else {
      savedEmail = await SecureStore.getItemAsync("LAST_USER_EMAIL");
      savedName = await SecureStore.getItemAsync("USER_NAME");
    }

    if (savedEmail) setEmail(savedEmail);
    if (savedName) setUserName(savedName);
  };

  const handleLogin = async (finalPin?: string) => {
    const pinToUse = finalPin || password;
    if (!email) {
      Toast.show({
        type: "error",
        text1: "No account found",
        text2: "Please sign up first to use a PIN.",
      });
      return;
    }
    if (pinToUse.length !== 4) return;

    setIsLoading(true);
    try {
      const data = await authService.login(email, pinToUse);

      if (Platform.OS === "web") {
        localStorage.setItem("AUTH_TOKEN", data.token);
        localStorage.setItem("USER_ID", data.user.id);
        localStorage.setItem("USER_NAME", data.user.name || "User");
        localStorage.setItem("LAST_USER_EMAIL", data.user.email);
      } else {
        await SecureStore.setItemAsync("AUTH_TOKEN", data.token);
        await SecureStore.setItemAsync("USER_ID", data.user.id);
        await SecureStore.setItemAsync("USER_NAME", data.user.name || "User");
        await SecureStore.setItemAsync("LAST_USER_EMAIL", data.user.email);
      }

      router.replace("/(tabs)");
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Login Failed",
        text2: error.message,
      });
      setPassword(""); // Reset PIN on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchAccount = async () => {
    if (Platform.OS === "web") {
      localStorage.removeItem("LAST_USER_EMAIL");
      localStorage.removeItem("USER_NAME");
    } else {
      await SecureStore.deleteItemAsync("LAST_USER_EMAIL");
      await SecureStore.deleteItemAsync("USER_NAME");
    }
    setEmail("");
    setUserName("User");
    setPassword("");
    router.push("/(auth)/signup");
  };

  const inputRef = React.useRef<TextInput>(null);

  // Blinking Cursor Logic
  const [isCursorVisible, setIsCursorVisible] = useState(true);
  React.useEffect(() => {
    const interval = setInterval(() => {
      setIsCursorVisible((v) => !v);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const onPinChange = (val: string) => {
    const clean = val.replace(/\D/g, "").slice(0, 4);
    setPassword(clean);
    if (clean.length === 4) {
      handleLogin(clean);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            paddingHorizontal: 32,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View entering={FadeInDown.duration(600).springify()}>
            <View className="items-center mb-12">
              <View className="w-24 h-24 rounded-full bg-accentLight items-center justify-center border-4 border-surfaceBorder mb-6 overflow-hidden">
                <MaterialIcons name="person" size={50} color={Colors.textPrimary} />
              </View>
              <Text className="text-3xl font-extrabold text-textPrimary tracking-tight">
                Welcome back, {userName}
              </Text>
              <Text className="text-textSecondary mt-2 text-center">
                Enter your 4-digit PIN to access your notes
              </Text>
            </View>

            <View className="items-center">
              <Pressable 
                onPress={() => inputRef.current?.focus()}
                className="relative items-center"
              >
                <TextInput
                  ref={inputRef}
                  className="absolute opacity-0 w-full h-full z-10"
                  value={password}
                  onChangeText={onPinChange}
                  keyboardType="number-pad"
                  maxLength={4}
                  autoFocus={true}
                />
                
                <View className="flex-row gap-3">
                  {[...Array(4)].map((_, i) => (
                    <View 
                      key={i} 
                      className={`w-14 h-16 rounded-2xl border-2 items-center justify-center bg-surfaceElevated shadow-sm ${
                        password.length === i ? 'border-accent' : 'border-surfaceBorder'
                      }`}
                    >
                      {password.length > i ? (
                        <View className="w-3 h-3 rounded-full bg-textPrimary" />
                      ) : password.length === i ? (
                        <View 
                          style={{ opacity: isCursorVisible ? 1 : 0 }} 
                          className="w-[2px] h-6 bg-accent" 
                        />
                      ) : (
                        <View className="w-2 h-2 rounded-full bg-surfaceBorder" />
                      )}
                    </View>
                  ))}
                </View>
              </Pressable>

              <View className="flex-row justify-center w-full mt-4">
                <Link href="/(auth)/forgot-password" asChild>
                  <TouchableOpacity>
                    <Text className="text-textSecondary text-[14px] font-medium border-b border-surfaceBorder">
                      Forgot PIN?
                    </Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </View>

            <View className="mt-16 items-center">
              {isLoading && <ActivityIndicator color={Colors.accent} size="large" />}
              
              <View className="flex-row justify-center mt-8">
                <Text className="text-textMuted">Not you? </Text>
                <TouchableOpacity onPress={handleSwitchAccount}>
                  <Text className="text-accentLight font-bold">Create New Account</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
