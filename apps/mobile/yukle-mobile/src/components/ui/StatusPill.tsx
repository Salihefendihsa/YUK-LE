import { StyleSheet, Text, View } from 'react-native';
import { palette } from '../../theme/colors';
import { fontFamily } from '../../theme/typography';
import { radius } from '../../theme/radius';
import { spacing } from '../../theme/spacing';

export type StatusTone = 'success' | 'warning' | 'error' | 'info' | 'brand' | 'neutral';

type Tone = StatusTone;

const toneStyles: Record<Tone, { bg: string; border: string; text: string }> = {
  success: { bg: palette.successBg, border: palette.successBorder, text: palette.success },
  warning: { bg: palette.warningBg, border: palette.goldBorder, text: palette.gold },
  error: { bg: palette.errorBg, border: palette.errorBorder, text: palette.error },
  info: { bg: palette.infoBg, border: 'rgba(59,130,246,0.35)', text: palette.info },
  brand: { bg: palette.brandMuted, border: palette.brandBorder, text: palette.brand },
  neutral: { bg: palette.surface, border: palette.borderLight, text: palette.textSecondary },
};

type Props = {
  label: string;
  tone?: Tone;
};

export function StatusPill({ label, tone = 'neutral' }: Props) {
  const t = toneStyles[tone];
  return (
    <View style={[styles.pill, { backgroundColor: t.bg, borderColor: t.border }]}>
      <Text style={[styles.text, { color: t.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radius.full,
    borderWidth: 1,
  },
  text: {
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
  },
});
