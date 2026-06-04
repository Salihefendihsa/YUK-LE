import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

/**
 * Premium ambient arka plan — koyu taban (#0A0A0A) üzerine sıcak turuncu radial ışıma.
 * Web AppLayout'taki radial-gradient hissini tek katmanda, performans dostu taklit eder.
 * Tek SVG (2 rect): opak taban + üst-sağ turuncu glow. Ekranı bununla sarın, içerik üstte.
 */
const BASE = '#0A0A0A';
const GLOW = '#FF7A1A';

type Props = {
  children: ReactNode;
  /** 'subtle' daha sönük, 'normal' standart ışıma. */
  intensity?: 'subtle' | 'normal';
  style?: StyleProp<ViewStyle>;
};

export function ScreenBackground({ children, intensity = 'normal', style }: Props) {
  const peak = intensity === 'subtle' ? 0.1 : 0.16;
  return (
    <View style={[styles.root, style]}>
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" pointerEvents="none">
        <Defs>
          {/* objectBoundingBox: r ekran en/boy oranına göre elips gibi yayılır */}
          <RadialGradient id="amb" cx="0.82" cy="-0.05" r="0.9">
            <Stop offset="0" stopColor={GLOW} stopOpacity={peak} />
            <Stop offset="0.5" stopColor={GLOW} stopOpacity={peak * 0.35} />
            <Stop offset="1" stopColor={GLOW} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={BASE} />
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#amb)" />
      </Svg>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BASE },
  content: { flex: 1 },
});
