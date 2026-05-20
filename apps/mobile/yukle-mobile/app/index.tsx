import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { Colors } from '../src/constants/colors';
import { screenRootStyle } from '../src/constants/layout';
import { useStoreHydration } from '../src/hooks/useStoreHydration';
import { LoginScreen } from '../src/screens/LoginScreen';
import { useAuthStore } from '../src/store/auth.store';

export default function Index() {
  const hydrated = useStoreHydration();
  const { isAuthenticated, user } = useAuthStore();

  if (!hydrated) {
    return (
      <View style={[screenRootStyle, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  if (isAuthenticated && user) {
    if (user.role === 'Customer') {
      return <Redirect href="/(customer)/(tabs)/dashboard" />;
    }
    if (user.role === 'Driver') {
      return <Redirect href="/(driver)/(tabs)/dashboard" />;
    }
    if (user.role === 'Admin') {
      return <Redirect href="/(admin)/(tabs)/dashboard" />;
    }
  }

  return <LoginScreen />;
}
