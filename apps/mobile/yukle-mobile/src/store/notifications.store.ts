import type * as signalR from '@microsoft/signalr';
import { create } from 'zustand';
import { createNotificationConnection } from '../services/notificationHub';
import {
  getUnreadCount,
  normalizeHubNotification,
} from '../services/notifications.service';
import type { NotificationRow } from '../types/notification';

type NotificationsState = {
  unreadCount: number;
  hubConnected: boolean;
  /** SignalR bağlantı hatası (kullanıcıya nazik uyarı) */
  hubError: string | null;
  /** Her canli push'ta artar; bildirim ekrani dinler. */
  liveTick: number;
  liveItem: NotificationRow | null;
  fetchUnread: () => Promise<void>;
  setUnread: (n: number) => void;
  connectHub: (token: string) => void;
  disconnectHub: () => void;
  applyMarkRead: () => void;
  applyReadAll: () => void;
  clearHubError: () => void;
};

let connection: signalR.HubConnection | null = null;

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  unreadCount: 0,
  hubConnected: false,
  hubError: null,
  liveTick: 0,
  liveItem: null,

  fetchUnread: async () => {
    try {
      const count = await getUnreadCount();
      set({ unreadCount: count });
    } catch {
      /* okunmamis sayisi kritik degil */
    }
  },

  clearHubError: () => set({ hubError: null }),

  setUnread: (n) => set({ unreadCount: Math.max(0, n) }),

  connectHub: (token) => {
    if (connection) {
      void connection.stop();
      connection = null;
    }

    const conn = createNotificationConnection(token);
    connection = conn;

    conn.on('ReceiveNotification', (payload: unknown) => {
      const row = normalizeHubNotification(payload);
      if (!row.id) return;
      set((s) => ({
        unreadCount: s.unreadCount + 1,
        liveItem: row,
        liveTick: s.liveTick + 1,
      }));
    });

    conn.onreconnected(() => set({ hubConnected: true, hubError: null }));
    conn.onclose(() => set({ hubConnected: false }));

    void (async () => {
      try {
        await conn.start();
        set({ hubConnected: true, hubError: null });
      } catch {
        set({
          hubConnected: false,
          hubError:
            'Canlı bildirimler şu an bağlanamıyor. Uygulama çalışmaya devam eder; bildirim listesini yenileyebilirsiniz.',
        });
      }
    })();
  },

  disconnectHub: () => {
    if (connection) {
      void connection.stop();
      connection = null;
    }
    set({ hubConnected: false, hubError: null });
  },

  applyMarkRead: () => {
    set((s) => ({ unreadCount: Math.max(0, s.unreadCount - 1) }));
  },

  applyReadAll: () => set({ unreadCount: 0 }),
}));
