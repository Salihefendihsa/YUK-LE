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
import { getDriverBids } from '../../src/services/bids.service';
import type { DriverBid } from '../../src/types/bid';
import { formatCurrencyTRY, formatDateTR } from '../../src/utils/format';

function bidStatusStyle(status: string) {
  const s = status.toLowerCase();
  if (s.includes('accept')) return styles.badgeOk;
  if (s.includes('reject') || s.includes('cancel')) return styles.badgeErr;
  return styles.badgePending;
}

export default function DriverBidsScreen() {
  const router = useRouter();
  const [bids, setBids] = useState<DriverBid[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setError('');
      const data = await getDriverBids();
      setBids(data);
    } catch (e) {
      setError(getApiErrorMessage(e));
      setBids([]);
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
        <Text style={styles.muted}>Teklifler yukleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={screenRootStyle}>
      <FlatList
        data={bids}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        ListHeaderComponent={
          <>
            <Pressable onPress={() => router.back()}>
              <Text style={styles.backLink}>← Profil</Text>
            </Pressable>
            <Text style={styles.title}>Tekliflerim</Text>
            <Text style={styles.sub}>Verdiginiz yuk teklifleri</Text>
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
          </>
        }
        ListEmptyComponent={
          !error ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Henuz teklifiniz yok</Text>
              <Text style={styles.muted}>Yuk panosundan ilanlara teklif verebilirsiniz.</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() =>
              router.push({ pathname: '/(driver)/load-detail', params: { id: item.loadId } })
            }
          >
            <View style={styles.cardRow}>
              <Text style={styles.route}>
                {item.fromCity} → {item.toCity}
              </Text>
              <View style={[styles.badge, bidStatusStyle(item.status)]}>
                <Text style={styles.badgeText}>{item.status}</Text>
              </View>
            </View>
            <Text style={styles.price}>{formatCurrencyTRY(item.amount)}</Text>
            <Text style={styles.muted}>{formatDateTR(item.offerDate)}</Text>
            {item.note ? <Text style={styles.mutedSmall}>Not: {item.note}</Text> : null}
          </Pressable>
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
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 8,
    gap: 4,
  },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  route: { color: Colors.textPrimary, fontSize: 15, fontWeight: '700', flex: 1 },
  price: { color: Colors.primaryGold, fontSize: 16, fontWeight: '700' },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 10, fontWeight: '700', color: Colors.bgDark },
  badgeOk: { backgroundColor: Colors.success },
  badgeErr: { backgroundColor: Colors.error },
  badgePending: { backgroundColor: Colors.primaryGold },
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
