import { useRouter } from 'expo-router';
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
import { adminScreenStyles as s } from '../../src/constants/adminScreenStyles';
import { Colors } from '../../src/constants/colors';
import { screenRootStyle } from '../../src/constants/layout';
import { getApiErrorMessage } from '../../src/services/api.client';
import { getAdminLogs } from '../../src/services/admin.service';
import type { AdminLogRow } from '../../src/types/admin';
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
      <View style={[screenRootStyle, s.centered]}>
        <ActivityIndicator color={Colors.primary} size="large" />
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
          <RefreshControl refreshing={refreshing} onRefresh={async () => {
            setRefreshing(true);
            await fetchData();
            setRefreshing(false);
          }} tintColor={Colors.primary} />
        }
        ListHeaderComponent={
          <>
            <Pressable onPress={() => router.back()}>
              <Text style={s.backLink}>← Geri</Text>
            </Pressable>
            <Text style={s.title}>Sistem Loglari</Text>
            <Text style={s.sub}>Gercek: adminId, action, target, note, zaman. IP webde sahte.</Text>
            {error ? (
              <View style={s.errorBox}>
                <Text style={s.errorText}>{error}</Text>
              </View>
            ) : null}
          </>
        }
        ListEmptyComponent={
          !error ? (
            <View style={s.empty}>
              <Text style={s.emptyTitle}>Log kaydi yok</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={s.card}>
            <Text style={s.cardTitle}>{item.action ?? 'Islem'}</Text>
            <Text style={s.muted}>{formatDateTimeTR(item.timestampUtc)}</Text>
            <Text style={s.muted}>Admin: #{item.adminId ?? '-'}</Text>
            <Text style={s.muted}>Hedef kullanici: {item.targetUserId ?? '-'}</Text>
            {item.note ? <Text style={s.muted}>Not: {item.note}</Text> : null}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, paddingBottom: 40, gap: 10 },
});
