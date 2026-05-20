import { Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';
import { palette } from '../../theme/colors';
import { fontFamily } from '../../theme/typography';
import { radius } from '../../theme/radius';

type Props = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
};

export function SecondaryButton({ title, onPress, disabled, style }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.btn,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.text}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  pressed: {
    backgroundColor: palette.brandMuted,
    borderColor: palette.brandBorder,
  },
  disabled: { opacity: 0.45 },
  text: {
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    color: palette.text,
  },
});
