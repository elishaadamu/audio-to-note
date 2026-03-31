import React, { useEffect } from 'react';
import { TouchableOpacity, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import Colors from '@/constants/Colors';

interface RecordButtonProps {
  isRecording: boolean;
  onPress: () => void;
  size?: number;
}

export default function RecordButton({ isRecording, onPress, size = 88 }: RecordButtonProps) {
  const pulseScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);
  const ring1Scale = useSharedValue(1);
  const ring2Scale = useSharedValue(1);
  const ring1Opacity = useSharedValue(0);
  const ring2Opacity = useSharedValue(0);

  useEffect(() => {
    if (isRecording) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(0.94, { duration: 700, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 700 })
        ),
        -1,
        true
      );
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 700 }),
          withTiming(0.5, { duration: 700 })
        ),
        -1,
        true
      );
      ring1Scale.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 0 }),
          withTiming(1.8, { duration: 1400, easing: Easing.out(Easing.ease) })
        ),
        -1
      );
      ring1Opacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 0 }),
          withTiming(0, { duration: 1400 })
        ),
        -1
      );
      ring2Scale.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 0 }),
          withTiming(1.8, { duration: 1400, easing: Easing.out(Easing.ease) })
        ),
        -1
      );
      ring2Opacity.value = withRepeat(
        withSequence(
          withTiming(0.4, { duration: 0 }),
          withTiming(0, { duration: 1400 })
        ),
        -1
      );
      setTimeout(() => {
        ring2Scale.value = withRepeat(
          withSequence(
            withTiming(1, { duration: 0 }),
            withTiming(1.8, { duration: 1400, easing: Easing.out(Easing.ease) })
          ),
          -1
        );
      }, 700);
    } else {
      cancelAnimation(pulseScale);
      cancelAnimation(glowOpacity);
      cancelAnimation(ring1Scale);
      cancelAnimation(ring1Opacity);
      cancelAnimation(ring2Scale);
      cancelAnimation(ring2Opacity);
      pulseScale.value = withTiming(1, { duration: 300 });
      glowOpacity.value = withTiming(0, { duration: 300 });
      ring1Scale.value = withTiming(1, { duration: 300 });
      ring1Opacity.value = withTiming(0, { duration: 300 });
      ring2Scale.value = withTiming(1, { duration: 300 });
      ring2Opacity.value = withTiming(0, { duration: 300 });
    }
  }, [isRecording]);

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));
  const ring1Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring1Scale.value }],
    opacity: ring1Opacity.value,
  }));
  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring2Scale.value }],
    opacity: ring2Opacity.value,
  }));

  const innerColor = isRecording ? Colors.danger : Colors.accent;
  const glowColor = isRecording ? Colors.dangerGlow : Colors.accentGlow;

  return (
    <View className="items-center justify-center" style={{ width: size * 2, height: size * 2 }}>
      {/* Ripple rings */}
      <Animated.View
        className="absolute border-2"
        style={[
          ring1Style,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: isRecording ? Colors.danger : Colors.accent,
          },
        ]}
      />
      <Animated.View
        className="absolute border-2"
        style={[
          ring2Style,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: isRecording ? Colors.danger : Colors.accent,
          },
        ]}
      />

      {/* Glow shadow */}
      <Animated.View
        className="absolute"
        style={[
          glowStyle,
          {
            width: size + 32,
            height: size + 32,
            borderRadius: (size + 32) / 2,
            backgroundColor: glowColor,
          },
        ]}
      />

      {/* Button */}
      <Animated.View style={buttonStyle}>
        <TouchableOpacity
          onPress={onPress}
          activeOpacity={0.85}
          className="items-center justify-center shadow-lg shadow-black/40 elevation-md"
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: innerColor,
          }}
        >
          <View
            className="bg-white/85"
            style={
              isRecording
                ? { width: 26, height: 26, borderRadius: 4 }
                : { width: 22, height: 22, borderRadius: 11 }
            }
          />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}
