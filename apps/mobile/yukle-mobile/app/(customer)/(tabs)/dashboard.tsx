import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ScreenHeader } from '../../../src/components/ScreenHeader';
import { Colors } from '../../../src/constants/colors';
import { screenRootStyle } from '../../../src/constants/layout';
import { getApiErrorMessage } from '../../../src/services/api.client';
import { getCustomerDashboard } from '../../../src/services/dashboard.service';
import { getCustomerLoads } from '../../../src/services/loads.service';
import type { CustomerDashboard } from '../../../src/types/dashboard';
import type { Load } from '../../../src/types/load';
import { formatCurrencyTRY, formatDateTR } from '../../../src/utils/format';

export default function CustomerDashboardScreen() {
  const router = useRouter();
  const [stats, setStats] = useState<CustomerDashboard | null>(null);
  const [recentLoads, setRecentLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setError('');
      const [dashboardData, loads] = await Promise.all([getCustomerDashboard(), getCustomerLoads()]);
      setStats(dashboardData);
      setRecentLoads(loads.slice(0, 5));
    } catch (e) {
      setError(getApiErrorMessage(e));
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
        <Text style={styles.muted}>Panel yukleniyor...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={screenRootStyle}
      contentContainerStyle={styles.scroll}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
      }
    >
      <ScreenHeader
        title="Musteri Paneli"
        subtitle="Canli istatistikler ve son ilanlar"
        right={
          <Pressable style={styles.createBtn} onPress={() => router.push('/(customer)/(tabs)/create-load')}>
            <Text style={styles.createBtnText}>+ Ilan</Text>
          </Pressable>
        }
      />

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.grid}>
        <StatCard label="Aktif Ilanlar" value={String(stats?.activeLoadCount ?? 0)} />
        <StatCard label="Yolda Yukler" value={String(stats?.onWayLoadCount ?? 0)} />
        <StatCard label="Teslim Edilen" value={String(stats?.deliveredLoadCount ?? 0)} />
        <StatCard label="Toplam Harcama" value={formatCurrencyTRY(stats?.totalSpent ?? 0)} />
      </View>

      <Text style={styles.sectionTitle}>Son ilanlar</Text>
      {recentLoads.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.muted}>Henuz ilan yok.</Text>
          <Pressable onPress={() => router.push('/(customer)/(tabs)/create-load')}>
            <Text style={styles.link}>Ilan Olustur ile baslayin</Text>
          </Pressable>
        </View>
      ) : (
        recentLoads.map((load) => (
          <Pressable
            key={load.id}
            style={styles.loadCard}
            onPress={() =>
              router.push({ pathname: '/(customer)/load-detail', params: { id: load.id } })
            }
          >
            <View style={styles.loadRow}>
              <Text style={styles.route}>
                {load.fromCity} → {load.toCity}
              </Text>
              <Text style={styles.badge}>{load.status}</Text>
            </View>
            <Text style={styles.muted}>
              {load.loadType ?? load.type ?? '-'} · Teklif: {load.bidCount} ·{' '}
              {formatCurrencyTRY(load.price)}
            </Text>
            <Text style={styles.mutedSmall}>{formatDateTR(load.createdAt)}</Text>
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 32, gap: 12 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  title: { color: Colors.textPrimary, fontSize: 22, fontWeight: '700' },
  sub: { color: Colors.textSecondary, fontSize: 14, marginTop: 4 },
  createBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  createBtnText: { color: Colors.bgDark, fontWeight: '700', fontSize: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    width: '48%',
    flexGrow: 1,
    minWidth: 140,
    backgroundColor: Colors.bgCard,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    gap: 4,
  },
  statValue: { color: Colors.primaryGold, fontSize: 18, fontWeight: '800' },
  statLabel: { color: Colors.textMuted, fontSize: 12 },
  sectionTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700', marginTop: 8 },
  loadCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    gap: 4,
  },
  loadRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  route: { color: Colors.textPrimary, fontSize: 15, fontWeight: '700', flex: 1 },
  badge: { color: Colors.primary, fontSize: 12, fontWeight: '600' },
  muted: { color: Colors.textSecondary, fontSize: 13 },
  mutedSmall: { color: Colors.textMuted, fontSize: 11 },
  empty: { gap: 8, paddingVertical: 12 },
  link: { color: Colors.primary, fontWeight: '600', fontSize: 14 },
  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderColor: 'rgba(239,68,68,0.3)',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  errorText: { color: Colors.error, fontSize: 13 },
});
