import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { palette } from '../../theme/colors';

/**
 * Premium ambient arka plan — web AppLayout'taki rol bazlı radial spotlight hissini
 * RN/SVG ile taklit eder. Koyu taban (palette.bg) + iki radial ışıma:
 *   • üst-sağ birincil aksан (brand/role)  • alt-sol ikincil aksan (role)
 *
 * Web referansı (app-shell-theme.css):
 *   customer → turuncu + mavi · driver → turuncu + mor · admin → kırmızı + sarı
 * Ekranı bununla sarın, içerik üstte render edilir.
 */
type Role = 'customer' | 'driver' | 'admin';

type Glow = { color: string; peak: number };

const ROLE_GLOWS: Record<Role, { top: Glow; bottom: Glow }> = {
  customer: {
    top: { color: '#FF6B00', peak: 0.12 },
    bottom: { color: '#4A6CF7', peak: 0.08 },
  },
  driver: {
    top: { color: '#FF6B00', peak: 0.12 },
    bottom: { color: '#8B5CF6', peak: 0.12 },
  },
  admin: {
    top: { color: '#EF4444', peak: 0.14 },
    bottom: { color: '#F59E0B', peak: 0.08 },
  },
};

type Props = {
  children: ReactNode;
  /** Rol bazlı spotlight rengi. Varsayılan: customer (turuncu/mavi). */
  role?: Role;
  /** 'subtle' daha sönük, 'normal' standart ışıma. */
  intensity?: 'subtle' | 'normal';
  style?: StyleProp<ViewStyle>;
};

export function ScreenBackground({ children, role = 'customer', intensity = 'normal', style }: Props) {
  const scale = intensity === 'subtle' ? 0.62 : 1;
  const { top, bottom } = ROLE_GLOWS[role];
  const topPeak = top.peak * scale;
  const bottomPeak = bottom.peak * scale;

  return (
    <View style={[styles.root, style]}>
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" pointerEvents="none">
        <Defs>
          {/* üst-sağ birincil glow */}
          <RadialGradient id="ambTop" cx="0.85" cy="-0.05" r="0.95">
            <Stop offset="0" stopColor={top.color} stopOpacity={topPeak} />
            <Stop offset="0.5" stopColor={top.color} stopOpacity={topPeak * 0.35} />
            <Stop offset="1" stopColor={top.color} stopOpacity={0} />
          </RadialGradient>
          {/* alt-sol ikincil glow */}
          <RadialGradient id="ambBottom" cx="0.08" cy="1.05" r="0.85">
            <Stop offset="0" stopColor={bottom.color} stopOpacity={bottomPeak} />
            <Stop offset="0.55" stopColor={bottom.color} stopOpacity={bottomPeak * 0.3} />
            <Stop offset="1" stopColor={bottom.color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={palette.bg} />
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#ambTop)" />
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#ambBottom)" />
      </Svg>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bg },
  content: { flex: 1 },
});
