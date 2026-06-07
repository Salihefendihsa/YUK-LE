import { ActivityIndicator, Platform, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
  // Gradient-dolu rollerde (admin) gölge en koyu tonla yumuşar; aksi halde düz accent.
  const shadowColor = accent.buttonFill ? accent.buttonFill[1] : accent.accent;
  const btnShadow = Platform.select({
    ios: { shadowColor, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.32, shadowRadius: 16 },
    android: { elevation: 8 },
    default: {},
  });

  const label = loading ? (
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
  );

  // Geniş dolu buton yüzeyi: degrade tanımlıysa (admin) derin/az doygun degrade,
  // değilse düz accent. Accent'in kendisi (ikon/rozet/link) parlak kalır.
  if (accent.buttonFill) {
    return (
      <PressableScale
        onPress={onPress}
        disabled={off}
        style={[styles.btn, styles.gradientBtn, btnShadow, off && styles.disabled, style]}
      >
        <LinearGradient
          colors={accent.buttonFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={styles.content}>{label}</View>
      </PressableScale>
    );
  }

  return (
    <PressableScale
      onPress={onPress}
      disabled={off}
      style={[styles.btn, { backgroundColor: accent.accent }, btnShadow, off && styles.disabled, style]}
    >
      {label}
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
  gradientBtn: {
    overflow: 'hidden',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  disabled: { opacity: 0.5 },
  text: {
    ...typography.bodyMedium,
    textAlign: 'center',
    maxWidth: '100%',
  },
});
