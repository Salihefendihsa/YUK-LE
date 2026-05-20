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
import { getAdminDashboard } from '../../../src/services/admin.service';
import type { AdminDashboardStats } from '../../../src/types/admin';
import { useAuthStore } from '../../../src/store/auth.store';
import { formatCurrencyTRY } from '../../../src/utils/format';

function KpiCard({
  label,
  value,
  danger,
  badge,
}: {
  label: string;
  value: string;
  danger?: boolean;
  badge?: string;
}) {
  return (
    <View style={[styles.kpiCard, danger && styles.kpiDanger]}>
      <View style={styles.kpiHead}>
        <Text style={styles.kpiLabel}>{label}</Text>
        {badge ? <Text style={styles.kpiBadge}>{badge}</Text> : null}
      </View>
      <Text style={[styles.kpiValue, danger && styles.kpiValueDanger]}>{value}</Text>
    </View>
  );
}

function StatusPill({ label, online }: { label: string; online?: boolean }) {
  return (
    <View style={styles.statusPill}>
      <View style={[styles.statusDot, online === false && styles.statusDotOff]} />
      <Text style={styles.statusText}>{label}</Text>
    </View>
  );
}

export default function AdminDashboardScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setError('');
      const data = await getAdminDashboard();
      setStats(data);
    } catch (e) {
      setError(getApiErrorMessage(e));
      setStats(null);
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

  const handleLogout = () => {
    logout();
    router.replace('/');
  };

  if (loading) {
    return (
      <View style={[screenRootStyle, styles.centered]}>
        <ActivityIndicator color={Colors.primary} size="large" />
        <Text style={styles.muted}>Komuta merkezi yukleniyor...</Text>
      </View>
    );
  }

  const sys = stats?.systemStatus;

  return (
    <ScrollView
      style={screenRootStyle}
      contentContainerStyle={styles.scroll}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
      }
    >
      <ScreenHeader
        title="Komuta Merkezi"
        subtitle={`Canli operasyon — ${user?.fullName ?? 'Admin'}`}
        right={
          <Pressable style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>
        }
      />

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {stats ? (
        <>
          <View style={styles.statusRow}>
            <StatusPill label={`API: ${sys?.api ?? '-'}`} online={sys?.api === 'Online'} />
            <StatusPill label={`DB: ${sys?.db ?? '-'}`} online={sys?.db === 'Online'} />
            <StatusPill label={`Redis: ${sys?.redis ?? '-'}`} online={sys?.redis === 'Online'} />
          </View>

          <View style={styles.kpiGrid}>
            <KpiCard label="Toplam kullanici" value={String(stats.totalUsers)} />
            <KpiCard label="Aktif ilan" value={String(stats.activeLoadCount)} badge="Yayinda" />
            <KpiCard
              label="Bekleyen belge onayi"
              value={String(stats.pendingReviewCount)}
              danger={stats.pendingReviewCount > 0}
              badge="Kritik"
            />
            <KpiCard
              label="Toplam islem hacmi"
              value={formatCurrencyTRY(stats.totalTransactionVolume)}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Canli aktivite</Text>
            {stats.recentActions.length === 0 ? (
              <Text style={styles.muted}>Aktivite bulunamadi.</Text>
            ) : (
              stats.recentActions.slice(0, 10).map((a) => (
                <View key={a.id} style={styles.actionRow}>
                  <Text style={styles.actionTime}>
                    {a.timestampUtc
                      ? new Date(a.timestampUtc).toLocaleTimeString('tr-TR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '-'}
                  </Text>
                  <Text style={styles.actionNote} numberOfLines={2}>
                    {a.note ?? a.action ?? 'Aksiyon'}
                  </Text>
                </View>
              ))
            )}
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 32, gap: 12 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  title: { color: Colors.textPrimary, fontSize: 22, fontWeight: '700' },
  sub: { color: Colors.textSecondary, fontSize: 13, marginTop: 2 },
  adminName: { color: Colors.primaryGold, fontSize: 12, marginTop: 4, fontWeight: '600' },
  muted: { color: Colors.textSecondary, fontSize: 13 },
  logoutBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  logoutText: { color: Colors.textSecondary, fontSize: 12, fontWeight: '600' },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.bgCard,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.success },
  statusDotOff: { backgroundColor: Colors.error },
  statusText: { color: Colors.textSecondary, fontSize: 11, fontWeight: '600' },
  kpiGrid: { gap: 8 },
  kpiCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    gap: 6,
  },
  kpiDanger: { borderColor: 'rgba(239,68,68,0.5)' },
  kpiHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kpiLabel: { color: Colors.textSecondary, fontSize: 12, fontWeight: '600' },
  kpiBadge: {
    color: Colors.primaryGold,
    fontSize: 10,
    fontWeight: '700',
    borderWidth: 1,
    borderColor: Colors.primaryGold,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  kpiValue: { color: Colors.textPrimary, fontSize: 22, fontWeight: '800' },
  kpiValueDanger: { color: Colors.error },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    gap: 8,
  },
  cardTitle: { color: Colors.textPrimary, fontSize: 15, fontWeight: '700' },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  actionTime: { color: Colors.textMuted, fontSize: 11, width: 48 },
  actionNote: { color: Colors.textSecondary, fontSize: 13, flex: 1 },
  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderColor: 'rgba(239,68,68,0.3)',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  errorText: { color: Colors.error, fontSize: 13 },
});
