import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { palette } from '../../theme/colors';
import { fontFamily, typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

export type BarDatum = { label: string; value: number };

type Props = {
  data: BarDatum[];
  /** Bar alani yuksekligi (etiketler haric). */
  height?: number;
  /** Çubuk degrade üst rengi (rol aksanı). Varsayılan: mockup turuncusu. */
  colorTop?: string;
  /** Çubuk degrade alt rengi (rol aksanı). Varsayılan: mockup koyu turuncu. */
  colorBottom?: string;
};

/** Yalnız ÜST köşeleri yuvarlatılmış dikdörtgen path'i (taban düz, eksene oturur). */
function topRoundedBar(x: number, y: number, w: number, h: number, r: number): string {
  const rad = Math.max(0, Math.min(r, w / 2, h));
  return `M${x},${y + h} L${x},${y + rad} Q${x},${y} ${x + rad},${y} L${x + w - rad},${y} Q${x + w},${y} ${x + w},${y + rad} L${x + w},${y + h} Z`;
}

/** Hafif dikey bar grafik — react-native-svg ile, rol-renkli degrade dolgu, üst köşe yuvarlak. */
export function MiniBarChart({ data, height = 120, colorTop = '#FF8A33', colorBottom = '#B34A00' }: Props) {
  const [width, setWidth] = useState(0);

  if (data.length === 0) {
    return <Text style={styles.empty}>Gösterilecek veri yok</Text>;
  }

  const max = Math.max(...data.map((d) => d.value), 1);
  const n = data.length;
  const slot = width / n;
  const barW = Math.max(8, slot * 0.46);
  const usableH = height - 6;

  return (
    <View>
      <View style={{ height }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {width > 0 ? (
          <Svg width={width} height={height}>
            <Defs>
              <LinearGradient id="barFill" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={colorTop} stopOpacity={1} />
                <Stop offset="1" stopColor={colorBottom} stopOpacity={1} />
              </LinearGradient>
            </Defs>
            {data.map((d, i) => {
              const h = (d.value / max) * usableH;
              const barH = d.value > 0 ? Math.max(h, 3) : 0;
              const x = i * slot + (slot - barW) / 2;
              const y = height - barH;
              if (barH <= 0) return null;
              return <Path key={i} d={topRoundedBar(x, y, barW, barH, 5)} fill="url(#barFill)" />;
            })}
          </Svg>
        ) : null}
      </View>
      <View style={styles.labelsRow}>
        {data.map((d, i) => (
          <View key={i} style={styles.labelCol}>
            <Text style={styles.value} numberOfLines={1}>
              {d.value}
            </Text>
            <Text style={styles.label} numberOfLines={1}>
              {d.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  labelsRow: { flexDirection: 'row', marginTop: spacing[2] },
  labelCol: { flex: 1, alignItems: 'center', gap: 2 },
  value: {
    fontFamily: fontFamily.bold,
    fontSize: 12,
    color: palette.text,
  },
  label: {
    ...typography.caption,
    textTransform: 'none',
    fontSize: 11,
    color: palette.textMuted,
  },
  empty: {
    ...typography.caption,
    textTransform: 'none',
    color: palette.textMuted,
    paddingVertical: spacing[3],
  },
});
