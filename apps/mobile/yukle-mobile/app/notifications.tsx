import { Redirect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../src/constants/colors';
import { screenRootStyle } from '../src/constants/layout';
import { getApiErrorMessage } from '../src/services/api.client';
import {
  getNotifications,
  markNotificationRead,
  readAllNotifications,
} from '../src/services/notifications.service';
import { useAuthStore } from '../src/store/auth.store';
import { useNotificationsStore } from '../src/store/notifications.store';
import type { NotificationRow } from '../src/types/notification';
import { formatDateTimeTR } from '../src/utils/format';

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const liveTick = useNotificationsStore((s) => s.liveTick);
  const liveItem = useNotificationsStore((s) => s.liveItem);
  const fetchUnread = useNotificationsStore((s) => s.fetchUnread);
  const setUnread = useNotificationsStore((s) => s.setUnread);
  const applyMarkRead = useNotificationsStore((s) => s.applyMarkRead);
  const applyReadAll = useNotificationsStore((s) => s.applyReadAll);
  const hubError = useNotificationsStore((s) => s.hubError);

  const [items, setItems] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyAll, setBusyAll] = useState(false);
  const [error, setError] = useState('');

  const fetchList = useCallback(async () => {
    try {
      setError('');
      const data = await getNotifications({ page: 1, pageSize: 50 });
      setItems(data.items);
      await fetchUnread();
    } catch (e) {
      setError(getApiErrorMessage(e));
      setItems([]);
    }
  }, [fetchUnread]);

  useEffect(() => {
    fetchList().finally(() => setLoading(false));
  }, [fetchList]);

  useEffect(() => {
    if (!liveItem?.id) return;
    setItems((prev) => {
      if (prev.some((n) => n.id === liveItem.id)) return prev;
      return [liveItem, ...prev];
    });
  }, [liveTick, liveItem]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchList();
    setRefreshing(false);
  };

  const onMarkRead = async (row: NotificationRow) => {
    if (row.isRead) return;
    try {
      await markNotificationRead(row.id);
      applyMarkRead();
      setItems((prev) =>
        prev.map((n) => (n.id === row.id ? { ...n, isRead: true } : n))
      );
      await fetchUnread();
    } catch (e) {
      setError(getApiErrorMessage(e));
    }
  };

  const onReadAll = async () => {
    setBusyAll(true);
    setError('');
    try {
      await readAllNotifications();
      applyReadAll();
      setUnread(0);
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setBusyAll(false);
    }
  };

  if (!isAuthenticated) {
    return <Redirect href="/" />;
  }

  if (loading) {
    return (
      <View style={[screenRootStyle, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={[screenRootStyle, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>← Geri</Text>
        </Pressable>
        <Pressable style={styles.readAllBtn} onPress={() => void onReadAll()} disabled={busyAll}>
          <Text style={styles.readAllText}>{busyAll ? '...' : 'Tumunu okundu yap'}</Text>
        </Pressable>
      </View>

      <Text style={styles.title}>Bildirimler</Text>

      {hubError ? (
        <View style={styles.hubBox}>
          <Text style={styles.hubText}>{hubError}</Text>
        </View>
      ) : null}

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>Bildirim yok.</Text>
        }
        renderItem={({ item }) => (
          <Pressable
            style={[styles.card, !item.isRead && styles.cardUnread]}
            onPress={() => void onMarkRead(item)}
          >
            <View style={styles.cardHead}>
              <Text style={styles.cardTitle}>{item.title || 'Bildirim'}</Text>
              {!item.isRead ? <View style={styles.dot} /> : null}
            </View>
            <Text style={styles.cardMsg}>{item.message}</Text>
            <Text style={styles.cardTime}>{formatDateTimeTR(item.createdAt)}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  back: { color: Colors.primary, fontSize: 15, fontWeight: '600' },
  readAllBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primaryGold,
  },
  readAllText: { color: Colors.primaryGold, fontSize: 12, fontWeight: '600' },
  title: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  list: { padding: 16, paddingBottom: 40, gap: 10 },
  empty: { color: Colors.textMuted, textAlign: 'center', marginTop: 40 },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    gap: 6,
    marginBottom: 10,
  },
  cardUnread: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(255,107,0,0.08)',
  },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700', flex: 1 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  cardMsg: { color: Colors.textSecondary, fontSize: 14, lineHeight: 20 },
  cardTime: { color: Colors.textMuted, fontSize: 12 },
  hubBox: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(59,130,246,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.35)',
  },
  hubText: { color: Colors.textSecondary, fontSize: 13, lineHeight: 18 },
  errorBox: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(239,68,68,0.12)',
  },
  errorText: { color: '#fca5a5', fontSize: 13 },
});
