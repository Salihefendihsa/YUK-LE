import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Sabit LAN IP yok — geliştirici .env / EXPO_PUBLIC_API_BASE_URL ile kendi makinasını belirler.
// README.md > "Geliştirme Kurulumu" maddesine bak.
const WEB_API_BASE = 'http://localhost:5151';
// Android emulator host loopback (10.0.2.2 → host'un localhost'u). LAN IP değil.
const ANDROID_EMULATOR_API_BASE = 'http://10.0.2.2:5151';
// iOS Simulator için localhost host ile aynı.
const IOS_SIMULATOR_API_BASE = 'http://localhost:5151';

const ENV_API = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
const EXTRA_API =
  typeof Constants.expoConfig?.extra?.apiBaseUrl === 'string'
    ? Constants.expoConfig.extra.apiBaseUrl.trim()
    : undefined;

function platformFallback(): string {
  if (Platform.OS === 'android') return ANDROID_EMULATOR_API_BASE;
  if (Platform.OS === 'ios') return IOS_SIMULATOR_API_BASE;
  return WEB_API_BASE;
}

function pickBaseUrl(): string {
  // Web: localhost (apps/web ile aynı, CORS + LAN IP sorunu yok)
  if (Platform.OS === 'web') return WEB_API_BASE.replace(/\/$/, '');
  if (ENV_API) return ENV_API.replace(/\/$/, '');
  if (EXTRA_API) return EXTRA_API.replace(/\/$/, '');
  // Native fallback: emulator/simulator için doğru loopback adresi.
  // Gerçek cihaz için .env'de EXPO_PUBLIC_API_BASE_URL=http://<LAN-IP>:5151 set edilmeli.
  if (__DEV__) {
    console.warn(
      '[Navlonix API] EXPO_PUBLIC_API_BASE_URL set edilmemiş. ' +
        'Gerçek cihazda LAN IP gerekiyor — README.md > Geliştirme Kurulumu.'
    );
  }
  return platformFallback().replace(/\/$/, '');
}

/** API base: önce EXPO_PUBLIC_API_BASE_URL (.env), sonra app.config extra, sonra fallback. */
export const API_BASE_URL = pickBaseUrl();

export const API_URL = `${API_BASE_URL}/api`;

export type ApiUrlSource = 'env' | 'extra' | 'fallback';

export function getApiUrlSource(): ApiUrlSource {
  if (ENV_API) return 'env';
  if (EXTRA_API) return 'extra';
  return 'fallback';
}

/** Metro / Expo Go logunda hangi adresin kullanıldığını görmek için. */
export function logResolvedApiBase(): void {
  if (!__DEV__) return;
  console.log('[Navlonix API]', {
    API_BASE_URL,
    API_URL,
    source: getApiUrlSource(),
    EXPO_PUBLIC_API_BASE_URL: ENV_API ?? '(undefined)',
    extraApiBaseUrl: EXTRA_API ?? '(undefined)',
    platform: Platform.OS,
  });
}

if (__DEV__) {
  logResolvedApiBase();
}
