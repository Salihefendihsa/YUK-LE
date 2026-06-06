import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { palette } from '../../theme/colors';
import { radius } from '../../theme/radius';
import { shadows } from '../../theme/shadows';
import { space } from '../../theme/spacing';
import type { RoleAccent } from '../../theme/roleAccent';

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'glass' | 'elevated' | 'gradient' | 'hero';
  padding?: keyof typeof import('../../theme/spacing').spacing;
  /**
   * Rol aksanı. `hero` varyantında zorunlu — diyagonal turuncu/kırmızı zemin,
   * radial glow ve renkli gölgeyi besler. `gradient` varyantında ışıma+kenarlık
   * rengini değiştirir. Diğer varyantlar (nötr kartlar) bunu yok sayar.
   */
  accent?: RoleAccent;
};

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

const DEFAULT_GLOW = ['rgba(255,138,51,0.22)', 'rgba(255,107,0,0.05)', 'transparent'] as const;

export function Card({ children, style, variant = 'glass', padding = 6, accent }: Props) {
  const isHero = variant === 'hero' && !!accent;
  const heroShadow =
    isHero && accent
      ? Platform.select({
          ios: {
            shadowColor: accent.hero.shadowColor,
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.22,
            shadowRadius: 26,
            elevation: 9,
          },
          android: { elevation: 9 },
          default: {},
        })
      : null;

  return (
    <View
      style={[
        styles.base,
        variant === 'glass' && styles.glass,
        variant === 'elevated' && styles.elevated,
        variant === 'default' && styles.default,
        variant === 'gradient' && styles.gradient,
        isHero && styles.hero,
        isHero && accent ? { borderColor: accent.hero.border } : null,
        variant === 'gradient' && accent ? { borderColor: accent.accentBorder } : null,
        { padding: paddingMap[padding] ?? space.lg },
        isHero ? heroShadow : shadows.card,
        style,
      ]}
    >
      {isHero && accent ? (
        <>
          <LinearGradient
            colors={accent.hero.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" pointerEvents="none">
            <Defs>
              <RadialGradient id="heroGlow" cx="0.9" cy="0.02" r="0.85">
                <Stop offset="0" stopColor={accent.hero.glowColor} stopOpacity={accent.hero.glowPeak} />
                <Stop offset="0.55" stopColor={accent.hero.glowColor} stopOpacity={accent.hero.glowPeak * 0.3} />
                <Stop offset="1" stopColor={accent.hero.glowColor} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#heroGlow)" />
          </Svg>
        </>
      ) : null}
      {variant === 'gradient' && (
        <LinearGradient
          colors={DEFAULT_GLOW}
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
  hero: {
    backgroundColor: '#121620',
    borderColor: palette.brandBorder,
  },
});
