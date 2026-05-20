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
import { getAdminBlockedMessages } from '../../src/services/admin.service';
import type { AdminBlockedMessageRow } from '../../src/types/admin';
import { formatDateTimeTR } from '../../src/utils/format';

export default function AdminBlockedMessagesScreen() {
  const router = useRouter();
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
      <View style={[screenRootStyle, s.centered]}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={screenRootStyle}>
      <FlatList
        data={rows}
        keyExtractor={(item, i) => `${item.loadId}-${item.timestampUtc}-${i}`}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await fetchData();
              setRefreshing(false);
            }}
            tintColor={Colors.primary}
          />
        }
        ListHeaderComponent={
          <>
            <Pressable onPress={() => router.back()}>
              <Text style={s.backLink}>← Geri</Text>
            </Pressable>
            <Text style={s.title}>Engellenen Mesajlar</Text>
            <Text style={s.sub}>
              Gercek API (bellek kuyrugu). Sunucu yeniden baslayinca liste sifirlanabilir.
            </Text>
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
              <Text style={s.emptyTitle}>Engellenen mesaj yok</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={s.card}>
            <Text style={s.cardTitle}>{item.senderName || item.senderId}</Text>
            <Text style={s.muted}>{formatDateTimeTR(item.timestampUtc)}</Text>
            <Text style={s.mono}>Ilan: {item.loadId.slice(0, 8)}...</Text>
            <Text style={[s.muted, s.danger]}>{item.message}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, paddingBottom: 40, gap: 10 },
});
