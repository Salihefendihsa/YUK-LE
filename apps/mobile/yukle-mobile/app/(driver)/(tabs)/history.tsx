import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { ScreenHeader } from '../../../src/components/ScreenHeader';
import { AlertBanner } from '../../../src/components/ui/AlertBanner';
import { Card } from '../../../src/components/ui/Card';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { FadeInView } from '../../../src/components/ui/FadeInView';
import { LoadingState } from '../../../src/components/ui/LoadingState';
import { PressableScale } from '../../../src/components/ui/PressableScale';
import { StatusPill } from '../../../src/components/ui/StatusPill';
import { ScreenContainer, useScreenInsets } from '../../../src/constants/layout';
import { getApiErrorMessage } from '../../../src/services/api.client';
import { getDriverLoadHistory } from '../../../src/services/history.service';
import {
  getWalletTransactions,
  mapReleaseEarningsByLoadId,
  sumReleaseEarnings,
} from '../../../src/services/wallet.service';
import type { DriverHistoryRow } from '../../../src/types/history';
import { palette } from '../../../src/theme/colors';
import { typography } from '../../../src/theme/typography';
import { space, spacing } from '../../../src/theme/spacing';
import { formatCurrencyTRY, formatDateTR } from '../../../src/utils/format';
import { getLoadStatusPill } from '../../../src/utils/statusPills';

export default function DriverHistoryScreen() {
  const { contentInset } = useScreenInsets();
  const router = useRouter();
  const [items, setItems] = useState<DriverHistoryRow[]>([]);
  const [totalEarn, setTotalEarn] = useState(0);
  const [tripCount, setTripCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setError('');
      const [data, txs] = await Promise.all([
        getDriverLoadHistory(1, 50),
        getWalletTransactions(),
      ]);
      const earnMap = mapReleaseEarningsByLoadId(txs);
      const enriched = data.items.map((row) => ({
        ...row,
        netEarn: earnMap.get(row.id) ?? null,
      }));
      setItems(enriched);
      setTripCount(data.tripCount);
      setTotalEarn(sumReleaseEarnings(txs) || data.totalEarn);
    } catch (e) {
      setError(getApiErrorMessage(e));
      setItems([]);
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
        <LoadingState message="Geçmiş seferler yükleniyor..." variant="skeleton" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, contentInset]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.brand} />
        }
        ListHeaderComponent={
          <>
            <ScreenHeader title="Geçmiş" subtitle="Tamamlanan işler ve kazanç özeti" />
            {error ? <AlertBanner message={error} tone="error" /> : null}
            <Card variant="elevated" padding={4} style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Toplam net kazanç · Sefer</Text>
              <Text style={styles.summaryValue}>
                {formatCurrencyTRY(totalEarn)} · {tripCount} sefer
              </Text>
              <Text style={styles.summaryHint}>Cüzdan ödeme kayıtlarına göre</Text>
            </Card>
          </>
        }
        ListEmptyComponent={
          !error ? (
            <EmptyState
              icon="📜"
              title="Henüz tamamlanmış seferiniz yok"
              description="Teslim edilen seferler burada listelenecek."
            />
          ) : null
        }
        renderItem={({ item, index }) => {
          const pill = getLoadStatusPill(item.status ?? 'Delivered');
          const earn = item.netEarn != null && item.netEarn > 0 ? item.netEarn : null;
          return (
            <FadeInView delay={Math.min(index * 40, 200)}>
              <PressableScale
                onPress={() =>
                  router.push({
                    pathname: '/(driver)/history-detail',
                    params: {
                      id: item.id,
                      netEarn: earn != null ? String(earn) : '',
                    },
                  })
                }
              >
                <Card variant="default" padding={4} style={styles.card}>
                  <View style={styles.cardTop}>
                    <Text style={styles.route}>
                      {item.fromCity} → {item.toCity}
                    </Text>
                    <StatusPill label={pill.label} tone={pill.tone} />
                  </View>
                  <Text style={styles.meta}>Müşteri: {item.customerName ?? '-'}</Text>
                  <Text style={styles.meta}>
                    Tarih: {item.deliveryDate ? formatDateTR(item.deliveryDate) : '-'}
                  </Text>
                  <Text style={styles.price}>
                    {earn != null ? formatCurrencyTRY(earn) : 'Kazanç bekleniyor'}
                  </Text>
                  {earn == null ? (
                    <Text style={styles.listHint}>Liste: {formatCurrencyTRY(item.price)}</Text>
                  ) : (
                    <Text style={styles.listHint}>Net ödeme (cüzdan)</Text>
                  )}
                </Card>
              </PressableScale>
            </FadeInView>
          );
        }}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: { padding: space.md, paddingBottom: space.xl, gap: spacing[3] },
  summaryCard: { marginBottom: space.md, borderColor: palette.goldBorder },
  summaryLabel: { ...typography.label, color: palette.textMuted },
  summaryValue: { ...typography.h2, color: palette.gold, marginTop: space.xs },
  summaryHint: { ...typography.caption, textTransform: 'none', marginTop: space.xs, color: palette.textMuted },
  card: { marginBottom: space.sm },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: space.sm,
    marginBottom: space.sm,
  },
  route: { ...typography.bodyMedium, fontSize: 16, flex: 1 },
  meta: { ...typography.caption, textTransform: 'none' },
  price: { ...typography.bodyMedium, color: palette.brand, marginTop: space.sm },
  listHint: { ...typography.caption, textTransform: 'none', color: palette.textMuted, marginTop: space.xs },
});
