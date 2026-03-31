import Colors from "@/constants/Colors";
import { MaterialIcons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
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
    Modal,
    Pressable,
    ScrollView as RNScrollView
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import Toast from "react-native-toast-message";
import { authService } from "@/services/authService";
import { LANGUAGES, Language } from "@/constants/Translations";
import { useTranslation } from "@/hooks/useTranslation";

export default function SignupScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [language, setLanguage] = useState<Language>("English");
  const [isLoading, setIsLoading] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const { setLanguage: setGlobalLanguage } = useTranslation();

  // Visibility state for password
  const [showPassword, setShowPassword] = useState(false);

  const handleSignup = async () => {
    // ... rest of handleSignup ...
    if (!name || !email || !password) {
      Toast.show({
        type: "error",
        text1: "Missing fields",
        text2: "Please fill in all fields.",
      });
      return;
    }
    if (password.length < 6) {
      Toast.show({
        type: "error",
        text1: "Weak Password",
        text2: "Password must be at least 6 characters.",
      });
      return;
    }

    setIsLoading(true);
    try {
      await setGlobalLanguage(language);
      const data = await authService.signup(name, email, password, language);

      Toast.show({
        type: "success",
        text1: "Verification Sent",
        text2: "Please check your email for the OTP.",
      });

      router.push({
        pathname: "/(auth)/verify-otp",
        params: { email, isSignup: "true" }
      } as any);
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Signup Failed",
        text2: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
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
            <View className="items-center mb-10 mt-8">
              <View className="w-16 h-16 rounded-3xl bg-accentLight items-center justify-center shadow-lg shadow-accent/40 mb-4">
                <MaterialIcons
                  name="person-add"
                  size={32}
                  color={Colors.textPrimary}
                />
              </View>
              <Text className="text-3xl font-extrabold text-textPrimary tracking-tight">
                Create Account
              </Text>
              <Text className="text-textSecondary mt-2">
                Join the future of lecture notes
              </Text>
            </View>

            <View className="gap-4">
              <View className="bg-surfaceElevated border border-surfaceBorder rounded-2xl flex-row items-center px-4 py-1">
                <MaterialIcons
                  name="badge"
                  size={20}
                  color={Colors.textMuted}
                />
                <TextInput
                  className="flex-1 py-4 px-3 text-textPrimary text-[15px]"
                  placeholder="Full Name"
                  placeholderTextColor={Colors.textMuted}
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View className="bg-surfaceElevated border border-surfaceBorder rounded-2xl flex-row items-center px-4 py-1">
                <MaterialIcons
                  name="email"
                  size={20}
                  color={Colors.textMuted}
                />
                <TextInput
                  className="flex-1 py-4 px-3 text-textPrimary text-[15px]"
                  placeholder="Email Address"
                  placeholderTextColor={Colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              
              <TouchableOpacity 
                className="bg-surfaceElevated border border-surfaceBorder rounded-2xl flex-row items-center px-4 py-4"
                onPress={() => setShowLanguageModal(true)}
              >
                <MaterialIcons name="language" size={20} color={Colors.textMuted} />
                <Text className="flex-1 px-3 text-textPrimary text-[15px]">{language}</Text>
                <MaterialIcons name="arrow-drop-down" size={24} color={Colors.textMuted} />
              </TouchableOpacity>

              <View className="bg-surfaceElevated border border-surfaceBorder rounded-2xl flex-row items-center px-4 py-1">
                <MaterialIcons
                  name="lock"
                  size={20}
                  color={Colors.textMuted}
                />
                <TextInput
                  className="flex-1 py-4 px-3 text-textPrimary text-[15px]"
                  placeholder="Password"
                  placeholderTextColor={Colors.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <MaterialIcons
                    name={showPassword ? "visibility" : "visibility-off"}
                    size={20}
                    color={Colors.textMuted}
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={handleSignup}
                disabled={isLoading}
                className="bg-accent h-[56px] rounded-2xl items-center justify-center mt-2 shadow-lg shadow-accent/30"
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color={Colors.textPrimary} />
                ) : (
                  <Text className="text-textPrimary text-[16px] font-bold">
                    START TRANSCRIBING
                  </Text>
                )}
              </TouchableOpacity>

              <View className="flex-row justify-center mt-6 mb-8">
                <Text className="text-textMuted">
                  Already have an account?{" "}
                </Text>
                <Link href="/(auth)/login" asChild>
                  <TouchableOpacity>
                    <Text className="text-accentLight font-bold">Sign In</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Language Modal */}
      <Modal visible={showLanguageModal} transparent animationType="fade">
        <View className="flex-1 bg-black/60 justify-end">
          <Pressable className="absolute top-0 right-0 bottom-0 left-0" onPress={() => setShowLanguageModal(false)} />
          <Animated.View entering={FadeInDown.duration(300).springify()} className="bg-surfaceElevated rounded-t-3xl pt-3 pb-8 px-6 max-h-[60%] border-t border-surfaceBorder overflow-hidden shadow-2xl">
            <View className="w-12 h-[5px] bg-surfaceBorder rounded-full self-center mb-6" />
            <Text className="text-textPrimary text-[22px] font-extrabold mb-5 px-1 tracking-tight">Select Language</Text>
            <RNScrollView showsVerticalScrollIndicator={false} className="mb-4">
              {LANGUAGES.map((opt) => {
                const isSelected = language === opt;
                return (
                  <TouchableOpacity
                    key={opt}
                    className={`flex-row items-center justify-between py-4 border-b border-surfaceBorder/40 ${isSelected ? 'bg-accentGlow/20 -mx-3 px-3 rounded-2xl border-b-0 mb-1' : ''}`}
                    activeOpacity={0.7}
                    onPress={() => {
                      setLanguage(opt);
                      setShowLanguageModal(false);
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
            </RNScrollView>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
