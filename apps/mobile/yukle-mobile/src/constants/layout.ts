import { Platform, type ViewStyle } from 'react-native';

/**
 * Ekran kökü saydam — arkadaki katman (root Stack contentStyle = palette.bg veya
 * rol bazlı ScreenBackground spotlight) görünsün. Düz koyu zemin her durumda
 * root navigator tarafından boyanır, dolayısıyla saydamlık güvenli.
 */
export const screenRootStyle: ViewStyle = Platform.select({
  web: {
    flex: 1,
    minHeight: '100vh',
    width: '100%',
    backgroundColor: 'transparent',
  },
  default: {
    flex: 1,
    backgroundColor: 'transparent',
  },
}) as ViewStyle;

export { TAB_BAR_BASE_HEIGHT } from './safeArea';
export { useScreenInsets } from '../hooks/useScreenInsets';
export { useTabBarStyle } from '../hooks/useTabBarStyle';
export { ScreenContainer } from '../components/ScreenContainer';
export { ScreenScroll } from '../components/ScreenScroll';
