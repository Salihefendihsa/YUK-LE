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
import { Colors } from '../../src/constants/colors';
import { screenRootStyle } from '../../src/constants/layout';
import { getApiErrorMessage } from '../../src/services/api.client';
import { getCustomerLoadHistory } from '../../src/services/history.service';
import type { CustomerHistoryRow } from '../../src/types/history';
import { formatCurrencyTRY, formatDateTR } from '../../src/utils/format';

export default function CustomerHistoryScreen() {
  const router = useRouter();
  const [items, setItems] = useState<CustomerHistoryRow[]>([]);
  const [totalSpend, setTotalSpend] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setError('');
      const data = await getCustomerLoadHistory(1, 50);
      setItems(data.items);
      setTotalSpend(data.totalSpend);
    } catch (e) {
      setError(getApiErrorMessage(e));
      setItems([]);
    }
  }, []);

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={[screenRootStyle, styles.centered]}>
        <ActivityIndicator color={Colors.primary} size="large" />
        <Text style={styles.muted}>Gecmis seferler yukleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={screenRootStyle}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        ListHeaderComponent={
          <>
            <Pressable onPress={() => router.back()}>
              <Text style={styles.backLink}>← Profil</Text>
            </Pressable>
            <Text style={styles.title}>Gecmis Seferlerim</Text>
            <Text style={styles.sub}>Tamamlanan teslimatlar ve toplam harcama</Text>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.summaryCard}>
              <Text style={styles.mutedSmall}>Toplam harcama</Text>
              <Text style={styles.summaryValue}>{formatCurrencyTRY(totalSpend)}</Text>
            </View>
          </>
        }
        ListEmptyComponent={
          !error ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Henuz tamamlanmis seferiniz yok</Text>
              <Text style={styles.muted}>Teslim edilen seferler burada listelenecek.</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.route}>
              {item.fromCity} → {item.toCity}
            </Text>
            <Text style={styles.muted}>Sofor: {item.driverName ?? '-'}</Text>
            <Text style={styles.muted}>
              Tarih: {item.deliveryDate ? formatDateTR(item.deliveryDate) : '-'}
            </Text>
            <View style={styles.cardRow}>
              <Text style={styles.price}>{formatCurrencyTRY(item.price)}</Text>
              <Text style={styles.badge}>{item.status ?? 'Delivered'}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, paddingBottom: 32 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  backLink: { color: Colors.primary, fontSize: 14, fontWeight: '600', marginBottom: 8 },
  title: { color: Colors.textPrimary, fontSize: 22, fontWeight: '700' },
  sub: { color: Colors.textSecondary, fontSize: 14, marginBottom: 12 },
  muted: { color: Colors.textSecondary, fontSize: 13 },
  mutedSmall: { color: Colors.textMuted, fontSize: 12 },
  summaryCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primaryGold,
    padding: 14,
    marginBottom: 12,
    gap: 4,
  },
  summaryValue: { color: Colors.primaryGold, fontSize: 20, fontWeight: '700' },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 8,
    gap: 4,
  },
  route: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700' },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  price: { color: Colors.primary, fontSize: 15, fontWeight: '700' },
  badge: { color: Colors.success, fontSize: 12, fontWeight: '600' },
  empty: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: '600' },
  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderColor: 'rgba(239,68,68,0.3)',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  errorText: { color: Colors.error, fontSize: 13 },
});
