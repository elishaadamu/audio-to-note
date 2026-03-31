import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle, DimensionValue } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withRepeat, 
  withSequence, 
  withTiming,
  interpolateColor
} from 'react-native-reanimated';
import Colors from '@/constants/Colors';

interface SkeletonLoaderProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: ViewStyle;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ 
  width = '100%', 
  height = 20, 
  borderRadius = 8,
  style 
}) => {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 1000 }),
        withTiming(0.3, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: '#333', // Default for dark mode, will adjust if needed
        },
        animatedStyle,
        style,
      ]}
    />
  );
};

export const NoteSkeleton = () => {
  return (
    <View style={styles.container}>
      <SkeletonLoader height={40} width="60%" style={{ marginBottom: 20 }} />
      <View style={styles.row}>
          <SkeletonLoader height={50} width={50} borderRadius={12} />
          <View style={{ flex: 1, marginLeft: 15 }}>
              <SkeletonLoader height={15} width="40%" style={{ marginBottom: 8 }} />
              <SkeletonLoader height={10} width="30%" />
          </View>
      </View>
      <SkeletonLoader height={30} width="80%" style={{ marginTop: 20, marginBottom: 10 }} />
      <SkeletonLoader height={15} width="40%" style={{ marginBottom: 25 }} />
      
      <View style={styles.statsRow}>
        <SkeletonLoader height={50} width="30%" borderRadius={15} />
        <SkeletonLoader height={50} width="30%" borderRadius={15} />
        <SkeletonLoader height={50} width="30%" borderRadius={15} />
      </View>

      <View style={styles.actionsRow}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
              <SkeletonLoader key={i} height={45} width="31%" borderRadius={12} style={{ marginBottom: 10 }} />
          ))}
      </View>

      <SkeletonLoader height={50} width="100%" borderRadius={15} style={{ marginTop: 10 }} />

      <View style={{ marginTop: 30 }}>
          <SkeletonLoader height={20} width="40%" style={{ marginBottom: 15 }} />
          <SkeletonLoader height={15} width="100%" style={{ marginBottom: 10 }} />
          <SkeletonLoader height={15} width="100%" style={{ marginBottom: 10 }} />
          <SkeletonLoader height={15} width="90%" style={{ marginBottom: 10 }} />
          <SkeletonLoader height={15} width="95%" style={{ marginBottom: 10 }} />
          <SkeletonLoader height={15} width="80%" />
      </View>
    </View>
  );
};

export const ListSkeleton = () => {
  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={styles.cardSkeleton}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 }}>
            <View style={{ flex: 1 }}>
              <SkeletonLoader height={20} width="70%" style={{ marginBottom: 8 }} />
              <SkeletonLoader height={12} width="40%" />
            </View>
            <SkeletonLoader height={40} width={40} borderRadius={10} />
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <SkeletonLoader height={25} width={70} borderRadius={6} />
            <SkeletonLoader height={25} width={90} borderRadius={6} />
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  cardSkeleton: {
    backgroundColor: '#1A1A1A', // Darker background for the card itself
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  }
});

export default SkeletonLoader;
