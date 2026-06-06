import { ActivityIndicator, Platform, StyleSheet, Text, type ViewStyle } from 'react-native';
import { typography } from '../../theme/typography';
import { sizes } from '../../theme/sizes';
import { space } from '../../theme/spacing';
import { radius } from '../../theme/radius';
import { useRoleAccent } from '../../theme/useRoleAccent';
import { PressableScale } from './PressableScale';

type Props = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
};

export function PrimaryButton({ title, onPress, loading, disabled, style }: Props) {
  const accent = useRoleAccent();
  const off = disabled || loading;
  const btnShadow = Platform.select({
    ios: { shadowColor: accent.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 16 },
    android: { elevation: 8 },
    default: {},
  });
  return (
    <PressableScale
      onPress={onPress}
      disabled={off}
      style={[styles.btn, { backgroundColor: accent.accent }, btnShadow, off && styles.disabled, style]}
    >
      {loading ? (
        <ActivityIndicator color={accent.onAccent} size="small" />
      ) : (
        <Text
          style={[styles.text, { color: accent.onAccent }]}
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
    textAlign: 'center',
    maxWidth: '100%',
  },
});
