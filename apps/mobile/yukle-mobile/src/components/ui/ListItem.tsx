import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { palette } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { space } from '../../theme/spacing';
import { sizes } from '../../theme/sizes';
import { motion } from '../../theme/motion';

type Props = {
  title: string;
  subtitle?: string;
  left?: ReactNode;
  onPress?: () => void;
  showChevron?: boolean;
  style?: ViewStyle;
};

export function ListItem({
  title,
  subtitle,
  left,
  onPress,
  showChevron = Boolean(onPress),
  style,
}: Props) {
  const content = (
    <>
      {left ? <View style={styles.left}>{left}</View> : null}
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {showChevron ? (
        <Ionicons name="chevron-forward" size={sizes.icon.sm} color={palette.textMuted} />
      ) : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.row, pressed && styles.pressed, style]}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={[styles.row, style]}>{content}</View>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.md,
    paddingHorizontal: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.borderSubtle,
  },
  pressed: { opacity: motion.press.opacity, backgroundColor: palette.brandMuted },
  left: { width: sizes.icon.lg, alignItems: 'center' },
  body: { flex: 1, gap: space.xs },
  title: typography.bodyMedium,
  subtitle: typography.bodySmall,
});
