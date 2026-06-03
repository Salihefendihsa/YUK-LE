import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { ScreenHeader } from '../ScreenHeader';
import { AlertBanner } from '../ui/AlertBanner';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import { FadeInView } from '../ui/FadeInView';
import { LoadingState } from '../ui/LoadingState';
import { PressableScale } from '../ui/PressableScale';
import { getApiErrorMessage } from '../../services/api.client';
import {
  getCustomerChatThreads,
  getDriverChatThreads,
} from '../../services/chatThreads.service';
import { useAuthStore } from '../../store/auth.store';
import type { ChatThreadSummary } from '../../types/chat';
import { ScreenContainer, useScreenInsets } from '../../constants/layout';
import { palette } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { space, spacing } from '../../theme/spacing';
import { formatDateTimeTR } from '../../utils/format';

type Props = {
  role: 'customer' | 'driver';
};

export function MessagesInboxScreen({ role }: Props) {
  const router = useRouter();
  const { contentInset } = useScreenInsets();
  const userId = useAuthStore((s) => s.user?.userId);

  const [threads, setThreads] = useState<ChatThreadSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchThreads = useCallback(async () => {
    if (role === 'driver' && !userId) {
      setThreads([]);
      return;
    }
    setError('');
    const data =
      role === 'customer'
        ? await getCustomerChatThreads()
        : await getDriverChatThreads(userId!);
    setThreads(data);
  }, [role, userId]);

  useEffect(() => {
    void fetchThreads()
      .catch((e) => {
        setError(getApiErrorMessage(e));
        setThreads([]);
      })
      .finally(() => setLoading(false));
  }, [fetchThreads]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchThreads();
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setRefreshing(false);
    }
  };

  const openChat = (loadId: string) => {
    router.push({ pathname: '/chat', params: { loadId } });
  };

  if (loading) {
    return (
      <ScreenContainer>
        <LoadingState message="Mesajlar yükleniyor…" variant="skeleton" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <FlatList
        data={threads}
        keyExtractor={(item) => item.loadId}
        contentContainerStyle={[styles.list, contentInset]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.brand} />
        }
        ListHeaderComponent={
          <>
            <ScreenHeader
              title="Mesajlar"
              subtitle={
                role === 'customer'
                  ? 'Şoförünüzle ilan bazlı sohbetler'
                  : 'Müşterinizle ilan bazlı sohbetler'
              }
            />
            {error ? <AlertBanner message={error} tone="error" /> : null}
          </>
        }
        ListEmptyComponent={
          !error ? (
            <EmptyState
              icon="💬"
              title="Henüz mesajınız yok"
              description={
                role === 'customer'
                  ? 'Şoför atandığında ilgili ilan için burada sohbet görünür. İlan detayından da yazabilirsiniz.'
                  : 'Atandığınız seferler burada listelenir. Aktif yük veya sefer detayından da yazabilirsiniz.'
              }
            />
          ) : null
        }
        renderItem={({ item, index }) => (
          <FadeInView delay={Math.min(index * 40, 200)}>
            <PressableScale onPress={() => openChat(item.loadId)}>
              <Card variant="elevated" padding={4} style={styles.threadCard}>
                <View style={styles.threadHead}>
                  <Text style={styles.route}>{item.route}</Text>
                  {item.lastMessageAt ? (
                    <Text style={styles.time}>{formatDateTimeTR(item.lastMessageAt)}</Text>
                  ) : null}
                </View>
                <Text style={styles.counterpart}>
                  {role === 'customer' ? 'Şoför' : 'Müşteri'}: {item.counterpartName}
                </Text>
                <Text style={styles.preview} numberOfLines={2}>
                  {item.hasMessages
                    ? item.lastMessage
                    : 'Henüz mesaj yok — sohbeti başlatmak için dokunun'}
                </Text>
              </Card>
            </PressableScale>
          </FadeInView>
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: { padding: space.md, paddingBottom: spacing[10], gap: space.sm },
  threadCard: { marginBottom: space.sm, gap: space.xs },
  threadHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: space.sm,
  },
  route: { ...typography.h3, flex: 1 },
  time: { ...typography.caption, textTransform: 'none', color: palette.textMuted },
  counterpart: { ...typography.bodySmall, color: palette.textMuted },
  preview: {
    ...typography.caption,
    textTransform: 'none',
    color: palette.textSecondary,
    marginTop: space.xs,
  },
});
