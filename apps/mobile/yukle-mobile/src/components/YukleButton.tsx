import type { ViewStyle } from 'react-native';
import { PrimaryButton } from './ui/PrimaryButton';

interface Props {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

/** @deprecated Prefer PrimaryButton from ui kit */
export function YukleButton({ title, onPress, loading, disabled, style }: Props) {
  return (
    <PrimaryButton
      title={title}
      onPress={onPress}
      loading={loading}
      disabled={disabled}
      style={style}
    />
  );
}
