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
import { getDriverBids } from '../../../src/services/bids.service';
import type { DriverBid } from '../../../src/types/bid';
import { palette } from '../../../src/theme/colors';
import { typography } from '../../../src/theme/typography';
import { space, spacing } from '../../../src/theme/spacing';
import { formatCurrencyTRY, formatDateTR } from '../../../src/utils/format';
import { getBidStatusPill } from '../../../src/utils/statusPills';

export default function DriverBidsScreen() {
  const { contentInset } = useScreenInsets();
  const router = useRouter();
  const [bids, setBids] = useState<DriverBid[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setError('');
      const data = await getDriverBids();
      setBids(data);
    } catch (e) {
      setError(getApiErrorMessage(e));
      setBids([]);
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
        <LoadingState message="Teklifler yükleniyor..." variant="skeleton" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <FlatList
        data={bids}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[styles.list, contentInset]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.brand} />
        }
        ListHeaderComponent={
          <>
            <ScreenHeader title="Tekliflerim" subtitle="Verdiğiniz yük teklifleri" />
            {error ? <AlertBanner message={error} tone="error" /> : null}
          </>
        }
        ListEmptyComponent={
          !error ? (
            <EmptyState
              icon="🏷️"
              title="Henüz teklifiniz yok"
              description="Yük panosundan ilanlara teklif verebilirsiniz."
            />
          ) : null
        }
        renderItem={({ item, index }) => {
          const pill = getBidStatusPill(item.status);
          return (
            <FadeInView delay={Math.min(index * 40, 200)}>
              <PressableScale
                onPress={() =>
                  router.push({ pathname: '/(driver)/load-detail', params: { id: item.loadId } })
                }
              >
                <Card variant="glass" padding={4} style={styles.card}>
                  <View style={styles.cardTop}>
                    <Text style={styles.route}>
                      {item.fromCity} → {item.toCity}
                    </Text>
                    <StatusPill label={pill.label} tone={pill.tone} />
                  </View>
                  <Text style={styles.price}>{formatCurrencyTRY(item.amount)}</Text>
                  <Text style={styles.date}>{formatDateTR(item.offerDate)}</Text>
                  {item.note ? <Text style={styles.note}>Not: {item.note}</Text> : null}
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
  card: { marginBottom: space.sm },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: space.sm,
    marginBottom: space.sm,
  },
  route: { ...typography.bodyMedium, flex: 1 },
  price: { ...typography.bodyMedium, fontSize: 16, color: palette.gold },
  date: { ...typography.caption, textTransform: 'none' },
  note: { ...typography.caption, textTransform: 'none', color: palette.textMuted, marginTop: space.xs },
});
