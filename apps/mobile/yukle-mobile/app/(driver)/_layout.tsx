import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { Colors } from '../../src/constants/colors';
import { screenRootStyle } from '../../src/constants/layout';
import { useNotificationHub } from '../../src/hooks/useNotificationHub';
import { useStoreHydration } from '../../src/hooks/useStoreHydration';
import { useAuthStore } from '../../src/store/auth.store';

export default function DriverLayout() {
  const hydrated = useStoreHydration();
  const { isAuthenticated, user } = useAuthStore();
  useNotificationHub();

  if (!hydrated) {
    return (
      <View style={[screenRootStyle, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/" />;
  }
  if (user?.role !== 'Driver') {
    return <Redirect href="/" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.bgDark } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="load-detail" />
      <Stack.Screen name="documents" options={{ presentation: 'modal' }} />
      <Stack.Screen name="history" />
      <Stack.Screen name="bids" />
    </Stack>
  );
}
