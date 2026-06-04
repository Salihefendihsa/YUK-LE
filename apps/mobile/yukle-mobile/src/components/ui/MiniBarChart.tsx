import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { palette } from '../../theme/colors';
import { fontFamily, typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

export type BarDatum = { label: string; value: number };

type Props = {
  data: BarDatum[];
  /** Bar alani yuksekligi (etiketler haric). */
  height?: number;
};

/** Hafif dikey bar grafik — react-native-svg ile, turuncu dolgu, responsive genislik. */
export function MiniBarChart({ data, height = 120 }: Props) {
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
            {data.map((d, i) => {
              const h = (d.value / max) * usableH;
              const barH = d.value > 0 ? Math.max(h, 3) : 0;
              const x = i * slot + (slot - barW) / 2;
              const y = height - barH;
              return (
                <Rect
                  key={i}
                  x={x}
                  y={y}
                  width={barW}
                  height={barH}
                  rx={4}
                  fill={palette.brand}
                  opacity={d.value > 0 ? 0.92 : 0}
                />
              );
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
    color: palette.brand,
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
