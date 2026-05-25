import { ActivityIndicator, StyleSheet, Text, type ViewStyle } from 'react-native';
import { palette } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { sizes } from '../../theme/sizes';
import { space } from '../../theme/spacing';
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
        <Text
          style={styles.text}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={sizes.button.labelMinScale}
        >
          {title}
        </Text>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  btn: {
    minHeight: sizes.button.primary,
    borderRadius: radius.md,
    backgroundColor: palette.brand,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: sizes.button.paddingHorizontal,
    paddingVertical: space.sm,
    width: '100%',
    minWidth: 0,
    alignSelf: 'stretch',
  },
  disabled: { opacity: 0.5 },
  text: {
    ...typography.bodyMedium,
    color: palette.onBrand,
    textAlign: 'center',
    maxWidth: '100%',
  },
});
