import Colors from "@/constants/Colors";
import { API_URL } from "@/constants/Config";
import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
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

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams();
  const email = params.email as string;
  const token = params.token as string;
  
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Blinking Cursor Logic
  const [isCursorVisible, setIsCursorVisible] = useState(true);
  React.useEffect(() => {
    const interval = setInterval(() => {
      setIsCursorVisible((v) => !v);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const handleResetPassword = async () => {
    if (!token || !newPassword || !confirmPassword) {
      Toast.show({
        type: "error",
        text1: "Missing fields",
        text2: "Reset token expired or missing. Please try from Forgot PIN again.",
      });
      return;
    }
    // ... rest of validation logic ...

    if (newPassword !== confirmPassword) {
      Toast.show({
        type: "error",
        text1: "PIN mismatch",
        text2: "Please make sure your PINs match.",
      });
      return;
    }

    if (token.length !== 6) {
      Toast.show({
        type: "error",
        text1: "Invalid code",
        text2: "The verification code must be 6 digits.",
      });
      return;
    }

    if (newPassword.length !== 4) {
      Toast.show({
        type: "error",
        text1: "Invalid PIN",
        text2: "Your new PIN must be exactly 4 digits.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, token, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "PIN reset failed");
      }

      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Your PIN has been reset successfully.",
      });
      router.replace("/(auth)/login");
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
            paddingHorizontal: 32,
            justifyContent: "center",
          }}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            className="absolute top-6 left-0 w-10 h-10 rounded-full bg-surfaceElevated items-center justify-center border border-surfaceBorder"
            onPress={() => router.back()}
          >
            <MaterialIcons
              name="arrow-back"
              size={24}
              color={Colors.textPrimary}
            />
          </TouchableOpacity>

          <Animated.View entering={FadeInDown.duration(600).springify()}>
            <View className="items-center mb-8">
              <View className="w-20 h-20 rounded-3xl bg-accent items-center justify-center shadow-lg shadow-accent/40 mb-4">
                <MaterialIcons
                  name="vpn-key"
                  size={40}
                  color={Colors.textPrimary}
                />
              </View>
              <Text className="text-3xl font-extrabold text-textPrimary tracking-tight text-center">
                Reset PIN
              </Text>
              <Text className="text-textSecondary mt-2 text-center px-4">
                Enter the 6-digit verification code sent to your email and your
                new 4-digit PIN.
              </Text>
            </View>

            <View className="items-center mt-4">
              <View className="w-full mb-8">
                <Text className="text-textMuted text-[12px] font-bold uppercase tracking-widest mb-3 text-center">
                  New 4-Digit PIN
                </Text>
                <View className="relative items-center">
                  <TextInput
                    className="absolute opacity-0 w-full h-full z-10"
                    value={newPassword}
                    onChangeText={(val) => setNewPassword(val.replace(/\D/g, "").slice(0, 4))}
                    keyboardType="number-pad"
                    maxLength={4}
                  />
                  <View className="flex-row gap-3">
                    {[...Array(4)].map((_, i) => (
                      <View 
                        key={i} 
                        className={`w-12 h-14 rounded-2xl border-2 items-center justify-center bg-surfaceElevated shadow-sm ${
                          newPassword.length === i ? 'border-accent' : 'border-surfaceBorder'
                        }`}
                      >
                        {newPassword.length > i ? (
                          <View className="w-2.5 h-2.5 rounded-full bg-textPrimary" />
                        ) : newPassword.length === i ? (
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
                </View>
              </View>

              <View className="w-full mb-10">
                <Text className="text-textMuted text-[12px] font-bold uppercase tracking-widest mb-3 text-center">
                  Confirm Your PIN
                </Text>
                <View className="relative items-center">
                  <TextInput
                    className="absolute opacity-0 w-full h-full z-10"
                    value={confirmPassword}
                    onChangeText={(val) => setConfirmPassword(val.replace(/\D/g, "").slice(0, 4))}
                    keyboardType="number-pad"
                    maxLength={4}
                  />
                  <View className="flex-row gap-3">
                    {[...Array(4)].map((_, i) => (
                      <View 
                        key={i} 
                        className={`w-12 h-14 rounded-2xl border-2 items-center justify-center bg-surfaceElevated shadow-sm ${
                          confirmPassword.length === i ? 'border-accent' : 'border-surfaceBorder'
                        }`}
                      >
                        {confirmPassword.length > i ? (
                          <View className="w-2.5 h-2.5 rounded-full bg-textPrimary" />
                        ) : confirmPassword.length === i ? (
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
                </View>
              </View>

              <TouchableOpacity
                onPress={handleResetPassword}
                disabled={isLoading}
                className="bg-accent h-[56px] w-full rounded-2xl items-center justify-center shadow-lg shadow-accent/30"
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color={Colors.textPrimary} />
                ) : (
                  <Text className="text-textPrimary text-[16px] font-bold">
                    RESET PIN
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
