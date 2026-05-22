import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScreenHeader } from '../../../src/components/ScreenHeader';
import { AlertBanner } from '../../../src/components/ui/AlertBanner';
import { Card } from '../../../src/components/ui/Card';
import { LoadingState } from '../../../src/components/ui/LoadingState';
import { StatusPill } from '../../../src/components/ui/StatusPill';
import { screenRootStyle } from '../../../src/constants/layout';
import { getApiErrorMessage } from '../../../src/services/api.client';
import { getAdminDashboard } from '../../../src/services/admin.service';
import type { AdminDashboardStats } from '../../../src/types/admin';
import { useAuthStore } from '../../../src/store/auth.store';
import { palette } from '../../../src/theme/colors';
import { fontFamily, typography } from '../../../src/theme/typography';
import { spacing } from '../../../src/theme/spacing';
import { formatCurrencyTRY } from '../../../src/utils/format';
import { getSystemServicePill } from '../../../src/utils/statusPills';

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
    <Card variant="elevated" padding={4} style={danger ? styles.kpiDanger : undefined}>
      <View style={styles.kpiHead}>
        <Text style={styles.kpiLabel}>{label}</Text>
        {badge ? (
          <View style={styles.kpiBadge}>
            <Text style={styles.kpiBadgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>
      <Text style={[styles.kpiValue, danger && styles.kpiValueDanger]}>{value}</Text>
    </Card>
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
      <View style={screenRootStyle}>
        <LoadingState message="Komuta merkezi yukleniyor..." />
      </View>
    );
  }

  const sys = stats?.systemStatus;

  return (
    <ScrollView
      style={screenRootStyle}
      contentContainerStyle={styles.scroll}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.brand} />
      }
    >
      <ScreenHeader
        title="Komuta Merkezi"
        subtitle={`Canli operasyon — ${user?.fullName ?? 'Admin'}`}
        right={
          <Pressable style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>Cikis</Text>
          </Pressable>
        }
      />

      {error ? <AlertBanner message={error} tone="error" /> : null}

      {stats ? (
        <>
          <Card variant="glass" padding={5} style={styles.hero}>
            <View style={styles.heroTop}>
              <View style={styles.heroIcon}>
                <Ionicons name="shield-checkmark" size={26} color={palette.gold} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroTitle}>Operasyon ozeti</Text>
                <Text style={styles.heroSub}>Platform genel bakis</Text>
              </View>
            </View>
          </Card>

          <View style={styles.statusRow}>
            {sys?.api ? (
              <StatusPill {...getSystemServicePill(sys.api)} label={`API: ${sys.api}`} />
            ) : null}
            {sys?.db ? (
              <StatusPill {...getSystemServicePill(sys.db)} label={`DB: ${sys.db}`} />
            ) : null}
            {sys?.redis ? (
              <StatusPill {...getSystemServicePill(sys.redis)} label={`Redis: ${sys.redis}`} />
            ) : null}
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

          <Card variant="elevated" padding={4}>
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
          </Card>
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing[4], paddingBottom: spacing[10], gap: spacing[3] },
  hero: { marginBottom: spacing[1] },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: palette.goldMuted,
    borderWidth: 1,
    borderColor: palette.goldBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: { ...typography.h3, color: palette.text },
  heroSub: { ...typography.caption, textTransform: 'none', marginTop: 2 },
  logoutBtn: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: 8,
    borderWidth: 1,
    borderColor: palette.borderLight,
  },
  logoutText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
    color: palette.textSecondary,
  },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  kpiGrid: { gap: spacing[2] },
  kpiHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kpiLabel: { ...typography.caption, textTransform: 'none' },
  kpiBadge: {
    borderWidth: 1,
    borderColor: palette.goldBorder,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: palette.goldMuted,
  },
  kpiBadgeText: {
    fontFamily: fontFamily.bold,
    fontSize: 10,
    color: palette.gold,
  },
  kpiValue: {
    fontFamily: fontFamily.bold,
    fontSize: 22,
    color: palette.text,
    letterSpacing: -0.5,
  },
  kpiValueDanger: { color: palette.error },
  kpiDanger: { borderColor: palette.errorBorder },
  cardTitle: { ...typography.h3, marginBottom: spacing[2] },
  muted: { ...typography.caption, textTransform: 'none' },
  actionRow: {
    flexDirection: 'row',
    gap: spacing[3],
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: palette.borderSubtle,
  },
  actionTime: {
    fontFamily: fontFamily.regular,
    fontSize: 11,
    color: palette.textMuted,
    width: 48,
  },
  actionNote: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: palette.textSecondary,
    flex: 1,
  },
});
