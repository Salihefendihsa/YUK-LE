import { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { ScreenHeader } from '../../../src/components/ScreenHeader';
import { AlertBanner } from '../../../src/components/ui/AlertBanner';
import { Card } from '../../../src/components/ui/Card';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { FadeInView } from '../../../src/components/ui/FadeInView';
import { LoadingState } from '../../../src/components/ui/LoadingState';
import { StatusPill } from '../../../src/components/ui/StatusPill';
import { ScreenContainer, useScreenInsets } from '../../../src/constants/layout';
import { getApiErrorMessage } from '../../../src/services/api.client';
import { getAdminBlockedMessages } from '../../../src/services/admin.service';
import type { AdminBlockedMessageRow } from '../../../src/types/admin';
import { palette } from '../../../src/theme/colors';
import { typography } from '../../../src/theme/typography';
import { space, spacing } from '../../../src/theme/spacing';
import { formatDateTimeTR } from '../../../src/utils/format';

export default function AdminBlockedMessagesScreen() {
  const { contentInset } = useScreenInsets();
  const [rows, setRows] = useState<AdminBlockedMessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setError('');
      setRows(await getAdminBlockedMessages());
    } catch (e) {
      setError(getApiErrorMessage(e));
      setRows([]);
    }
  }, []);

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  if (loading) {
    return (
      <ScreenContainer>
        <LoadingState message="Mesajlar yükleniyor..." variant="skeleton" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <FlatList
        data={rows}
        keyExtractor={(item, i) => `${item.loadId}-${item.timestampUtc}-${i}`}
        contentContainerStyle={[styles.list, contentInset]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await fetchData();
              setRefreshing(false);
            }}
            tintColor={palette.brand}
          />
        }
        ListHeaderComponent={
          <>
            <ScreenHeader
              title="Engellenen Mesajlar"
              subtitle="İçerik denetiminde engellenen mesajlar."
            />
            {error ? <AlertBanner message={error} tone="error" /> : null}
          </>
        }
        ListEmptyComponent={
          !error ? <EmptyState icon="🚫" title="Engellenen mesaj yok" /> : null
        }
        renderItem={({ item, index }) => (
          <FadeInView delay={Math.min(index * 40, 200)}>
            <Card variant="elevated" padding={4} style={styles.msgCard}>
              <View style={styles.head}>
                <Text style={styles.cardTitle}>{item.senderName || item.senderId}</Text>
                <StatusPill label="Engellendi" tone="error" />
              </View>
              <Text style={styles.muted}>{formatDateTimeTR(item.timestampUtc)}</Text>
              <Text style={styles.mono}>İlan: {item.loadId.slice(0, 8)}...</Text>
              <Text style={styles.danger}>{item.message}</Text>
            </Card>
          </FadeInView>
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: { padding: space.md, paddingBottom: spacing[10], gap: space.sm },
  msgCard: { marginBottom: space.sm, gap: space.xs },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.sm },
  cardTitle: { ...typography.h3, flex: 1 },
  muted: { ...typography.caption, textTransform: 'none' },
  mono: { ...typography.caption, fontSize: 11, color: palette.textMuted, textTransform: 'none' },
  danger: { ...typography.bodySmall, color: palette.error, marginTop: space.xs },
});
