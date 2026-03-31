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
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import Toast from "react-native-toast-message";
import { authService } from "@/services/authService";

export default function SignupScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Blinking Cursor Logic
  const [isCursorVisible, setIsCursorVisible] = useState(true);
  React.useEffect(() => {
    const interval = setInterval(() => {
      setIsCursorVisible((v) => !v);
    }, 500);
    return () => clearInterval(interval);
  }, []);

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
    if (password.length !== 4) {
      Toast.show({
        type: "error",
        text1: "Invalid PIN",
        text2: "PIN must be exactly 4 digits.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const data = await authService.signup(name, email, password);

      if (Platform.OS === "web") {
        localStorage.setItem("AUTH_TOKEN", data.token);
        localStorage.setItem("USER_ID", data.user.id);
        localStorage.setItem("USER_NAME", data.user.name || "User");
        localStorage.setItem("LAST_USER_EMAIL", email);
      } else {
        await SecureStore.setItemAsync("AUTH_TOKEN", data.token);
        await SecureStore.setItemAsync("USER_ID", data.user.id);
        await SecureStore.setItemAsync("USER_NAME", data.user.name || "User");
        await SecureStore.setItemAsync("LAST_USER_EMAIL", email);
      }

      router.replace("/(tabs)");
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
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            paddingHorizontal: 32,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View entering={FadeInDown.duration(600).springify()}>
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

              <View className="items-center mt-2 mb-2">
                <Text className="text-textMuted text-[13px] font-bold uppercase tracking-wider mb-3">
                  Set Your 4-Digit PIN
                </Text>
                
                <View className="relative items-center">
                  <TextInput
                    className="absolute opacity-0 w-full h-full z-10"
                    value={password}
                    onChangeText={(val) => setPassword(val.replace(/\D/g, "").slice(0, 4))}
                    keyboardType="number-pad"
                    maxLength={4}
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
                </View>
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
    </SafeAreaView>
  );
}
