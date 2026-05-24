import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { palette } from '../../theme/colors';
import { motion } from '../../theme/motion';
import { radius } from '../../theme/radius';
import { space } from '../../theme/spacing';

type Props = {
  width?: number | `${number}%`;
  height?: number;
  style?: StyleProp<ViewStyle>;
  borderRadius?: number;
};

/** Yukleniyor placeholder — shimmer (web + native). */
export function Skeleton({
  width = '100%',
  height = 16,
  style,
  borderRadius = radius.sm,
}: Props) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: motion.shimmer.duration,
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: motion.shimmer.duration,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.65],
  });

  return (
    <View style={[styles.base, { width, height, borderRadius }, style]}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.shimmer, { opacity, borderRadius }]} />
    </View>
  );
}

export function SkeletonBlock({ lines = 3 }: { lines?: number }) {
  return (
    <View style={styles.block}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} height={14} width={i === lines - 1 ? '70%' : '100%'} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: palette.borderLight,
    overflow: 'hidden',
  },
  shimmer: {
    backgroundColor: palette.gray600,
  },
  block: { gap: space.sm },
});
