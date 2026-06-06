import type { ReactNode } from 'react';
import { useRef } from 'react';
import {
  Animated,
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { motion } from '../../theme/motion';

type Props = Omit<PressableProps, 'style' | 'children'> & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Basili geri bildirim — scale 0.98 + hafif opacity (RN Animated, web + native). */
export function PressableScale({ children, style, disabled, ...rest }: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const animateTo = (toScale: number, toOpacity: number) => {
    Animated.parallel([
      Animated.timing(scale, {
        toValue: toScale,
        duration: motion.duration.fast,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: toOpacity,
        duration: motion.duration.fast,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <Pressable
      {...rest}
      disabled={disabled}
      onPressIn={(e) => {
        if (!disabled) animateTo(motion.press.scale, motion.press.opacity);
        rest.onPressIn?.(e);
      }}
      onPressOut={(e) => {
        animateTo(1, 1);
        rest.onPressOut?.(e);
      }}
    >
      <Animated.View style={[style, { transform: [{ scale }], opacity }]}>{children}</Animated.View>
    </Pressable>
  );
}
