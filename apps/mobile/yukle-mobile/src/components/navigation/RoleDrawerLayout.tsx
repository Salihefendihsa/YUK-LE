import { Drawer } from 'expo-router/drawer';
import { Dimensions, Platform } from 'react-native';
import type { AppRole } from '../../navigation/drawerMenus';
import { palette } from '../../theme/colors';
import { ScreenBackground } from '../ui/ScreenBackground';
import { AppDrawerContent } from './AppDrawerContent';

const { width: screenWidth } = Dimensions.get('window');

type Props = {
  role: AppRole;
};

export function RoleDrawerLayout({ role }: Props) {
  // Rol bazlı radial spotlight (web app-shell-theme ile aynı: customer turuncu/mavi,
  // driver turuncu/mor, admin kırmızı/sarı) tüm grup ekranlarının arkasında merkezi
  // olarak boyanır; sahneler saydam, böylece her ekran ambient ışımayı miras alır.
  return (
    <ScreenBackground role={role}>
      <Drawer
        drawerContent={(props) => <AppDrawerContent {...props} role={role} />}
        screenOptions={{
          headerShown: false,
          drawerPosition: 'left',
          drawerType: Platform.select({ web: 'front', default: 'slide' }),
          drawerStyle: {
            width: Math.min(300, screenWidth * 0.86),
            backgroundColor: palette.bgElevated,
          },
          overlayColor: palette.overlay,
          swipeEnabled: true,
          sceneStyle: { backgroundColor: 'transparent' },
        }}
      />
    </ScreenBackground>
  );
}
