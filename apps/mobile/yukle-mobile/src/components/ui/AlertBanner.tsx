import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { palette } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { radius } from '../../theme/radius';
import { space } from '../../theme/spacing';
import { FadeInView } from './FadeInView';

type Tone = 'error' | 'success' | 'info';

const map: Record<Tone, { bg: string; border: string; color: string; icon: keyof typeof Ionicons.glyphMap }> = {
  error: { bg: palette.errorBg, border: palette.errorBorder, color: palette.error, icon: 'alert-circle-outline' },
  success: { bg: palette.successBg, border: palette.successBorder, color: palette.success, icon: 'checkmark-circle-outline' },
  info: { bg: palette.infoBg, border: palette.infoBorder, color: palette.info, icon: 'information-circle-outline' },
};

type Props = {
  message: string;
  tone: Tone;
};

export function AlertBanner({ message, tone }: Props) {
  const t = map[tone];
  return (
    <FadeInView style={[styles.box, { backgroundColor: t.bg, borderColor: t.border }]}>
      <Ionicons name={t.icon} size={18} color={t.color} />
      <Text style={[styles.text, { color: t.color }]}>{message}</Text>
    </FadeInView>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.sm + 4,
    padding: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: space.md,
  },
  text: {
    flex: 1,
    ...typography.bodySmall,
  },
});
