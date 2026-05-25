import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ScreenHeader } from '../../../src/components/ScreenHeader';
import { AlertBanner } from '../../../src/components/ui/AlertBanner';
import { Card } from '../../../src/components/ui/Card';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { FadeInView } from '../../../src/components/ui/FadeInView';
import { LoadingState } from '../../../src/components/ui/LoadingState';
import { PressableScale } from '../../../src/components/ui/PressableScale';
import { SecondaryButton } from '../../../src/components/ui/SecondaryButton';
import { StatusPill } from '../../../src/components/ui/StatusPill';
import { ScreenContainer, useScreenInsets } from '../../../src/constants/layout';
import { getApiErrorMessage } from '../../../src/services/api.client';
import { getCustomerLoadHistory } from '../../../src/services/history.service';
import {
  getWalletTransactions,
  mapCustomerPaymentByLoadId,
  sumCustomerPayments,
} from '../../../src/services/wallet.service';
import type { CustomerHistoryRow } from '../../../src/types/history';
import { palette } from '../../../src/theme/colors';
import { typography } from '../../../src/theme/typography';
import { space, spacing } from '../../../src/theme/spacing';
import { formatCurrencyTRY, formatDateTR } from '../../../src/utils/format';
import { getLoadStatusPill } from '../../../src/utils/statusPills';

const PAGE_SIZE = 20;

export default function CustomerHistoryScreen() {
  const { contentInset } = useScreenInsets();
  const router = useRouter();
  const [items, setItems] = useState<CustomerHistoryRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalSpend, setTotalSpend] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const enrichItems = useCallback(
    (rows: CustomerHistoryRow[], paymentMap: Map<string, number>) =>
      rows.map((row) => ({
        ...row,
        actualSpend: paymentMap.get(row.id) ?? null,
      })),
    []
  );

  const fetchPage = useCallback(
    async (pageNum: number, replace: boolean, paymentMap: Map<string, number>) => {
      const data = await getCustomerLoadHistory(pageNum, PAGE_SIZE);
      setTotal(data.total);
      setPage(pageNum);
      const enriched = enrichItems(data.items, paymentMap);
      setItems((prev) => (replace ? enriched : [...prev, ...enriched]));
    },
    [enrichItems]
  );

  const loadInitial = useCallback(async () => {
    try {
      setError('');
      const txs = await getWalletTransactions();
      const paymentMap = mapCustomerPaymentByLoadId(txs);
      setTotalSpend(sumCustomerPayments(txs) || 0);
      await fetchPage(1, true, paymentMap);
    } catch (e) {
      setError(getApiErrorMessage(e));
      setItems([]);
    }
  }, [fetchPage]);

  useEffect(() => {
    loadInitial().finally(() => setLoading(false));
  }, [loadInitial]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInitial();
    setRefreshing(false);
  };

  const loadMore = async () => {
    if (loadingMore || items.length >= total) return;
    setLoadingMore(true);
    try {
      const txs = await getWalletTransactions();
      const paymentMap = mapCustomerPaymentByLoadId(txs);
      await fetchPage(page + 1, false, paymentMap);
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setLoadingMore(false);
    }
  };

  const hasMore = items.length < total;

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
            <ScreenHeader title="Geçmiş" subtitle="Tamamlanan teslimatlar ve ödeme özeti" />
            {error ? <AlertBanner message={error} tone="error" /> : null}
            <Card variant="glass" padding={4} style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Toplam harcama (ödeme kayıtları)</Text>
              <Text style={styles.summaryValue}>{formatCurrencyTRY(totalSpend)}</Text>
              <Text style={styles.summaryHint}>Kabul edilen teklif / ödenen tutar</Text>
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
        ListFooterComponent={
          hasMore ? (
            <View style={styles.footer}>
              <SecondaryButton
                title={loadingMore ? 'Yükleniyor…' : 'Daha fazla yükle'}
                onPress={loadMore}
                disabled={loadingMore}
              />
              {loadingMore ? (
                <ActivityIndicator color={palette.brand} style={{ marginTop: spacing[2] }} />
              ) : null}
            </View>
          ) : (
            <View style={styles.footerPad} />
          )
        }
        onEndReached={() => {
          if (hasMore && !loadingMore) void loadMore();
        }}
        onEndReachedThreshold={0.3}
        renderItem={({ item, index }) => {
          const pill = getLoadStatusPill(item.status ?? 'Delivered');
          const spend =
            item.actualSpend != null && item.actualSpend > 0 ? item.actualSpend : null;
          return (
            <FadeInView delay={Math.min(index * 40, 200)}>
            <PressableScale
              onPress={() =>
                router.push({ pathname: '/(customer)/load-detail', params: { id: item.id } })
              }
            >
              <Card variant="default" padding={4} style={styles.card}>
                <View style={styles.cardTop}>
                  <Text style={styles.route}>
                    {item.fromCity} → {item.toCity}
                  </Text>
                  <StatusPill label={pill.label} tone={pill.tone} />
                </View>
                <Text style={styles.meta}>Şoför: {item.driverName ?? '-'}</Text>
                <Text style={styles.meta}>
                  Tarih: {item.deliveryDate ? formatDateTR(item.deliveryDate) : '-'}
                </Text>
                <Text style={styles.price}>
                  {spend != null ? formatCurrencyTRY(spend) : 'Ödeme kaydı bekleniyor'}
                </Text>
                {spend == null ? (
                  <Text style={styles.listHint}>Liste fiyatı: {formatCurrencyTRY(item.price)}</Text>
                ) : (
                  <Text style={styles.listHint}>Ödenen tutar</Text>
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
  footer: { paddingVertical: space.md },
  footerPad: { height: space.md },
});
