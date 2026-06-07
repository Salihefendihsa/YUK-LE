import { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text } from 'react-native';
import { ScreenHeader } from '../../../src/components/ScreenHeader';
import { AlertBanner } from '../../../src/components/ui/AlertBanner';
import { Card } from '../../../src/components/ui/Card';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { FadeInView } from '../../../src/components/ui/FadeInView';
import { LoadingState } from '../../../src/components/ui/LoadingState';
import { ScreenContainer, useScreenInsets } from '../../../src/constants/layout';
import { getApiErrorMessage } from '../../../src/services/api.client';
import { getAdminLogs } from '../../../src/services/admin.service';
import type { AdminLogRow } from '../../../src/types/admin';
import { palette } from '../../../src/theme/colors';
import { roleAccents } from '../../../src/theme/roleAccent';
import { typography } from '../../../src/theme/typography';
import { space, spacing } from '../../../src/theme/spacing';
import { formatAdminLogAction, formatAdminLogNote, formatDateTimeTR } from '../../../src/utils/format';

export default function AdminLogsScreen() {
  const { contentInset } = useScreenInsets();
  const [logs, setLogs] = useState<AdminLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setError('');
      setLogs(await getAdminLogs());
    } catch (e) {
      setError(getApiErrorMessage(e));
      setLogs([]);
    }
  }, []);

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  if (loading) {
    return (
      <ScreenContainer>
        <LoadingState message="Loglar yükleniyor..." variant="skeleton" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <FlatList
        data={logs}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[styles.list, contentInset]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await fetchData();
              setRefreshing(false);
            }}
            tintColor={roleAccents.admin.accent}
          />
        }
        ListHeaderComponent={
          <>
            <ScreenHeader
              title="Loglar"
              subtitle="Yönetici işlem kayıtları ve zaman damgası"
            />
            {error ? <AlertBanner message={error} tone="error" /> : null}
          </>
        }
        ListEmptyComponent={
          !error ? <EmptyState icon="📋" title="Log kaydı yok" /> : null
        }
        renderItem={({ item, index }) => (
          <FadeInView delay={Math.min(index * 40, 200)}>
            <Card variant="elevated" padding={4} style={styles.logCard}>
              <Text style={styles.cardTitle}>{formatAdminLogAction(item.action)}</Text>
              <Text style={styles.muted}>{formatDateTimeTR(item.timestampUtc)}</Text>
              <Text style={styles.muted}>İşlemi yapan: Admin #{item.adminId ?? '-'}</Text>
              <Text style={styles.muted}>
                Etkilenen kullanıcı: {item.targetUserId != null ? `#${item.targetUserId}` : '-'}
              </Text>
              {item.note ? <Text style={styles.muted}>{formatAdminLogNote(item.note)}</Text> : null}
            </Card>
          </FadeInView>
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: { padding: space.md, paddingBottom: spacing[10], gap: space.sm },
  logCard: { marginBottom: space.sm },
  cardTitle: { ...typography.h3 },
  muted: { ...typography.caption, textTransform: 'none' },
});
