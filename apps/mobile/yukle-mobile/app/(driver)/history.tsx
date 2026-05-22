import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { AlertBanner } from '../../src/components/ui/AlertBanner';
import { Card } from '../../src/components/ui/Card';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { LoadingState } from '../../src/components/ui/LoadingState';
import { StatusPill } from '../../src/components/ui/StatusPill';
import { screenRootStyle } from '../../src/constants/layout';
import { getApiErrorMessage } from '../../src/services/api.client';
import { getDriverLoadHistory } from '../../src/services/history.service';
import type { DriverHistoryRow } from '../../src/types/history';
import { palette } from '../../src/theme/colors';
import { fontFamily, typography } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';
import { formatCurrencyTRY, formatDateTR } from '../../src/utils/format';
import { getLoadStatusPill } from '../../src/utils/statusPills';

export default function DriverHistoryScreen() {
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
      const data = await getDriverLoadHistory(1, 50);
      setItems(data.items);
      setTotalEarn(data.totalEarn);
      setTripCount(data.tripCount);
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
      <View style={screenRootStyle}>
        <LoadingState message="Gecmis seferler yukleniyor..." />
      </View>
    );
  }

  return (
    <View style={screenRootStyle}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.brand} />
        }
        ListHeaderComponent={
          <>
            <Pressable onPress={() => router.back()}>
              <Text style={typography.link}>← Profil</Text>
            </Pressable>
            <Text style={styles.title}>Gecmis Seferlerim</Text>
            <Text style={styles.sub}>Tamamlanan isler ve kazanc ozeti</Text>

            {error ? <AlertBanner message={error} tone="error" /> : null}

            <Card variant="glass" padding={4} style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Toplam kazanc · Sefer</Text>
              <Text style={styles.summaryValue}>
                {formatCurrencyTRY(totalEarn)} · {tripCount} sefer
              </Text>
            </Card>
          </>
        }
        ListEmptyComponent={
          !error ? (
            <EmptyState
              icon="📜"
              title="Henuz tamamlanmis seferiniz yok"
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
              <Text style={styles.meta}>Musteri: {item.customerName ?? '-'}</Text>
              <Text style={styles.meta}>
                Tarih: {item.deliveryDate ? formatDateTR(item.deliveryDate) : '-'}
              </Text>
              <Text style={styles.price}>{formatCurrencyTRY(item.price)}</Text>
            </Card>
          );
        }}
      />
    </View>
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
    fontSize: 18,
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
