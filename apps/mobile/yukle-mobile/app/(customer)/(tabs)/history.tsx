import { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { ScreenHeader } from '../../../src/components/ScreenHeader';
import { AlertBanner } from '../../../src/components/ui/AlertBanner';
import { Card } from '../../../src/components/ui/Card';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { LoadingState } from '../../../src/components/ui/LoadingState';
import { StatusPill } from '../../../src/components/ui/StatusPill';
import { ScreenContainer, ScreenScroll, useScreenInsets } from '../../../src/constants/layout';
import { getApiErrorMessage } from '../../../src/services/api.client';
import { getCustomerLoadHistory } from '../../../src/services/history.service';
import type { CustomerHistoryRow } from '../../../src/types/history';
import { palette } from '../../../src/theme/colors';
import { fontFamily, typography } from '../../../src/theme/typography';
import { spacing } from '../../../src/theme/spacing';
import { formatCurrencyTRY, formatDateTR } from '../../../src/utils/format';
import { getLoadStatusPill } from '../../../src/utils/statusPills';

export default function CustomerHistoryScreen() {
  const { contentInset } = useScreenInsets();
  const [items, setItems] = useState<CustomerHistoryRow[]>([]);
  const [totalSpend, setTotalSpend] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setError('');
      const data = await getCustomerLoadHistory(1, 50);
      setItems(data.items);
      setTotalSpend(data.totalSpend);
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
        <LoadingState message="Geçmiş seferler yükleniyor..." />
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
            <ScreenHeader title="Geçmiş" subtitle="Tamamlanan teslimatlar ve toplam harcama" />

            {error ? <AlertBanner message={error} tone="error" /> : null}

            <Card variant="glass" padding={4} style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Toplam harcama</Text>
              <Text style={styles.summaryValue}>{formatCurrencyTRY(totalSpend)}</Text>
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
        renderItem={({ item }) => {
          const pill = getLoadStatusPill(item.status ?? 'Delivered');
          return (
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
              <Text style={styles.price}>{formatCurrencyTRY(item.price)}</Text>
            </Card>
          );
        }}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing[4], paddingBottom: spacing[8], gap: spacing[3] },
  title: { ...typography.h1, marginTop: spacing[3] },
  sub: { ...typography.caption, textTransform: 'none', marginBottom: spacing[4] },
  summaryCard: { marginBottom: spacing[4], borderColor: palette.goldBorder },
  summaryLabel: { ...typography.label, color: palette.textMuted },
  summaryValue: {
    fontFamily: fontFamily.bold,
    fontSize: 22,
    color: palette.gold,
    marginTop: spacing[1],
  },
  card: { marginBottom: spacing[2] },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  route: { fontFamily: fontFamily.bold, fontSize: 16, color: palette.text, flex: 1 },
  meta: { ...typography.caption, textTransform: 'none' },
  price: {
    fontFamily: fontFamily.bold,
    fontSize: 15,
    color: palette.brand,
    marginTop: spacing[2],
  },
});
