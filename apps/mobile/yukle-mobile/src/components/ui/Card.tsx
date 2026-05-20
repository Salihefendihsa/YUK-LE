import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { palette } from '../../theme/colors';
import { radius } from '../../theme/radius';
import { shadows } from '../../theme/shadows';
import { spacing } from '../../theme/spacing';

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'glass' | 'elevated';
  padding?: keyof typeof spacing;
};

export function Card({ children, style, variant = 'glass', padding = 6 }: Props) {
  return (
    <View
      style={[
        styles.base,
        variant === 'glass' && styles.glass,
        variant === 'elevated' && styles.elevated,
        variant === 'default' && styles.default,
        { padding: spacing[padding] },
        shadows.card,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  glass: {
    backgroundColor: palette.glass,
    borderColor: palette.glassBorder,
  },
  elevated: {
    backgroundColor: palette.card,
    borderColor: palette.borderLight,
  },
  default: {
    backgroundColor: palette.surface,
    borderColor: palette.borderSubtle,
  },
});
