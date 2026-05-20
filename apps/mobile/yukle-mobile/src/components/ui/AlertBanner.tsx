import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { palette } from '../../theme/colors';
import { fontFamily } from '../../theme/typography';
import { radius } from '../../theme/radius';
import { spacing } from '../../theme/spacing';

type Tone = 'error' | 'success' | 'info';

const map: Record<Tone, { bg: string; border: string; color: string; icon: keyof typeof Ionicons.glyphMap }> = {
  error: { bg: palette.errorBg, border: palette.errorBorder, color: palette.error, icon: 'alert-circle-outline' },
  success: { bg: palette.successBg, border: palette.successBorder, color: palette.success, icon: 'checkmark-circle-outline' },
  info: { bg: palette.infoBg, border: 'rgba(59,130,246,0.35)', color: palette.info, icon: 'information-circle-outline' },
};

type Props = {
  message: string;
  tone: Tone;
};

export function AlertBanner({ message, tone }: Props) {
  const t = map[tone];
  return (
    <View style={[styles.box, { backgroundColor: t.bg, borderColor: t.border }]}>
      <Ionicons name={t.icon} size={18} color={t.color} />
      <Text style={[styles.text, { color: t.color }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
    padding: spacing[3],
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing[4],
  },
  text: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: 13,
    lineHeight: 18,
  },
});
