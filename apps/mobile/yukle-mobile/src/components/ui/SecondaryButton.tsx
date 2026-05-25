import { StyleSheet, Text, type ViewStyle } from 'react-native';
import { palette } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { radius } from '../../theme/radius';
import { space } from '../../theme/spacing';
import { sizes } from '../../theme/sizes';
import { PressableScale } from './PressableScale';

type Props = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
};

export function SecondaryButton({ title, onPress, disabled, style }: Props) {
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      style={[styles.btn, disabled && styles.disabled, style]}
    >
      <Text
        style={styles.text}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={sizes.button.labelMinScale}
      >
        {title}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  btn: {
    minHeight: sizes.button.secondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: sizes.button.paddingHorizontal,
    paddingVertical: space.sm,
    width: '100%',
    minWidth: 0,
    alignSelf: 'stretch',
  },
  disabled: { opacity: 0.45 },
  text: {
    ...typography.bodySmall,
    fontFamily: typography.bodyMedium.fontFamily,
    color: palette.text,
    textAlign: 'center',
    maxWidth: '100%',
  },
});
