import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const KEY = 'navlonix-onboarding-seen';

function getStorage() {
  if (Platform.OS === 'web') {
    return {
      async getItem(name: string) {
        if (typeof window === 'undefined') return null;
        return window.localStorage.getItem(name);
      },
      async setItem(name: string, value: string) {
        if (typeof window !== 'undefined') window.localStorage.setItem(name, value);
      },
    };
  }
  return {
    getItem: (name: string) => AsyncStorage.getItem(name),
    setItem: (name: string, value: string) => AsyncStorage.setItem(name, value),
  };
}

export async function hasSeenOnboarding(): Promise<boolean> {
  try {
    const v = await getStorage().getItem(KEY);
    return v === '1';
  } catch {
    return true;
  }
}

export async function markOnboardingSeen(): Promise<void> {
  try {
    await getStorage().setItem(KEY, '1');
  } catch {
    /* fail-open: do not block UX on storage errors */
  }
}
