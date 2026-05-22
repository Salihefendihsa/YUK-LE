import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { AlertBanner } from '../../src/components/ui/AlertBanner';
import { Card } from '../../src/components/ui/Card';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { LoadingState } from '../../src/components/ui/LoadingState';
import { SectionHeader } from '../../src/components/ui/SectionHeader';
import { screenRootStyle } from '../../src/constants/layout';
import { getApiErrorMessage } from '../../src/services/api.client';
import { getAdminLogs } from '../../src/services/admin.service';
import type { AdminLogRow } from '../../src/types/admin';
import { palette } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';
import { formatDateTimeTR } from '../../src/utils/format';

export default function AdminLogsScreen() {
  const router = useRouter();
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
      <View style={screenRootStyle}>
        <LoadingState message="Loglar yukleniyor..." />
      </View>
    );
  }

  return (
    <View style={screenRootStyle}>
      <FlatList
        data={logs}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
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
            <Pressable onPress={() => router.back()} style={styles.back}>
              <Text style={typography.link}>← Geri</Text>
            </Pressable>
            <SectionHeader
              title="Sistem Loglari"
              subtitle="Gercek: adminId, action, target, note, zaman. IP webde sahte."
            />
            {error ? <AlertBanner message={error} tone="error" /> : null}
          </>
        }
        ListEmptyComponent={
          !error ? <EmptyState icon="📋" title="Log kaydi yok" /> : null
        }
        renderItem={({ item }) => (
          <Card variant="elevated" padding={4} style={styles.logCard}>
            <Text style={styles.cardTitle}>{item.action ?? 'Islem'}</Text>
            <Text style={styles.muted}>{formatDateTimeTR(item.timestampUtc)}</Text>
            <Text style={styles.muted}>Admin: #{item.adminId ?? '-'}</Text>
            <Text style={styles.muted}>Hedef kullanici: {item.targetUserId ?? '-'}</Text>
            {item.note ? <Text style={styles.muted}>Not: {item.note}</Text> : null}
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing[4], paddingBottom: spacing[10], gap: spacing[2] },
  back: { marginBottom: spacing[2] },
  logCard: { marginBottom: spacing[2] },
  cardTitle: { ...typography.h3 },
  muted: { ...typography.caption, textTransform: 'none' },
});
