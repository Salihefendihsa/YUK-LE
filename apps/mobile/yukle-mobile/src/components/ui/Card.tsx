import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { palette } from '../../theme/colors';
import { radius } from '../../theme/radius';
import { shadows } from '../../theme/shadows';
import { space } from '../../theme/spacing';
import type { RoleAccent } from '../../theme/roleAccent';

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'glass' | 'elevated' | 'gradient';
  padding?: keyof typeof import('../../theme/spacing').spacing;
  /**
   * Rol aksanı. Verilirse `gradient` varyantının ışıması + kenarlığı bu role
   * göre renklenir (turuncu/kırmızı). Verilmezse varsayılan turuncu kalır.
   */
  accent?: RoleAccent;
};

const DEFAULT_GLOW = ['rgba(255,138,51,0.22)', 'rgba(255,107,0,0.05)', 'transparent'] as const;

const paddingMap = {
  0: 0,
  1: space.xs,
  2: space.sm,
  3: 12,
  4: space.md,
  5: 20,
  6: space.lg,
  8: space.xl,
  10: 40,
  12: space.xxl,
  16: 64,
} as const;

export function Card({ children, style, variant = 'glass', padding = 6, accent }: Props) {
  const glowColors = accent?.gradientSoft ?? DEFAULT_GLOW;
  return (
    <View
      style={[
        styles.base,
        variant === 'glass' && styles.glass,
        variant === 'elevated' && styles.elevated,
        variant === 'default' && styles.default,
        variant === 'gradient' && styles.gradient,
        variant === 'gradient' && accent ? { borderColor: accent.accentBorder } : null,
        { padding: paddingMap[padding] ?? space.lg },
        shadows.card,
        style,
      ]}
    >
      {variant === 'gradient' && (
        <LinearGradient
          colors={glowColors}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      )}
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
  gradient: {
    backgroundColor: palette.card,
    borderColor: palette.brandBorder,
  },
});
