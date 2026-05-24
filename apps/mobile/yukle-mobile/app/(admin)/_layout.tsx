import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { screenRootStyle } from '../../src/constants/layout';
import { palette } from '../../src/theme/colors';
import { useNotificationHub } from '../../src/hooks/useNotificationHub';
import { useStoreHydration } from '../../src/hooks/useStoreHydration';
import { useAuthStore } from '../../src/store/auth.store';

export default function AdminLayout() {
  const hydrated = useStoreHydration();
  const { isAuthenticated, user } = useAuthStore();
  useNotificationHub();

  if (!hydrated) {
    return (
      <View style={[screenRootStyle, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={palette.brand} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/" />;
  }
  if (user?.role !== 'Admin') {
    return <Redirect href="/" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.bg } }}>
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
