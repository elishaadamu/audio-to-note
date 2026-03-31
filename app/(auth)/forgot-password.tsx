import Colors from "@/constants/Colors";
import { API_URL } from "@/constants/Config";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import Toast from "react-native-toast-message";
import * as SecureStore from "expo-secure-store";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  React.useEffect(() => {
    loadSavedEmail();
  }, []);

  const loadSavedEmail = async () => {
    let savedEmail = null;
    if (Platform.OS === "web") {
      savedEmail = localStorage.getItem("LAST_USER_EMAIL");
    } else {
      savedEmail = await SecureStore.getItemAsync("LAST_USER_EMAIL");
    }
    if (savedEmail) setEmail(savedEmail);
  };

  const handleRequestCode = async () => {
    if (!email) {
      Toast.show({
        type: "error",
        text1: "Missing email",
        text2: "Please enter your email address.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to request reset code");
      }

      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Verification code has been sent to your email.",
      });
      router.push({
        pathname: "/(auth)/verify-otp",
        params: { email },
      } as any);
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message,
      });
    } finally {
      setIsLoading(false);
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
          <TouchableOpacity
            className="absolute top-12 left-0 w-10 h-10 rounded-full bg-surfaceElevated items-center justify-center border border-surfaceBorder z-10"
            onPress={() => router.back()}
          >
            <MaterialIcons
              name="arrow-back"
              size={24}
              color={Colors.textPrimary}
            />
          </TouchableOpacity>

          <Animated.View entering={FadeInDown.duration(600).springify()}>
            <View className="items-center mb-10 pt-10">
              <View className="w-20 h-20 rounded-3xl bg-accentLight items-center justify-center shadow-lg shadow-accent/40 mb-4">
                <MaterialIcons
                  name="lock-reset"
                  size={40}
                  color={Colors.textPrimary}
                />
              </View>
              <Text className="text-3xl font-extrabold text-textPrimary tracking-tight">
                Forgot PIN
              </Text>
              <Text className="text-textSecondary mt-2 text-center">
                Enter your email and we'll send you a 6-digit code to reset your
                PIN.
              </Text>
            </View>

            <View className="gap-4">
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
                onPress={handleRequestCode}
                disabled={isLoading}
                className="bg-accent h-[56px] rounded-2xl items-center justify-center mt-4 shadow-lg shadow-accent/30"
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color={Colors.textPrimary} />
                ) : (
                  <Text className="text-textPrimary text-[16px] font-bold">
                    SEND CODE
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
