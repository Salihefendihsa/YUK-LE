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
import { ScreenHeader } from '../../../src/components/ScreenHeader';
import { Colors } from '../../../src/constants/colors';
import { screenRootStyle } from '../../../src/constants/layout';
import { getApiErrorMessage } from '../../../src/services/api.client';
import { getCustomerLoads } from '../../../src/services/loads.service';
import type { Load } from '../../../src/types/load';
import { formatCurrencyTRY } from '../../../src/utils/format';

export default function CustomerLoadsScreen() {
  const router = useRouter();
  const [loads, setLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchLoads = useCallback(async () => {
    try {
      setError('');
      const data = await getCustomerLoads();
      setLoads(data);
    } catch (e) {
      setError(getApiErrorMessage(e));
      setLoads([]);
    }
  }, []);

  useEffect(() => {
    fetchLoads().finally(() => setLoading(false));
  }, [fetchLoads]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLoads();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={[screenRootStyle, styles.centered]}>
        <ActivityIndicator color={Colors.primary} size="large" />
        <Text style={styles.muted}>Ilanlar yukleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={screenRootStyle}>
      <FlatList
        data={loads}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        ListHeaderComponent={
          <>
            <ScreenHeader
              title="Ilanlarim"
              subtitle="Tum ilanlar ve durumlari"
              right={
                <Pressable
                  style={styles.createBtn}
                  onPress={() => router.push('/(customer)/(tabs)/create-load')}
                >
                  <Text style={styles.createBtnText}>+ Yeni</Text>
                </Pressable>
              }
            />
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
              <Text style={styles.emptyTitle}>Henuz ilaniniz yok</Text>
              <Text style={styles.muted}>Ilan Olustur ile baslayin.</Text>
              <Pressable
                style={styles.emptyBtn}
                onPress={() => router.push('/(customer)/(tabs)/create-load')}
              >
                <Text style={styles.emptyBtnText}>Ilan Olustur</Text>
              </Pressable>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() =>
              router.push({ pathname: '/(customer)/load-detail', params: { id: item.id } })
            }
          >
            <View style={styles.cardRow}>
              <Text style={styles.route}>
                {item.fromCity} → {item.toCity}
              </Text>
              <Text style={styles.badge}>{item.status}</Text>
            </View>
            <Text style={styles.muted}>
              {item.loadType ?? item.type ?? '-'} · {formatCurrencyTRY(item.price)}
            </Text>
            <Text style={styles.mutedSmall}>Teklif: {item.bidCount ?? 0}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, paddingBottom: 24 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  title: { color: Colors.textPrimary, fontSize: 22, fontWeight: '700' },
  sub: { color: Colors.textSecondary, fontSize: 14, marginTop: 4 },
  createBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  createBtnText: { color: Colors.bgDark, fontWeight: '700' },
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
  badge: { color: Colors.primary, fontSize: 12, fontWeight: '600' },
  muted: { color: Colors.textSecondary, fontSize: 13 },
  mutedSmall: { color: Colors.textMuted, fontSize: 12 },
  empty: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: '600' },
  emptyBtn: {
    marginTop: 8,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  emptyBtnText: { color: Colors.bgDark, fontWeight: '700' },
  errorBox: {
    marginBottom: 12,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderColor: 'rgba(239,68,68,0.3)',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  errorText: { color: Colors.error, fontSize: 13 },
});
