import { Redirect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlertBanner } from '../src/components/ui/AlertBanner';
import { EmptyState } from '../src/components/ui/EmptyState';
import { FadeInView } from '../src/components/ui/FadeInView';
import { GhostButton } from '../src/components/ui/GhostButton';
import { LoadingState } from '../src/components/ui/LoadingState';
import { PressableScale } from '../src/components/ui/PressableScale';
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
import { palette } from '../src/theme/colors';
import { fontFamily, typography } from '../src/theme/typography';
import { shadows } from '../src/theme/shadows';
import { space, spacing } from '../src/theme/spacing';
import { radius } from '../src/theme/radius';
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
        <LoadingState message="Bildirimler yükleniyor..." variant="skeleton" />
      </View>
    );
  }

  return (
    <View style={[screenRootStyle, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <GhostButton title="← Geri" onPress={() => router.back()} />
        <PressableScale style={styles.readAllBtn} onPress={() => void onReadAll()} disabled={busyAll}>
          <Text style={styles.readAllText}>{busyAll ? '...' : 'Tümünü okundu yap'}</Text>
        </PressableScale>
      </View>

      <Text style={styles.title}>Bildirimler</Text>

      {hubError ? <AlertBanner message={hubError} tone="info" /> : null}
      {error ? <AlertBanner message={error} tone="error" /> : null}

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.brand} />
        }
        ListEmptyComponent={
          <EmptyState icon="🔔" title="Bildirim yok" description="Yeni bildirimler burada görünecek." />
        }
        renderItem={({ item, index }) => (
          <FadeInView delay={Math.min(index * 35, 175)}>
            <PressableScale
              style={styles.card}
              onPress={() => void onMarkRead(item)}
            >
              <View style={styles.cardHead}>
                <Text style={styles.cardTitle}>{item.title || 'Bildirim'}</Text>
                {!item.isRead ? <View style={styles.dot} /> : null}
              </View>
              <Text style={styles.cardMsg}>{item.message}</Text>
              <Text style={styles.cardTime}>{formatDateTimeTR(item.createdAt)}</Text>
            </PressableScale>
          </FadeInView>
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
    paddingHorizontal: space.md,
    paddingTop: space.sm,
  },
  readAllBtn: {
    paddingVertical: spacing[3] - 6,
    paddingHorizontal: spacing[3],
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: palette.goldBorder,
  },
  readAllText: { ...typography.caption, color: palette.gold },
  title: { ...typography.h1, paddingHorizontal: space.md, marginBottom: space.sm },
  list: { padding: space.md, paddingBottom: spacing[10], gap: spacing[3] },
  card: {
    backgroundColor: palette.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.borderSubtle,
    padding: spacing[3] + 2,
    gap: spacing[3] - 2,
    marginBottom: spacing[3],
    ...shadows.card,
  },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.sm },
  cardTitle: { ...typography.bodyMedium, fontFamily: fontFamily.bold, color: palette.text, flex: 1 },
  dot: {
    width: 9,
    height: 9,
    borderRadius: radius.full,
    backgroundColor: palette.brand,
  },
  cardMsg: { ...typography.bodySmall, color: palette.textSecondary },
  cardTime: { ...typography.caption, textTransform: 'none', color: palette.textMuted },
});
