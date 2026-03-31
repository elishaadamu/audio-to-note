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
  View,
  Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import Toast from "react-native-toast-message";

export default function VerifyOtpScreen() {
  const { email } = useLocalSearchParams();
  const [token, setToken] = useState("");
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

  const handleVerifyOtp = async () => {
    if (!token || token.length !== 6) {
      Toast.show({
        type: "error",
        text1: "Invalid code",
        text2: "Please enter the 6-digit code.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/verify-reset-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, token }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Verification failed");
      }

      // Success Alert as requested
      Alert.alert(
        "Verified",
        "Your code is correct. You can now reset your PIN.",
        [
          { 
            text: "Continue", 
            onPress: () => {
              router.push({
                pathname: "/(auth)/reset-password",
                params: { email, token }
              } as any);
            }
          }
        ]
      );

    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Verification Error",
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
              <View className="w-20 h-20 rounded-3xl bg-accentLight items-center justify-center shadow-lg shadow-accent/40 mb-4">
                <MaterialIcons
                  name="phonelink-lock"
                  size={40}
                  color={Colors.textPrimary}
                />
              </View>
              <Text className="text-3xl font-extrabold text-textPrimary tracking-tight text-center">
                Verify Code
              </Text>
              <Text className="text-textSecondary mt-2 text-center px-4">
                Enter the 6-digit code sent to {email}
              </Text>
            </View>

            <View className="items-center mt-4">
              <View className="relative items-center">
                <TextInput
                  className="absolute opacity-0 w-full h-full z-10"
                  value={token}
                  onChangeText={(val) =>
                    setToken(val.replace(/\D/g, "").slice(0, 6))
                  }
                  keyboardType="number-pad"
                  maxLength={6}
                />
                
                <View className="flex-row gap-2">
                  {[...Array(6)].map((_, i) => (
                    <View 
                      key={i} 
                      className={`w-11 h-14 rounded-xl border-2 items-center justify-center bg-surfaceElevated shadow-sm ${
                        token.length === i ? 'border-accent' : 'border-surfaceBorder'
                      }`}
                    >
                      {token.length > i ? (
                        <Text className="text-textPrimary text-xl font-bold">{token[i]}</Text>
                      ) : token.length === i ? (
                        <View 
                          style={{ opacity: isCursorVisible ? 1 : 0 }} 
                          className="w-[2px] h-6 bg-accent" 
                        />
                      ) : (
                        <View className="w-1.5 h-1.5 rounded-full bg-surfaceBorder" />
                      )}
                    </View>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                onPress={handleVerifyOtp}
                disabled={isLoading}
                className="bg-accent h-[56px] w-full rounded-2xl items-center justify-center mt-10 shadow-lg shadow-accent/30"
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color={Colors.textPrimary} />
                ) : (
                  <Text className="text-textPrimary text-[16px] font-bold">
                    VERIFY CODE
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
