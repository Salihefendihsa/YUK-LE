import { Platform } from 'react-native';

const NATIVE_API_BASE = 'http://192.168.1.159:5151';
const WEB_API_BASE = 'http://localhost:5151';

/** API base: web uses localhost; native (Expo Go) uses LAN IP. */
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  (Platform.OS === 'web' ? WEB_API_BASE : NATIVE_API_BASE);

export const API_URL = `${API_BASE_URL}/api`;
