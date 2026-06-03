import Constants from 'expo-constants';
import { Platform } from 'react-native';

const NATIVE_API_BASE = 'http://10.192.149.18:5151';
const WEB_API_BASE = 'http://localhost:5151';

const ENV_API = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
const EXTRA_API =
  typeof Constants.expoConfig?.extra?.apiBaseUrl === 'string'
    ? Constants.expoConfig.extra.apiBaseUrl.trim()
    : undefined;

function pickBaseUrl(): string {
  // Expo web (localhost:808x) — apps/web ile aynı: localhost:5151 (CORS + LAN IP sorunu yok)
  if (Platform.OS === 'web') {
    return WEB_API_BASE.replace(/\/$/, '');
  }
  if (ENV_API) return ENV_API.replace(/\/$/, '');
  if (EXTRA_API) return EXTRA_API.replace(/\/$/, '');
  return NATIVE_API_BASE.replace(/\/$/, '');
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
