import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import { PressableScale } from '../../../src/components/ui/PressableScale';
import { FadeInView } from '../../../src/components/ui/FadeInView';
import { ScreenHeader } from '../../../src/components/ScreenHeader';
import { AlertBanner } from '../../../src/components/ui/AlertBanner';
import { Card } from '../../../src/components/ui/Card';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { LoadingState } from '../../../src/components/ui/LoadingState';
import { StatusPill } from '../../../src/components/ui/StatusPill';
import { ScreenContainer, ScreenScroll } from '../../../src/constants/layout';
import { getApiErrorMessage } from '../../../src/services/api.client';
import { getCustomerDashboard } from '../../../src/services/dashboard.service';
import { getCustomerLoads } from '../../../src/services/loads.service';
import type { CustomerDashboard } from '../../../src/types/dashboard';
import type { Load } from '../../../src/types/load';
import { useAuthStore } from '../../../src/store/auth.store';
import { useNotificationsStore } from '../../../src/store/notifications.store';
import { palette } from '../../../src/theme/colors';
import { fontFamily, typography } from '../../../src/theme/typography';
import { spacing } from '../../../src/theme/spacing';
import { formatCurrencyTRY, formatDateTR } from '../../../src/utils/format';
import { getLoadStatusPill } from '../../../src/utils/statusPills';

export default function CustomerDashboardScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hubError = useNotificationsStore((s) => s.hubError);
  const firstName = user?.fullName?.trim().split(/\s+/)[0] ?? 'Müşteri';

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
      <ScreenContainer>
        <LoadingState message="Panel yükleniyor..." variant="skeleton" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenScroll
      contentContainerStyle={styles.scroll}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.brand} />
      }
    >
      <ScreenHeader
        title="Müşteri Paneli"
        subtitle="Canli istatistikler ve son ilanlar"
              right={
                <PressableScale
                  style={styles.createBtn}
                  onPress={() => router.push('/(customer)/(tabs)/create-load')}
                >
                  <Text style={styles.createBtnText}>+ İlan</Text>
                </PressableScale>
              }
      />

      {hubError ? <AlertBanner message={hubError} tone="info" /> : null}
      {error ? <AlertBanner message={error} tone="error" /> : null}

      <FadeInView>
        <Card variant="glass" padding={5} style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={styles.heroIcon}>
            <Ionicons name="business-outline" size={26} color={palette.brand} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroHello}>Merhaba, {firstName}</Text>
            <Text style={styles.heroSub}>Lojistik operasyonlarınızın özeti</Text>
          </View>
        </View>
        <Text style={styles.heroSpend}>
          Toplam harcama: {formatCurrencyTRY(stats?.totalSpent ?? 0)}
        </Text>
      </Card>
      </FadeInView>

      <FadeInView delay={60}>
      <View style={styles.grid}>
        <StatCard label="Aktif İlanlar" value={String(stats?.activeLoadCount ?? 0)} icon="cube-outline" />
        <StatCard label="Yolda Yükler" value={String(stats?.onWayLoadCount ?? 0)} icon="navigate-outline" />
        <StatCard label="Teslim Edilen" value={String(stats?.deliveredLoadCount ?? 0)} icon="checkmark-done-outline" />
        <StatCard
          label="Toplam Harcama"
          value={formatCurrencyTRY(stats?.totalSpent ?? 0)}
          icon="wallet-outline"
          wide
        />
      </View>
      </FadeInView>

      <Text style={styles.sectionTitle}>Son 5 ilan</Text>
      <Text style={styles.sectionSub}>Tüm ilanlar için İlanlarım sekmesine gidin</Text>
      {recentLoads.length === 0 ? (
        <EmptyState
          icon="📋"
          title="Henüz ilan yok"
          description="İlan Oluştur ile başlayın."
          actionLabel="İlan Oluştur"
          onAction={() => router.push('/(customer)/(tabs)/create-load')}
        />
      ) : (
        recentLoads.map((load, index) => {
          const pill = getLoadStatusPill(load.status);
          return (
            <FadeInView key={load.id} delay={80 + index * 40}>
            <PressableScale
              key={load.id}
              onPress={() =>
                router.push({ pathname: '/(customer)/load-detail', params: { id: load.id } })
              }
            >
              <Card variant="default" padding={4} style={styles.loadCard}>
                <View style={styles.loadRow}>
                  <Text style={styles.route}>
                    {load.fromCity} → {load.toCity}
                  </Text>
                  <StatusPill label={pill.label} tone={pill.tone} />
                </View>
                <Text style={styles.loadMeta}>
                  {load.loadType ?? load.type ?? '-'} · Teklif: {load.bidCount} ·{' '}
                  {formatCurrencyTRY(load.price)}
                </Text>
                <Text style={styles.loadDate}>{formatDateTR(load.createdAt)}</Text>
              </Card>
            </PressableScale>
            </FadeInView>
          );
        })
      )}
    </ScreenScroll>
  );
}

function StatCard({
  label,
  value,
  icon,
  wide,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  wide?: boolean;
}) {
  return (
    <Card variant="default" padding={4} style={wide ? styles.statWide : styles.stat}>
      <Ionicons name={icon} size={18} color={palette.gold} style={{ marginBottom: spacing[2] }} />
      <Text style={styles.statValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing[4], paddingBottom: spacing[8], gap: spacing[4] },
  createBtn: {
    backgroundColor: palette.brand,
    borderRadius: 8,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  createBtnText: {
    fontFamily: fontFamily.bold,
    fontSize: 13,
    color: palette.onBrand,
  },
  hero: { gap: spacing[4] },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: palette.brandMuted,
    borderWidth: 1,
    borderColor: palette.brandBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroHello: { ...typography.h2, fontSize: 18 },
  heroSub: { ...typography.caption, textTransform: 'none', marginTop: spacing[1] },
  heroSpend: {
    fontFamily: fontFamily.bold,
    fontSize: 16,
    color: palette.gold,
    borderTopWidth: 1,
    borderTopColor: palette.borderSubtle,
    paddingTop: spacing[3],
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3] },
  stat: { width: '47%', flexGrow: 1, flexShrink: 1, minWidth: 0, maxWidth: '48%' },
  statWide: { width: '100%' },
  statValue: {
    fontFamily: fontFamily.bold,
    fontSize: 17,
    color: palette.text,
    marginBottom: spacing[1],
  },
  statLabel: { ...typography.caption, textTransform: 'none', color: palette.textMuted },
  sectionTitle: { ...typography.h3, marginTop: spacing[2] },
  sectionSub: { ...typography.caption, textTransform: 'none', color: palette.textMuted, marginBottom: spacing[2] },
  loadCard: { marginBottom: spacing[2] },
  loadRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing[2], marginBottom: spacing[1] },
  route: { fontFamily: fontFamily.bold, fontSize: 15, color: palette.text, flex: 1 },
  loadMeta: { ...typography.caption, textTransform: 'none' },
  loadDate: { ...typography.caption, textTransform: 'none', color: palette.textMuted, marginTop: spacing[1] },
});
