import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ScreenHeader } from '../../../src/components/ScreenHeader';
import { Colors } from '../../../src/constants/colors';
import { screenRootStyle } from '../../../src/constants/layout';
import { getApiErrorMessage } from '../../../src/services/api.client';
import { getActiveLoads } from '../../../src/services/loads.service';
import type { Load } from '../../../src/types/load';
import { formatCurrencyTRY, formatWeightKg } from '../../../src/utils/format';

export default function DriverLoadsScreen() {
  const router = useRouter();
  const [loads, setLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchLoads = async () => {
    try {
      setError('');
      const data = await getActiveLoads();
      setLoads(data);
    } catch (e) {
      setError(getApiErrorMessage(e));
      setLoads([]);
    }
  };

  useEffect(() => {
    fetchLoads().finally(() => setLoading(false));
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLoads();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={[screenRootStyle, styles.centered]}>
        <ActivityIndicator color={Colors.primary} size="large" />
        <Text style={styles.muted}>Yuk panosu yukleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={screenRootStyle}>
      <ScreenHeader title="Yuk Panosu" subtitle="Aktif yuk ilanlari" />

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <FlatList
        data={loads}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        ListEmptyComponent={
          !error ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Su an aktif yuk ilani yok</Text>
              <Text style={styles.muted}>Yeni ilanlar burada listelenecek.</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() =>
              router.push({
                pathname: '/(driver)/load-detail',
                params: { id: item.id },
              })
            }
          >
            <View style={styles.cardRow}>
              <Text style={styles.route}>
                {item.fromCity} → {item.toCity}
              </Text>
              <Text style={styles.price}>{formatCurrencyTRY(item.price)}</Text>
            </View>
            <Text style={styles.muted}>
              {item.fromDistrict} / {item.toDistrict}
            </Text>
            <View style={styles.cardRow}>
              <Text style={styles.meta}>
                {item.loadType ?? item.type ?? '-'} · {formatWeightKg(item.weight)}
              </Text>
              <Text style={styles.badge}>{item.status}</Text>
            </View>
            <Text style={styles.mutedSmall}>
              Arac: {item.requiredVehicleType ?? '-'} · Teklif: {item.bidCount}
            </Text>
            <Text style={styles.musteri}>Musteri: {item.ownerFullName}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  title: { color: Colors.textPrimary, fontSize: 22, fontWeight: '700' },
  sub: { color: Colors.textSecondary, fontSize: 14, marginTop: 4 },
  list: { padding: 16, paddingBottom: 24, gap: 12 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 10,
    gap: 6,
  },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  route: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700', flex: 1 },
  price: { color: Colors.primaryGold, fontSize: 15, fontWeight: '700' },
  meta: { color: Colors.textSecondary, fontSize: 13, flex: 1 },
  badge: { color: Colors.primary, fontSize: 12, fontWeight: '600' },
  muted: { color: Colors.textSecondary, fontSize: 13 },
  mutedSmall: { color: Colors.textMuted, fontSize: 12 },
  musteri: { color: Colors.textMuted, fontSize: 12 },
  empty: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: '600' },
  errorBox: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderColor: 'rgba(239,68,68,0.3)',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  errorText: { color: Colors.error, fontSize: 13 },
});
