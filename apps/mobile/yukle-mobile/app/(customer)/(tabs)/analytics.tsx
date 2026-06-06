import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenHeader } from '../../../src/components/ScreenHeader';
import { AlertBanner } from '../../../src/components/ui/AlertBanner';
import { Card } from '../../../src/components/ui/Card';
import { FadeInView } from '../../../src/components/ui/FadeInView';
import { LoadingState } from '../../../src/components/ui/LoadingState';
import { StatusPill } from '../../../src/components/ui/StatusPill';
import {
  DEMO_CARBON_REDUCTION_PCT,
  DEMO_CARBON_TONNES,
  DEMO_MONTHLY_SAVINGS_TRY,
} from '../../../src/constants/customer-analytics-demo';
import { ScreenContainer, ScreenScroll } from '../../../src/constants/layout';
import { getApiErrorMessage } from '../../../src/services/api.client';
import { getCustomerLoadHistory } from '../../../src/services/history.service';
import { getUserRatings } from '../../../src/services/ratings.service';
import { useAuthStore } from '../../../src/store/auth.store';
import type { CustomerHistoryRow } from '../../../src/types/history';
import { palette } from '../../../src/theme/colors';
import { radius } from '../../../src/theme/radius';
import { space, spacing } from '../../../src/theme/spacing';
import { typography } from '../../../src/theme/typography';
import { useRoleAccent } from '../../../src/theme/useRoleAccent';
import { formatCurrencyTRY } from '../../../src/utils/format';

const MONTHS_TR = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

type MonthSpend = { label: string; value: number };
type TopRoute = { route: string; count: number };

/** Son 6 ay harcama (teslim edilen ilan price toplamı, deliveryDate ayına göre). */
function computeMonthlySpend(rows: CustomerHistoryRow[]): MonthSpend[] {
  const now = new Date();
  const buckets = Array.from({ length: 6 }, (_, k) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - k), 1);
    return { key: `${d.getFullYear()}-${d.getMonth()}`, label: MONTHS_TR[d.getMonth()], value: 0 };
  });
  const indexByKey = new Map(buckets.map((b, i) => [b.key, i]));
  for (const r of rows) {
    if (!r.deliveryDate) continue;
    const d = new Date(r.deliveryDate);
    if (Number.isNaN(d.getTime())) continue;
    const idx = indexByKey.get(`${d.getFullYear()}-${d.getMonth()}`);
    if (idx !== undefined) buckets[idx].value += r.price ?? 0;
  }
  return buckets.map((b) => ({ label: b.label, value: b.value }));
}

/** En çok kullanılan güzergahlar: fromCity→toCity gruplama, sefer sayısına göre ilk 3. */
function computeTopRoutes(rows: CustomerHistoryRow[]): TopRoute[] {
  const counts = new Map<string, number>();
  for (const r of rows) {
    const from = r.fromCity?.trim();
    const to = r.toCity?.trim();
    if (!from || !to) continue;
    const key = `${from} → ${to}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([route, count]) => ({ route, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
}

/**
 * Müşteri Analitik — web customer/Analytics.tsx parity, GERÇEK veri.
 * Kaynaklar (web ile aynı): memnuniyet = Ratings; harcama trendi + güzergahlar +
 * toplam harcama = müşteri history (dashboard ile aynı kaynak). Karbon ve tasarruf
 * henüz türetilebilir veri olmadığından "(demo)" etiketli kalır.
 */
export default function CustomerAnalyticsScreen() {
  const userId = useAuthStore((s) => s.user?.userId);
  const accent = useRoleAccent();

  const [rows, setRows] = useState<CustomerHistoryRow[]>([]);
  const [totalSpend, setTotalSpend] = useState(0);
  const [rating, setRating] = useState<{ average: number; count: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setError('');
    try {
      const [history, ratings] = await Promise.all([
        getCustomerLoadHistory(1, 200),
        userId ? getUserRatings(userId) : Promise.resolve(null),
      ]);
      setRows(history.items);
      setTotalSpend(history.totalSpend);
      setRating(ratings && ratings.count > 0 ? ratings : null);
    } catch (e) {
      setError(getApiErrorMessage(e));
    }
  }, [userId]);

  useEffect(() => {
    void fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <ScreenContainer>
        <LoadingState message="Analitik yükleniyor…" variant="skeleton" />
      </ScreenContainer>
    );
  }

  const monthlySpend = computeMonthlySpend(rows);
  const topRoutes = computeTopRoutes(rows);
  const maxSpend = Math.max(...monthlySpend.map((m) => m.value), 1);

  return (
    <ScreenScroll
      contentContainerStyle={styles.scroll}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.brand} />}
    >
      <ScreenHeader title="Analitik" subtitle="Harcama, güzergah ve memnuniyet özeti" />

      {error ? <AlertBanner message={error} tone="error" /> : null}

      <FadeInView>
        <Card variant="hero" padding={5} accent={accent}>
          <Text style={styles.heroLabel}>Toplam harcama</Text>
          <Text style={[styles.heroValue, { color: accent.hero.value }]}>{formatCurrencyTRY(totalSpend)}</Text>
          <Text style={styles.cardSub}>{rows.length} tamamlanan sefer · son 6 ay</Text>
        </Card>
      </FadeInView>

      <FadeInView delay={50}>
        <Card variant="elevated" padding={4}>
          <Text style={styles.cardTitle}>Aylık harcama trendi</Text>
          <View style={styles.barChart}>
            {monthlySpend.map((m, i) => (
              <View key={`${m.label}-${i}`} style={styles.barWrap}>
                <LinearGradient
                  colors={accent.bar}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={[styles.bar, { height: Math.max(6, (m.value / maxSpend) * 130) }]}
                />
                <Text style={styles.barLabel}>{m.label}</Text>
              </View>
            ))}
          </View>
        </Card>
      </FadeInView>

      <FadeInView delay={60}>
        <Card variant="default" padding={4}>
          <Text style={styles.cardTitle}>En çok kullanılan güzergahlar</Text>
          {topRoutes.length === 0 ? (
            <Text style={styles.emptyLine}>Henüz tamamlanmış sefer yok.</Text>
          ) : (
            topRoutes.map((r, i) => (
              <View key={r.route} style={styles.routeRow}>
                <Text style={styles.routeIndex}>{i + 1}</Text>
                <Text style={styles.routeLine}>{r.route}</Text>
                <Text style={styles.routeCount}>{r.count} sefer</Text>
              </View>
            ))
          )}
        </Card>
      </FadeInView>

      <FadeInView delay={120}>
        <Card variant="default" padding={4}>
          <Text style={styles.cardTitle}>Memnuniyet puanınız</Text>
          {rating ? (
            <>
              <Text style={styles.bigStat}>{rating.average.toFixed(1)}</Text>
              <Text style={styles.cardSub}>{rating.count} değerlendirme ortalaması</Text>
            </>
          ) : (
            <>
              <Text style={styles.bigStatMuted}>—</Text>
              <Text style={styles.cardSub}>Henüz değerlendirme yok</Text>
            </>
          )}
        </Card>
      </FadeInView>

      <FadeInView delay={180}>
        <Card variant="default" padding={4}>
          <View style={styles.demoTitleRow}>
            <Text style={styles.cardTitle}>Karbon ayak izi</Text>
            <StatusPill label="DEMO" tone="neutral" />
          </View>
          <Text style={styles.bodyText}>
            Tahmini emisyon: <Text style={styles.strong}>{DEMO_CARBON_TONNES} t CO₂e</Text> bu ay. Yeşil araç
            tercihi ile <Text style={styles.strong}>%{DEMO_CARBON_REDUCTION_PCT}</Text> azaltılabilir.
          </Text>
        </Card>
      </FadeInView>

      <FadeInView delay={240}>
        <Card variant="elevated" padding={4} style={styles.savingsCard}>
          <View style={styles.demoTitleRow}>
            <Text style={styles.cardTitle}>Bu ay tasarruf</Text>
            <StatusPill label="DEMO" tone="neutral" />
          </View>
          <Text style={styles.bigStatGold}>{formatCurrencyTRY(DEMO_MONTHLY_SAVINGS_TRY)}</Text>
          <Text style={styles.cardSub}>Akıllı eşleştirme ve güzergah optimizasyonu ile.</Text>
        </Card>
      </FadeInView>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: space.md, paddingBottom: spacing[10], gap: space.md },
  spendHead: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
  totalSpend: { ...typography.h2, color: palette.brand },
  heroLabel: {
    fontFamily: typography.label.fontFamily,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: palette.textSecondary,
  },
  heroValue: { fontFamily: typography.h1.fontFamily, fontSize: 30, marginTop: space.xs, marginBottom: space.xs },
  cardTitle: { ...typography.h3 },
  cardSub: { ...typography.caption, textTransform: 'none', marginTop: space.xs },
  barChart: { flexDirection: 'row', alignItems: 'flex-end', gap: space.sm, height: 150, marginTop: space.md },
  barWrap: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: space.sm },
  bar: {
    width: '100%',
    maxWidth: 32,
    borderTopLeftRadius: radius.sm,
    borderTopRightRadius: radius.sm,
    backgroundColor: palette.brand,
    minHeight: 6,
  },
  barLabel: { ...typography.caption, textTransform: 'none', fontSize: 10 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], marginTop: space.sm },
  routeIndex: { ...typography.bodySmall, color: palette.brand, width: 20, fontFamily: typography.bodyMedium.fontFamily },
  routeLine: { ...typography.body, flex: 1 },
  routeCount: { ...typography.caption, textTransform: 'none', color: palette.textMuted },
  bigStat: { ...typography.h1, fontSize: 42, color: palette.brand, marginVertical: space.sm },
  bigStatMuted: { ...typography.h1, fontSize: 42, color: palette.textMuted, marginVertical: space.sm },
  bigStatGold: { ...typography.h2, fontSize: 32, color: palette.gold, marginVertical: space.sm },
  bodyText: { ...typography.body, color: palette.textSecondary, marginTop: space.sm },
  strong: { color: palette.text, fontFamily: typography.bodyMedium.fontFamily },
  savingsCard: { borderColor: palette.goldBorder },
  demoTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  emptyLine: { ...typography.bodySmall, color: palette.textMuted, marginTop: space.sm },
});
