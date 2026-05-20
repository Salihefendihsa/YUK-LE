import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
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
import { getDriverDashboard } from '../../../src/services/dashboard.service';
import { getApiErrorMessage } from '../../../src/services/api.client';
import type { DriverDashboard } from '../../../src/types/dashboard';
import { useAuthStore } from '../../../src/store/auth.store';
import { formatCurrencyTRY } from '../../../src/utils/format';

export default function DriverDashboardScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const firstName = user?.fullName?.trim().split(/\s+/)[0] ?? 'Sofor';

  const [stats, setStats] = useState<DriverDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      setError('');
      const data = await getDriverDashboard();
      setStats(data);
    } catch (e) {
      setError(getApiErrorMessage(e));
    }
  };

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={[screenRootStyle, styles.centered]}>
        <ActivityIndicator color={Colors.primary} size="large" />
        <Text style={styles.muted}>Yukleniyor...</Text>
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
      <ScreenHeader title="Sofor Paneli" subtitle="Ozet istatistikler" />

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.hero}>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroHello}>Merhaba, {firstName}</Text>
          <Text style={styles.muted}>Toplam kazanc ve aktif teklifler</Text>
        </View>
        <View style={styles.heroRight}>
          <Text style={styles.mutedSmall}>Toplam kazanc</Text>
          <Text style={styles.heroEarn}>{formatCurrencyTRY(Number(stats?.totalEarnings ?? 0))}</Text>
          <Text style={styles.mutedSmall}>Aktif teklif: {stats?.activeBidCount ?? 0}</Text>
        </View>
      </View>

      <View style={styles.grid}>
        <StatCard label="Aktif Teklif" value={String(stats?.activeBidCount ?? 0)} />
        <StatCard label="Tamamlanan Sefer" value={String(stats?.completedJobCount ?? 0)} />
        <StatCard label="Toplam Kazanc" value={formatCurrencyTRY(Number(stats?.totalEarnings ?? 0))} />
      </View>

      <Pressable style={styles.docsBtn} onPress={() => router.push('/(driver)/documents')}>
        <Text style={styles.docsBtnText}>Belgelerim</Text>
        <Text style={styles.docsBtnSub}>Ehliyet, SRC, psikoteknik yukleme</Text>
      </Pressable>
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
  scroll: { padding: 16, paddingBottom: 32, gap: 16 },
  centered: { alignItems: 'center', justifyContent: 'center', gap: 12 },
  title: { color: Colors.textPrimary, fontSize: 22, fontWeight: '700' },
  sub: { color: Colors.textSecondary, fontSize: 14 },
  muted: { color: Colors.textSecondary, fontSize: 13 },
  mutedSmall: { color: Colors.textMuted, fontSize: 11 },
  hero: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
  },
  heroHello: { color: Colors.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: 4 },
  heroRight: { alignItems: 'flex-end' },
  heroEarn: { color: Colors.primaryGold, fontSize: 20, fontWeight: '800' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    minWidth: 140,
  },
  statValue: { color: Colors.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: 4 },
  statLabel: { color: Colors.textMuted, fontSize: 12 },
  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderColor: 'rgba(239,68,68,0.3)',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  errorText: { color: Colors.error, fontSize: 13 },
  docsBtn: {
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
    padding: 16,
    gap: 4,
  },
  docsBtnText: { color: Colors.primary, fontSize: 16, fontWeight: '700' },
  docsBtnSub: { color: Colors.textSecondary, fontSize: 12 },
});
