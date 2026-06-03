import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { palette } from '../../theme/colors';
import { logoFontFamily } from '../../theme/typography';
import { NavlonixMonogram } from './NavlonixMonogram';

export type LogoVariant = 'full' | 'mark' | 'wordmark';
export type LogoSize = 'sm' | 'md' | 'lg';
export type LogoTheme = 'dark' | 'light';

const LOGO_TEXT_DARK = '#F4F4F5';
const LOGO_TEXT_LIGHT = '#18181B';

const SIZE_MAP: Record<LogoSize, { cap: number; mark: number; gap: number }> = {
  sm: { cap: 14, mark: 21, gap: 8.4 },
  md: { cap: 16, mark: 24, gap: 9.6 },
  lg: { cap: 20, mark: 30, gap: 12 },
};

export type LogoProps = {
  variant?: LogoVariant;
  size?: LogoSize;
  theme?: LogoTheme;
  style?: StyleProp<ViewStyle>;
};

function Wordmark({ capSize, color }: { capSize: number; color: string }) {
  return (
    <Text
      style={[
        styles.wordmark,
        {
          fontSize: capSize,
          color,
          fontFamily: logoFontFamily.bold,
        },
      ]}
      accessibilityLabel="Navlonix"
    >
      Navlonix
    </Text>
  );
}

function MarkIcon({ markSize }: { markSize: number }) {
  return (
    <View style={styles.markWrap}>
      <NavlonixMonogram size={markSize} />
    </View>
  );
}

export function Logo({ variant = 'full', size = 'md', theme = 'dark', style }: LogoProps) {
  const dims = SIZE_MAP[size];
  const textColor = theme === 'light' ? LOGO_TEXT_LIGHT : LOGO_TEXT_DARK;

  if (variant === 'mark') {
    return (
      <View style={[styles.root, style]} accessibilityRole="image" accessibilityLabel="Navlonix">
        <MarkIcon markSize={dims.mark} />
      </View>
    );
  }

  if (variant === 'wordmark') {
    return (
      <View style={[styles.root, style]} accessibilityRole="image" accessibilityLabel="Navlonix">
        <Wordmark capSize={dims.cap} color={textColor} />
      </View>
    );
  }

  return (
    <View style={[styles.root, styles.lockup, { gap: dims.gap }, style]} accessibilityRole="image" accessibilityLabel="Navlonix">
      <MarkIcon markSize={dims.mark} />
      <Wordmark capSize={dims.cap} color={textColor} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lockup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  markWrap: {
    flexShrink: 0,
  },
  wordmark: {
    fontWeight: '700',
    letterSpacing: -1,
    lineHeight: undefined,
    includeFontPadding: false,
    textAlignVertical: 'center',
    transform: [{ translateY: 1 }],
  },
});
