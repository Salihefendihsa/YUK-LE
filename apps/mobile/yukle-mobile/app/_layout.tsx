import 'react-native-gesture-handler';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { Sora_400Regular, Sora_600SemiBold, Sora_700Bold } from '@expo-google-fonts/sora';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Text, TextInput, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { logResolvedApiBase } from '../src/constants/api';
import { screenRootStyle } from '../src/constants/layout';
import { palette } from '../src/theme/colors';
import { fontFamily } from '../src/theme/typography';

const FONT_LOAD_TIMEOUT_MS = Platform.OS === 'web' ? 2500 : 8000;

function applyDefaultFont() {
  if (Platform.OS === 'web') return;
  const base = { fontFamily: fontFamily.regular };
  const merge = (prev: object | undefined) => [prev, base];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const T = Text as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const TI = TextInput as any;
  T.defaultProps = { ...(T.defaultProps ?? {}), style: merge(T.defaultProps?.style) };
  TI.defaultProps = { ...(TI.defaultProps ?? {}), style: merge(TI.defaultProps?.style) };
}

export default function RootLayout() {
  const [ready, setReady] = useState(Platform.OS === 'web');
  const [loaded, error] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    Sora_400Regular,
    Sora_600SemiBold,
    Sora_700Bold,
  });

  useEffect(() => {
    if (loaded) {
      applyDefaultFont();
      logResolvedApiBase();
      setReady(true);
    }
  }, [loaded]);

  useEffect(() => {
    if (error) {
      console.warn('[fonts] Plus Jakarta yuklenemedi, sistem fontu kullanilacak:', error);
      logResolvedApiBase();
      setReady(true);
    }
  }, [error]);

  useEffect(() => {
    if (ready) return;
    const timer = setTimeout(() => {
      console.warn('[fonts] Zaman asimi — uygulama sistem fontu ile aciliyor');
      setReady(true);
    }, FONT_LOAD_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [ready]);

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={palette.brand} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider style={[screenRootStyle, { backgroundColor: palette.bg }]}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: palette.bg, flex: 1 },
          }}
        />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
