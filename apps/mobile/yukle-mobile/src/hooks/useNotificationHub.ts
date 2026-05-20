import { useEffect } from 'react';
import { useAuthStore } from '../store/auth.store';
import { useNotificationsStore } from '../store/notifications.store';

/** Rol layout'unda bir kez cagir: hub + unread sayaci. */
export function useNotificationHub() {
  const token = useAuthStore((s) => s.token);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const connectHub = useNotificationsStore((s) => s.connectHub);
  const disconnectHub = useNotificationsStore((s) => s.disconnectHub);
  const fetchUnread = useNotificationsStore((s) => s.fetchUnread);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      disconnectHub();
      return;
    }
    void fetchUnread();
    connectHub(token);
    return () => disconnectHub();
  }, [isAuthenticated, token, connectHub, disconnectHub, fetchUnread]);
}
