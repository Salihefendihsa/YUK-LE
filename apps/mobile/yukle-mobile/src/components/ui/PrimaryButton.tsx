import { ActivityIndicator, StyleSheet, Text, type ViewStyle } from 'react-native';
import { palette } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { sizes } from '../../theme/sizes';
import { shadows } from '../../theme/shadows';
import { radius } from '../../theme/radius';
import { PressableScale } from './PressableScale';

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
    <PressableScale
      onPress={onPress}
      disabled={off}
      style={[styles.btn, shadows.brand, off && styles.disabled, style]}
    >
      {loading ? (
        <ActivityIndicator color={palette.onBrand} size="small" />
      ) : (
        <Text style={styles.text}>{title}</Text>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: sizes.button.primary,
    borderRadius: radius.md,
    backgroundColor: palette.brand,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  disabled: { opacity: 0.5 },
  text: {
    ...typography.bodyMedium,
    color: palette.onBrand,
  },
});
