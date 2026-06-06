import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import { ScreenHeader } from '../../../src/components/ScreenHeader';
import { AlertBanner } from '../../../src/components/ui/AlertBanner';
import { Card } from '../../../src/components/ui/Card';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { FadeInView } from '../../../src/components/ui/FadeInView';
import { LoadingState } from '../../../src/components/ui/LoadingState';
import { PressableScale } from '../../../src/components/ui/PressableScale';
import { ScreenContainer, ScreenScroll } from '../../../src/constants/layout';
import { getDriverDashboard } from '../../../src/services/dashboard.service';
import { getApiErrorMessage } from '../../../src/services/api.client';
import { getRecommendedLoads, type MatchedLoad } from '../../../src/services/matching.service';
import { getUserProfile } from '../../../src/services/user.service';
import type { DriverDashboard } from '../../../src/types/dashboard';
import { useAuthStore } from '../../../src/store/auth.store';
import { useNotificationsStore } from '../../../src/store/notifications.store';
import { palette } from '../../../src/theme/colors';
import { typography } from '../../../src/theme/typography';
import { space, spacing } from '../../../src/theme/spacing';
import { radius } from '../../../src/theme/radius';
import { formatCurrencyTRY } from '../../../src/utils/format';

export default function DriverDashboardScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hubError = useNotificationsStore((s) => s.hubError);
  const [displayName, setDisplayName] = useState(user?.fullName?.trim() || '');
  const [stats, setStats] = useState<DriverDashboard | null>(null);
  const [recommended, setRecommended] = useState<MatchedLoad[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const firstName =
    (displayName || user?.fullName || '').trim().split(/\s+/)[0] || 'Şoför';

  const fetchData = async () => {
    try {
      setError('');
      const tasks: Promise<unknown>[] = [
        getDriverDashboard().then(setStats),
        getRecommendedLoads().then(setRecommended),
      ];
      if (user?.userId) {
        tasks.push(
          getUserProfile(user.userId).then((p) => {
            if (p.fullName?.trim()) setDisplayName(p.fullName.trim());
          })
        );
      }
      await Promise.all(tasks);
    } catch (e) {
      setError(getApiErrorMessage(e));
    }
  };

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
  }, [user?.userId]);

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
      <ScreenHeader title="Şoför Paneli" subtitle="Özet istatistikler ve önerilen yükler" />

      {hubError ? <AlertBanner message={hubError} tone="info" /> : null}
      {error ? <AlertBanner message={error} tone="error" /> : null}

      <FadeInView>
      <Card variant="elevated" padding={5} style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={styles.heroIcon}>
            <Ionicons name="person-circle-outline" size={28} color={palette.brand} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroHello}>Merhaba, {firstName}</Text>
            <Text style={styles.heroSub}>Toplam kazanç ve aktif teklifler</Text>
          </View>
        </View>
        <View style={styles.heroEarnRow}>
          <Text style={styles.heroEarnLabel}>Toplam kazanç</Text>
          <Text style={styles.heroEarn}>{formatCurrencyTRY(Number(stats?.totalEarnings ?? 0))}</Text>
          <Text style={styles.heroMeta}>Aktif teklif: {stats?.activeBidCount ?? 0}</Text>
        </View>
      </Card>
      </FadeInView>

      <FadeInView delay={50}>
      <View style={styles.grid}>
        <StatCard label="Aktif Teklif" value={String(stats?.activeBidCount ?? 0)} icon="pricetag-outline" />
        <StatCard
          label="Tamamlanan Sefer"
          value={String(stats?.completedJobCount ?? 0)}
          icon="checkmark-done-outline"
        />
        <StatCard
          label="Toplam Kazanç"
          value={formatCurrencyTRY(Number(stats?.totalEarnings ?? 0))}
          icon="wallet-outline"
          wide
        />
      </View>
      </FadeInView>

      <FadeInView delay={100}>
      <Card variant="elevated" padding={4} style={styles.recCard}>
        <Text style={styles.recTitle}>Sizin için seçildi</Text>
        <Text style={styles.recSub}>Size uygun yük önerileri</Text>
        {recommended.length === 0 ? (
          <EmptyState
            icon="📦"
            title="Önerilen yük bulunamadı"
            description="Yeni eşleşmeler kısa sürede burada görünecek."
            actionLabel="Yük Panosu"
            onAction={() => router.push('/(driver)/(tabs)/loads')}
          />
        ) : (
          recommended.map((row, index) => (
            <FadeInView key={row.load.id} delay={120 + index * 40}>
            <PressableScale
              onPress={() =>
                router.push({
                  pathname: '/(driver)/load-detail',
                  params: { id: row.load.id },
                })
              }
              style={styles.recRow}
            >
              <View style={styles.recHead}>
                <Text style={styles.recRoute}>
                  {row.load.fromCity} → {row.load.toCity}
                </Text>
                <Text style={styles.recScore}>%{row.match.matchScore}</Text>
              </View>
              <Text style={styles.recReason} numberOfLines={2}>
                {row.match.personalizedReason || row.match.priorityTag}
              </Text>
              <Text style={styles.recPrice}>{formatCurrencyTRY(row.load.price)}</Text>
            </PressableScale>
            </FadeInView>
          ))
        )}
      </Card>
      </FadeInView>

      <FadeInView delay={150}>
      <PressableScale onPress={() => router.push('/(driver)/(tabs)/documents')}>
        <Card variant="elevated" padding={5} style={styles.docsCard}>
          <View style={styles.docsRow}>
            <Ionicons name="document-text-outline" size={22} color={palette.brand} />
            <View style={{ flex: 1 }}>
              <Text style={styles.docsTitle}>Belgelerim</Text>
              <Text style={styles.docsSub}>Ehliyet, SRC, psikoteknik yükleme</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={palette.textMuted} />
          </View>
        </Card>
      </PressableScale>
      </FadeInView>
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
      <Ionicons name={icon} size={18} color={palette.gold} style={{ marginBottom: space.sm }} />
      <Text style={styles.statValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: space.md, paddingBottom: space.xl, gap: space.md },
  hero: { gap: space.md },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: palette.brandMuted,
    borderWidth: 1,
    borderColor: palette.brandBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroHello: { ...typography.h2, fontSize: 18 },
  heroSub: { ...typography.caption, textTransform: 'none', marginTop: space.xs },
  heroEarnRow: {
    borderTopWidth: 1,
    borderTopColor: palette.borderSubtle,
    paddingTop: space.md,
    gap: space.xs,
  },
  heroEarnLabel: { ...typography.label, color: palette.textMuted },
  heroEarn: { ...typography.h1, fontSize: 26, color: palette.gold },
  heroMeta: { ...typography.caption, textTransform: 'none' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3] },
  stat: { width: '47%', flexGrow: 1, flexShrink: 1, minWidth: 0, maxWidth: '48%' },
  statWide: { width: '100%' },
  statValue: { ...typography.bodyMedium, fontSize: 17, marginBottom: space.xs },
  statLabel: { ...typography.caption, textTransform: 'none', color: palette.textMuted },
  recCard: { gap: spacing[3], borderColor: palette.goldBorder },
  recTitle: { ...typography.bodyMedium, color: palette.gold },
  recSub: { ...typography.caption, textTransform: 'none', marginBottom: space.sm },
  recRow: {
    paddingVertical: spacing[3],
    borderTopWidth: 1,
    borderTopColor: palette.borderSubtle,
    gap: space.xs,
  },
  recHead: { flexDirection: 'row', justifyContent: 'space-between', gap: space.sm },
  recRoute: { ...typography.bodySmall, fontFamily: typography.bodyMedium.fontFamily, flex: 1 },
  recScore: { ...typography.bodySmall, color: palette.brand, fontFamily: typography.bodyMedium.fontFamily },
  recReason: { ...typography.caption, textTransform: 'none' },
  recPrice: { ...typography.bodySmall, color: palette.gold, fontFamily: typography.bodyMedium.fontFamily, marginTop: space.xs },
  docsCard: { borderColor: palette.brandBorder },
  docsRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  docsTitle: { ...typography.bodyMedium, color: palette.brand },
  docsSub: { ...typography.caption, textTransform: 'none', marginTop: space.xs },
});
