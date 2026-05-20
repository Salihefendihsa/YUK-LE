import { ActivityIndicator, Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';
import { palette } from '../../theme/colors';
import { fontFamily } from '../../theme/typography';
import { radius } from '../../theme/radius';
import { shadows } from '../../theme/shadows';

type Props = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
};

export function PrimaryButton({ title, onPress, loading, disabled, style }: Props) {
  const off = disabled || loading;
  return (
    <Pressable
      style={({ pressed }) => [
        styles.btn,
        shadows.brand,
        pressed && !off && styles.pressed,
        off && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={off}
    >
      {loading ? (
        <ActivityIndicator color={palette.onBrand} size="small" />
      ) : (
        <Text style={styles.text}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 52,
    borderRadius: radius.md,
    backgroundColor: palette.brand,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  pressed: {
    backgroundColor: palette.brandPress,
    transform: [{ scale: 0.98 }],
  },
  disabled: { opacity: 0.5 },
  text: {
    fontFamily: fontFamily.semiBold,
    fontSize: 15,
    color: palette.onBrand,
  },
});
