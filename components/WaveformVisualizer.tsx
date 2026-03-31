import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  cancelAnimation
} from 'react-native-reanimated';
import Colors from '@/constants/Colors';

interface WaveformVisualizerProps {
  isRecording: boolean;
  metering?: number;
  barCount?: number;
}

const BAR_COUNT = 32;

function WaveBar({ level, isRecording, index }: { level: number; isRecording: boolean; index: number }) {
  const height = useSharedValue(4);

  useEffect(() => {
    if (isRecording) {
      // Base calculation on the incoming 0-1 level volume
      const targetHeight = 4 + Math.max(0, level * 42); // scaling to fit ~46px height dynamically
      
      // Inject static high-frequency detail directly into the bar height based on its position index
      // to make a single global volume metric look like an acoustic frequency spectrum
      const fauxFrequency = Math.sin(index * 0.8) * Math.cos(index * 1.5);
      const variance = fauxFrequency * (level * 16);
      
      height.value = withSpring(Math.max(4, targetHeight + variance), { 
        damping: 14, 
        stiffness: 160 
      });
    } else {
      cancelAnimation(height);
      height.value = withRepeat(
        withSequence(
          withTiming(4 + Math.random() * 4, { duration: 1200 + index * 40, easing: Easing.inOut(Easing.ease) }),
          withTiming(2, { duration: 1200 + index * 40 })
        ),
        -1,
        true
      );
    }
  }, [level, isRecording]);

  const animStyle = useAnimatedStyle(() => ({
    height: height.value,
    opacity: isRecording ? 1 : 0.4,
  }));

  return (
    <Animated.View
      className="w-[3px] rounded-sm min-h-[4px]"
      style={[
        animStyle,
        {
          backgroundColor: isRecording ? Colors.accent : Colors.waveformMuted,
        },
      ]}
    />
  );
}

export default function WaveformVisualizer({ isRecording, metering = -160, barCount = BAR_COUNT }: WaveformVisualizerProps) {
  // Maintain a flowing array of levels for each individual bar so the waveform scrolls right-to-left
  const [levels, setLevels] = useState<number[]>(Array(barCount).fill(0));

  useEffect(() => {
    if (isRecording) {
      // Normalize raw dB metering (roughly -50dB silence to 0dB max) to a linear 0.0 -> 1.0 multiplier
      const floor = -50;
      const normalized = Math.max(0, Math.min(1, (metering - floor) / Math.abs(floor)));
      
      // Shift array left and push new reading on the right
      setLevels((prev) => [...prev.slice(1), normalized]);
    }
  }, [metering, isRecording]);

  return (
    <View className="flex-row items-center justify-center h-[72px] gap-[3px] px-2">
      {levels.map((level, i) => (
        <WaveBar key={i} index={i} level={level} isRecording={isRecording} />
      ))}
    </View>
  );
}
