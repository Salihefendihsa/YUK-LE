import { Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';
import { palette } from '../../theme/colors';
import { fontFamily, typography } from '../../theme/typography';
import { radius } from '../../theme/radius';
import { space } from '../../theme/spacing';
import { motion } from '../../theme/motion';

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
};

export function Chip({ label, selected, onPress, style }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipSelected,
        pressed && onPress && styles.chipPressed,
        style,
      ]}
    >
      <Text style={[styles.text, selected && styles.textSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.borderLight,
    backgroundColor: palette.surface,
  },
  chipSelected: {
    borderColor: palette.brandBorder,
    backgroundColor: palette.brandMuted,
  },
  chipPressed: {
    opacity: motion.press.opacity,
    transform: [{ scale: motion.press.scale }],
  },
  text: {
    ...typography.bodySmall,
    fontFamily: fontFamily.medium,
    color: palette.textSecondary,
  },
  textSelected: {
    color: palette.brand,
    fontFamily: fontFamily.semiBold,
  },
});
