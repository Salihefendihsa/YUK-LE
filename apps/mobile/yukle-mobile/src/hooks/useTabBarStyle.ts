import type { ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TAB_BAR_BASE_HEIGHT } from '../constants/safeArea';
import { palette } from '../theme/colors';

export function useTabBarStyle(): ViewStyle {
  const insets = useSafeAreaInsets();
  return {
    backgroundColor: palette.surface,
    borderTopColor: palette.borderSubtle,
    borderTopWidth: 1,
    height: TAB_BAR_BASE_HEIGHT + insets.bottom,
    paddingBottom: Math.max(insets.bottom, 8),
    paddingTop: 6,
  };
}
