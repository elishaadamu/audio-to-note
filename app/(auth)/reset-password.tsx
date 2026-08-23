import Colors from "@/constants/Colors";
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
  Pressable
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import Toast from "react-native-toast-message";
import { authService } from "@/services/authService";

export default function ResetPinScreen() {
  const params = useLocalSearchParams();
  const email = params.email as string;
  const token = params.token as string;
  
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const router = useRouter();

  const handleResetPin = async (finalPin: string) => {
    if (finalPin.length !== 4) return;

    if (!isConfirming) {
      setPin(finalPin);
      setIsConfirming(true);
      return;
    }

    if (finalPin !== pin) {
      Toast.show({
        type: "error",
        text1: "PIN mismatch",
        text2: "Your PIN entries do not match. Try again.",
      });
      setPin("");
      setConfirmPin("");
      setIsConfirming(false);
      return;
    }

    setIsLoading(true);
    try {
      await authService.resetPin(email, finalPin);

      if (email) {
        if (Platform.OS === "web") {
          localStorage.setItem("LAST_USER_EMAIL", email);
        } else {
          await SecureStore.setItemAsync("LAST_USER_EMAIL", email);
        }
      }

      Toast.show({
        type: "success",
        text1: "PIN Updated",
        text2: "Your security PIN has been updated. Please sign in.",
      });
      router.replace("/(auth)/login");
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Reset Failed",
        text2: error.message || "Failed to reset PIN",
      });
      setIsConfirming(false);
      setPin("");
      setConfirmPin("");
    } finally {
      setIsLoading(false);
    }
  };

  const onPinChange = (val: string) => {
    const clean = val.replace(/\D/g, "").slice(0, 4);
    if (isConfirming) {
      setConfirmPin(clean);
      if (clean.length === 4) handleResetPin(clean);
    } else {
      setPin(clean);
      if (clean.length === 4) handleResetPin(clean);
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
  const displayPin = isConfirming ? confirmPin : pin;

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

          <Animated.View className="flex-1 justify-center" entering={FadeInDown.duration(600).springify()}>
            <View className="items-center mb-12">
              <View className="w-24 h-24 rounded-3xl bg-accentLight items-center justify-center shadow-lg shadow-accent/40 mb-6 border-2 border-surfaceBorder">
                <MaterialIcons name={isConfirming ? "security" : "vpn-key"} size={52} color={Colors.textPrimary} />
              </View>
              <Text className="text-3xl font-extrabold text-textPrimary tracking-tight text-center">
                {isConfirming ? "Confirm New PIN" : "Reset Security PIN"}
              </Text>
              <Text className="text-textSecondary mt-2 text-center px-4">
                {isConfirming 
                  ? "Re-enter your new PIN to confirm." 
                  : "Enter a new 4-digit security PIN for your account."}
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
                  value={displayPin}
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
                        displayPin.length === i ? 'border-accent' : 'border-surfaceBorder'
                      }`}
                    >
                      {displayPin.length > i ? (
                        <View key="dot" className="w-3.5 h-3.5 rounded-full bg-textPrimary shadow-sm" />
                      ) : displayPin.length === i ? (
                        <View 
                          key="cursor"
                          style={{ opacity: isCursorVisible ? 1 : 0 }} 
                          className="w-[2px] h-8 bg-accent" 
                        />
                      ) : (
                        <View key="placeholder" className="w-2.5 h-2.5 rounded-full bg-surfaceBorder/50" />
                      )}
                    </View>
                  ))}
                </View>
              </Pressable>

              {isLoading && <ActivityIndicator color={Colors.accent} size="large" className="mt-12" />}
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
