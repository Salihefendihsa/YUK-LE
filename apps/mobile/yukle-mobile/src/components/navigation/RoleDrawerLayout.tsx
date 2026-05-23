import { Drawer } from 'expo-router/drawer';
import { Dimensions, Platform } from 'react-native';
import type { AppRole } from '../../navigation/drawerMenus';
import { palette } from '../../theme/colors';
import { AppDrawerContent } from './AppDrawerContent';

const { width: screenWidth } = Dimensions.get('window');

type Props = {
  role: AppRole;
};

export function RoleDrawerLayout({ role }: Props) {
  return (
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
        sceneStyle: { backgroundColor: palette.bg },
      }}
    />
  );
}
