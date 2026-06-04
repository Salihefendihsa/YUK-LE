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
import { ScreenBackground } from '../../../src/components/ui/ScreenBackground';
import { StatusPill } from '../../../src/components/ui/StatusPill';
import { ScreenContainer, ScreenScroll } from '../../../src/constants/layout';
import { getApiErrorMessage } from '../../../src/services/api.client';
import { getCustomerDashboard } from '../../../src/services/dashboard.service';
import { getCustomerLoads } from '../../../src/services/loads.service';
import { getUserRatings, type UserRatingSummary } from '../../../src/services/ratings.service';
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
  const [rating, setRating] = useState<UserRatingSummary | null>(null);
  const [weekStats, setWeekStats] = useState({ newLoads: 0, completed: 0, spend: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setError('');
      const uid = user?.userId;
      const [dashboardData, loads, ratingData] = await Promise.all([
        getCustomerDashboard(),
        getCustomerLoads(),
        uid ? getUserRatings(uid) : Promise.resolve(null),
      ]);
      setStats(dashboardData);
      setRecentLoads(loads.slice(0, 5));
      setRating(ratingData);
      setWeekStats(computeWeekStats(loads));
    } catch (e) {
      setError(getApiErrorMessage(e));
    }
  }, [user?.userId]);

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
      <ScreenBackground>
        <ScreenContainer style={styles.transparent}>
          <LoadingState message="Panel yükleniyor..." variant="skeleton" />
        </ScreenContainer>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground>
    <ScreenScroll
      style={styles.transparent}
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
        <Card variant="gradient" padding={5} style={styles.hero}>
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

      <FadeInView delay={100}>
        <View style={styles.showcaseRow}>
          <Card variant="gradient" padding={4} style={styles.showcaseCard}>
            <View style={styles.showcaseHead}>
              <Ionicons name="star" size={16} color={palette.brand} />
              <Text style={styles.showcaseTitle}>Performans skorum</Text>
            </View>
            {rating && rating.count > 0 ? (
              <>
                <Text style={styles.scoreBig}>{rating.average.toFixed(1)}</Text>
                <Text style={styles.showcaseMeta}>{rating.count} değerlendirme</Text>
              </>
            ) : (
              <Text style={styles.emptyNote}>Henüz değerlendirme yok</Text>
            )}
          </Card>

          <Card variant="gradient" padding={4} style={styles.showcaseCard}>
            <View style={styles.showcaseHead}>
              <Ionicons name="calendar-outline" size={16} color={palette.brand} />
              <Text style={styles.showcaseTitle}>Bu hafta</Text>
            </View>
            <View style={styles.weekGrid}>
              <WeekMetric value={String(weekStats.newLoads)} label="Yeni ilan" />
              <WeekMetric value={String(weekStats.completed)} label="Tamamlanan" />
            </View>
            <Text style={styles.weekSpend}>
              Harcama: {formatCurrencyTRY(weekStats.spend)}
            </Text>
          </Card>
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
    </ScreenBackground>
  );
}

/** Bu hafta = son 7 gün (rolling). Yeni ilan: createdAt; tamamlanan/harcama: Delivered + deliveryDate (gercek deliveredAt alani yok, planli teslim tarihi en yakin sinyal). */
function computeWeekStats(loads: Load[]) {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  let newLoads = 0;
  let completed = 0;
  let spend = 0;
  for (const l of loads) {
    const created = Date.parse(l.createdAt);
    if (!Number.isNaN(created) && created >= weekAgo) newLoads += 1;
    if (l.status === 'Delivered') {
      const delivered = Date.parse(l.deliveryDate);
      if (!Number.isNaN(delivered) && delivered >= weekAgo) {
        completed += 1;
        spend += l.price ?? 0;
      }
    }
  }
  return { newLoads, completed, spend };
}

function WeekMetric({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.weekMetric}>
      <Text style={styles.weekValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.weekLabel}>{label}</Text>
    </View>
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
    <Card variant="gradient" padding={4} style={wide ? styles.statWide : styles.stat}>
      <Ionicons name={icon} size={18} color={palette.brand} style={{ marginBottom: spacing[2] }} />
      <Text style={styles.statValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing[4], paddingBottom: spacing[8], gap: spacing[4] },
  transparent: { backgroundColor: 'transparent' },
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
    color: palette.brand,
    marginBottom: spacing[1],
  },
  statLabel: { ...typography.caption, textTransform: 'none', color: palette.textMuted },
  showcaseRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3] },
  showcaseCard: { flexGrow: 1, flexShrink: 1, minWidth: 0, flexBasis: '47%' },
  showcaseHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  showcaseTitle: { fontFamily: fontFamily.bold, fontSize: 13, color: palette.text },
  showcaseMeta: { ...typography.caption, textTransform: 'none', color: palette.textMuted },
  scoreBig: { fontFamily: fontFamily.bold, fontSize: 32, color: palette.brand },
  emptyNote: {
    ...typography.caption,
    textTransform: 'none',
    color: palette.textMuted,
    paddingVertical: spacing[2],
  },
  weekGrid: { flexDirection: 'row', gap: spacing[3] },
  weekMetric: { flexGrow: 1, flexShrink: 1, minWidth: 0 },
  weekValue: { fontFamily: fontFamily.bold, fontSize: 20, color: palette.brand },
  weekLabel: {
    ...typography.caption,
    textTransform: 'none',
    color: palette.textMuted,
    marginTop: 2,
  },
  weekSpend: {
    fontFamily: fontFamily.bold,
    fontSize: 13,
    color: palette.gold,
    marginTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: palette.borderSubtle,
    paddingTop: spacing[2],
  },
  sectionTitle: { ...typography.h3, marginTop: spacing[2] },
  sectionSub: { ...typography.caption, textTransform: 'none', color: palette.textMuted, marginBottom: spacing[2] },
  loadCard: { marginBottom: spacing[2] },
  loadRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing[2], marginBottom: spacing[1] },
  route: { fontFamily: fontFamily.bold, fontSize: 15, color: palette.text, flex: 1 },
  loadMeta: { ...typography.caption, textTransform: 'none' },
  loadDate: { ...typography.caption, textTransform: 'none', color: palette.textMuted, marginTop: spacing[1] },
});
