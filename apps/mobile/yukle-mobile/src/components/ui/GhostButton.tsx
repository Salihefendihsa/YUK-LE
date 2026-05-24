import { StyleSheet, Text, type ViewStyle } from 'react-native';
import { palette } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { radius } from '../../theme/radius';
import { sizes } from '../../theme/sizes';
import { PressableScale } from './PressableScale';

type Props = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
};

export function GhostButton({ title, onPress, disabled, style }: Props) {
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      style={[styles.btn, disabled && styles.disabled, style]}
    >
      <Text style={styles.text}>{title}</Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: sizes.button.compact,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: sizes.hitSlop * 2,
  },
  disabled: { opacity: 0.45 },
  text: {
    ...typography.link,
    color: palette.gold,
  },
});
