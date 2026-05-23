import { Platform, type ViewStyle } from 'react-native';
import { Colors } from './colors';

export const screenRootStyle: ViewStyle = Platform.select({
  web: {
    flex: 1,
    minHeight: '100vh',
    width: '100%',
    backgroundColor: Colors.bgDark,
  },
  default: {
    flex: 1,
    backgroundColor: Colors.bgDark,
  },
}) as ViewStyle;

export { TAB_BAR_BASE_HEIGHT } from './safeArea';
export { useScreenInsets } from '../hooks/useScreenInsets';
export { useTabBarStyle } from '../hooks/useTabBarStyle';
export { ScreenContainer } from '../components/ScreenContainer';
export { ScreenScroll } from '../components/ScreenScroll';
