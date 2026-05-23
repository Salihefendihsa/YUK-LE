import Constants from 'expo-constants';
import { Platform } from 'react-native';

/** Android Google Maps — app.json içinde gerçek key girilene kadar placeholder */
export function getGoogleMapsApiKey(): string | undefined {
  const fromExpo =
    Constants.expoConfig?.android?.config?.googleMaps?.apiKey ??
    (Constants.expoConfig?.extra as { googleMapsApiKey?: string } | undefined)?.googleMapsApiKey;
  return typeof fromExpo === 'string' ? fromExpo : undefined;
}

export function isGoogleMapsKeyConfigured(): boolean {
  if (Platform.OS !== 'android') return true;
  const key = getGoogleMapsApiKey();
  if (!key || key.trim().length < 10) return false;
  const upper = key.toUpperCase();
  if (upper.includes('YOUR_') || upper.includes('PLACEHOLDER') || upper === 'REPLACE_ME') {
    return false;
  }
  return true;
}
