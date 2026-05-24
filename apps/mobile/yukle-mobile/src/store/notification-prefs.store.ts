import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type NotificationPrefs = {
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
};

type NotificationPrefsState = NotificationPrefs & {
  setPushEnabled: (v: boolean) => void;
  setEmailEnabled: (v: boolean) => void;
  setSmsEnabled: (v: boolean) => void;
};

const defaults: NotificationPrefs = {
  pushEnabled: true,
  emailEnabled: true,
  smsEnabled: false,
};

export const useNotificationPrefsStore = create<NotificationPrefsState>()(
  persist(
    (set) => ({
      ...defaults,
      setPushEnabled: (pushEnabled) => set({ pushEnabled }),
      setEmailEnabled: (emailEnabled) => set({ emailEnabled }),
      setSmsEnabled: (smsEnabled) => set({ smsEnabled }),
    }),
    {
      name: 'yukle-notification-prefs',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
