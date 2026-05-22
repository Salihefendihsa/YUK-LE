import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScreenHeader } from '../../../src/components/ScreenHeader';
import { AlertBanner } from '../../../src/components/ui/AlertBanner';
import { Card } from '../../../src/components/ui/Card';
import { LoadingState } from '../../../src/components/ui/LoadingState';
import { screenRootStyle } from '../../../src/constants/layout';
import { getDriverDashboard } from '../../../src/services/dashboard.service';
import { getApiErrorMessage } from '../../../src/services/api.client';
import type { DriverDashboard } from '../../../src/types/dashboard';
import { useAuthStore } from '../../../src/store/auth.store';
import { palette } from '../../../src/theme/colors';
import { fontFamily, typography } from '../../../src/theme/typography';
import { spacing } from '../../../src/theme/spacing';
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
      <View style={screenRootStyle}>
        <LoadingState message="Panel yukleniyor..." />
      </View>
    );
  }

  return (
    <ScrollView
      style={screenRootStyle}
      contentContainerStyle={styles.scroll}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.brand} />
      }
    >
      <ScreenHeader title="Sofor Paneli" subtitle="Ozet istatistikler" />

      {error ? <AlertBanner message={error} tone="error" /> : null}

      <Card variant="glass" padding={5} style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={styles.heroIcon}>
            <Ionicons name="person-circle-outline" size={28} color={palette.brand} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroHello}>Merhaba, {firstName}</Text>
            <Text style={styles.heroSub}>Toplam kazanc ve aktif teklifler</Text>
          </View>
        </View>
        <View style={styles.heroEarnRow}>
          <Text style={styles.heroEarnLabel}>Toplam kazanc</Text>
          <Text style={styles.heroEarn}>{formatCurrencyTRY(Number(stats?.totalEarnings ?? 0))}</Text>
          <Text style={styles.heroMeta}>Aktif teklif: {stats?.activeBidCount ?? 0}</Text>
        </View>
      </Card>

      <View style={styles.grid}>
        <StatCard label="Aktif Teklif" value={String(stats?.activeBidCount ?? 0)} icon="pricetag-outline" />
        <StatCard label="Tamamlanan Sefer" value={String(stats?.completedJobCount ?? 0)} icon="checkmark-done-outline" />
        <StatCard
          label="Toplam Kazanc"
          value={formatCurrencyTRY(Number(stats?.totalEarnings ?? 0))}
          icon="wallet-outline"
          wide
        />
      </View>

      <Pressable onPress={() => router.push('/(driver)/documents')}>
        <Card variant="elevated" padding={5} style={styles.docsCard}>
          <View style={styles.docsRow}>
            <Ionicons name="document-text-outline" size={22} color={palette.brand} />
            <View style={{ flex: 1 }}>
              <Text style={styles.docsTitle}>Belgelerim</Text>
              <Text style={styles.docsSub}>Ehliyet, SRC, psikoteknik yukleme</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={palette.textMuted} />
          </View>
        </Card>
      </Pressable>
    </ScrollView>
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
  heroEarnRow: {
    borderTopWidth: 1,
    borderTopColor: palette.borderSubtle,
    paddingTop: spacing[4],
    gap: spacing[1],
  },
  heroEarnLabel: { ...typography.label, color: palette.textMuted },
  heroEarn: {
    fontFamily: fontFamily.bold,
    fontSize: 26,
    color: palette.gold,
  },
  heroMeta: { ...typography.caption, textTransform: 'none' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3] },
  stat: { width: '47%', flexGrow: 1, minWidth: 140 },
  statWide: { width: '100%' },
  statValue: {
    fontFamily: fontFamily.bold,
    fontSize: 17,
    color: palette.text,
    marginBottom: spacing[1],
  },
  statLabel: { ...typography.caption, textTransform: 'none', color: palette.textMuted },
  docsCard: { borderColor: palette.brandBorder },
  docsRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  docsTitle: { fontFamily: fontFamily.semiBold, fontSize: 16, color: palette.brand },
  docsSub: { ...typography.caption, textTransform: 'none', marginTop: 2 },
});
