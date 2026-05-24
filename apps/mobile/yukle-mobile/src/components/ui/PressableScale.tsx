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

/** Basili geri bildirim — RN Animated (web + native). */
export function PressableScale({ children, style, disabled, ...rest }: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (toValue: number) => {
    Animated.timing(scale, {
      toValue,
      duration: motion.duration.fast,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      {...rest}
      disabled={disabled}
      onPressIn={(e) => {
        if (!disabled) animateTo(motion.press.scale);
        rest.onPressIn?.(e);
      }}
      onPressOut={(e) => {
        animateTo(1);
        rest.onPressOut?.(e);
      }}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}
