import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

const { width } = Dimensions.get("window");

// For the image, I'll use the path from the tool output
// In reality, we'd bundle it or use a URI. For this mock, I'll use a local-style uri if it's an artifact.
const ILLUSTRATION_PATH = require("../../assets/images/icon.png"); // Placeholder until I know the real path structure or use the artifact

// Since I just generated an artifact, I'll use it as a placeholder URI or keep it simple.
// In this environment, I can't easily "require" a generated artifact in the code unless I move it.
// I'll use a generic placeholder for now or stick to the icon if it exists.

export default function WelcomeScreen() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push("/(auth)/signup");
  };

  const handleSignIn = () => {
    router.push("/(auth)/login");
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-8 justify-between py-12">
        {/* Header / Logo */}
        <Animated.View
          entering={FadeInDown.duration(800).delay(200)}
          className="flex-row items-center justify-center space-x-2"
        >
          <View className="w-10 h-10 bg-accent rounded-xl items-center justify-center shadow-lg shadow-accent/40">
            <Ionicons name="mic" size={24} color="white" />
          </View>
          <Text className="text-2xl font-bold text-textPrimary ml-3 tracking-tight">
            AudioNotes
          </Text>
        </Animated.View>

        {/* Illustration Area */}
        <Animated.View
          entering={FadeInUp.duration(1000).springify()}
          className="items-center justify-center -mt-8"
        >
          <View className="w-full aspect-square max-w-[320px] relative">
            {/* Glow backing */}
            <View className="absolute inset-0 bg-accent/10 rounded-full blur-3xl scale-125" />

            {/* Main Illustration Placeholder (We will simulate it with symbols or actual assets) */}
            <View className="flex-1 items-center justify-center">
              <Ionicons
                name="sparkles-outline"
                size={120}
                color="#6C63FF"
                style={{ opacity: 0.8 }}
              />
            </View>
          </View>
        </Animated.View>

        {/* Content Area */}
        <View>
          <Animated.View entering={FadeInDown.duration(800).delay(400)}>
            <Text className="text-4xl font-extrabold text-textPrimary text-center leading-[48px]">
              Turn Lecture Audio into{" "}
              <Text className="text-accent underline">Perfect Notes</Text>
            </Text>
            <Text className="text-lg text-textSecondary text-center mt-4 leading-6 px-4">
              AI-powered summaries and key takeaways from every conversation.
              Study smarter, not harder.
            </Text>
          </Animated.View>

          {/* Actions */}
          <Animated.View
            entering={FadeInDown.duration(800).delay(600)}
            className="mt-12 space-y-4 gap-4"
          >
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleGetStarted}
              className="bg-accent h-16 rounded-2xl flex-row items-center justify-center shadow-xl shadow-accent/30"
            >
              <Text className="text-white text-lg font-bold">Get Started</Text>
              <Ionicons
                name="arrow-forward"
                size={20}
                color="white"
                className="ml-2"
              />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleSignIn}
              className="h-16 rounded-2xl items-center justify-center border border-surfaceBorder"
            >
              <Text className="text-textSecondary text-lg font-semibold">
                Already have an account? Sign In
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Footer / Features hint */}
        <Animated.View
          entering={FadeInDown.duration(800).delay(800)}
          className="flex-row justify-center space-x-6 opacity-60"
        >
          <View className="items-center">
            <Ionicons name="infinite" size={18} color="#8E8E93" />
            <Text className="text-[10px] text-textMuted mt-1">Unlimited</Text>
          </View>
          <View className="items-center">
            <Ionicons name="shield-checkmark" size={18} color="#8E8E93" />
            <Text className="text-[10px] text-textMuted mt-1">Secure</Text>
          </View>
          <View className="items-center">
            <Ionicons name="flash" size={18} color="#8E8E93" />
            <Text className="text-[10px] text-textMuted mt-1">Instant</Text>
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA", // Fallback to light mode background
  },
});
