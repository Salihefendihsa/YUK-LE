import type { ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TAB_BAR_BASE_HEIGHT } from '../constants/safeArea';
import { spacing } from '../theme/spacing';

type Options = {
  /** Tab root screens: extra scroll padding for tab bar + home indicator */
  withTabBar?: boolean;
};

export function useScreenInsets(options?: Options) {
  const insets = useSafeAreaInsets();
  const withTabBar = options?.withTabBar ?? false;
  const tabBarTotal = withTabBar ? TAB_BAR_BASE_HEIGHT + insets.bottom : 0;
  const scrollBottom =
    (withTabBar ? spacing[8] : spacing[10]) + tabBarTotal + (withTabBar ? 0 : insets.bottom);

  const edgeStyle: ViewStyle = { paddingTop: insets.top };
  const contentInset: ViewStyle = { paddingBottom: scrollBottom };

  return {
    insets,
    edgeStyle,
    contentInset,
    scrollBottomPadding: scrollBottom,
  };
}
