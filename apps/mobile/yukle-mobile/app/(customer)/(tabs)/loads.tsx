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
import { TextField } from '../../../src/components/ui/TextField';
import { ScreenContainer, useScreenInsets } from '../../../src/constants/layout';
import { getApiErrorMessage } from '../../../src/services/api.client';
import { getActiveLoadsPaged } from '../../../src/services/loads.service';
import type { Load } from '../../../src/types/load';
import { palette } from '../../../src/theme/colors';
import { typography } from '../../../src/theme/typography';
import { space, spacing } from '../../../src/theme/spacing';
import { radius } from '../../../src/theme/radius';
import { sizes } from '../../../src/theme/sizes';
import { formatCurrencyTRY } from '../../../src/utils/format';
import { getLoadStatusPill } from '../../../src/utils/statusPills';

const PAGE_SIZE = 20;

export default function CustomerLoadsScreen() {
  const { contentInset } = useScreenInsets();
  const router = useRouter();
  const [loads, setLoads] = useState<Load[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [cityQ, setCityQ] = useState('');
  const [appliedCity, setAppliedCity] = useState('');

  const fetchPage = useCallback(
    async (pageNum: number, replace: boolean) => {
      const result = await getActiveLoadsPaged({
        page: pageNum,
        pageSize: PAGE_SIZE,
        fromCity: appliedCity || undefined,
        toCity: appliedCity || undefined,
        sortBy: 'date',
      });
      setTotal(result.total);
      setPage(result.page);
      setLoads((prev) => (replace ? result.items : [...prev, ...result.items]));
    },
    [appliedCity]
  );

  const loadInitial = useCallback(async () => {
    try {
      setError('');
      await fetchPage(1, true);
    } catch (e) {
      setError(getApiErrorMessage(e));
      setLoads([]);
      setTotal(0);
    }
  }, [fetchPage]);

  useEffect(() => {
    setLoading(true);
    loadInitial().finally(() => setLoading(false));
  }, [loadInitial]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInitial();
    setRefreshing(false);
  };

  const loadMore = async () => {
    if (loadingMore || loads.length >= total) return;
    setLoadingMore(true);
    try {
      await fetchPage(page + 1, false);
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setLoadingMore(false);
    }
  };

  const hasMore = loads.length < total;

  if (loading && loads.length === 0) {
    return (
      <ScreenContainer>
        <LoadingState message="İlanlar yükleniyor..." variant="skeleton" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <FlatList
        data={loads}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, contentInset]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.brand} />
        }
        ListHeaderComponent={
          <View style={styles.headerPad}>
            <ScreenHeader
              title="İlanlarım"
              subtitle="Tüm ilanlar ve durumları"
              right={
                <PressableScale
                  style={styles.createBtn}
                  onPress={() => router.push('/(customer)/(tabs)/create-load')}
                >
                  <Text style={styles.createBtnText}>+ Yeni</Text>
                </PressableScale>
              }
            />
            {error ? <AlertBanner message={error} tone="error" /> : null}
            <Card variant="default" padding={4} style={styles.filterCard}>
              <TextField
                label="Şehir filtresi"
                placeholder="Çıkış veya varış"
                value={cityQ}
                onChangeText={setCityQ}
              />
              <View style={styles.filterActions}>
                <SecondaryButton title="Filtrele" onPress={() => setAppliedCity(cityQ.trim())} />
                <SecondaryButton
                  title="Temizle"
                  onPress={() => {
                    setCityQ('');
                    setAppliedCity('');
                  }}
                />
              </View>
              {total > 0 ? (
                <Text style={styles.resultCount}>
                  {loads.length} / {total} ilan
                </Text>
              ) : null}
            </Card>
          </View>
        }
        ListEmptyComponent={
          !error ? (
            <EmptyState
              icon="📦"
              title="Henüz ilanınız yok"
              description="İlan Oluştur ile başlayın."
              actionLabel="İlan Oluştur"
              onAction={() => router.push('/(customer)/(tabs)/create-load')}
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
                <ActivityIndicator color={palette.brand} style={{ marginTop: space.sm }} />
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
          const pill = getLoadStatusPill(item.status);
          const bidCount = item.bidCount ?? 0;
          return (
            <FadeInView delay={Math.min(index * 40, 200)}>
              <PressableScale
                onPress={() =>
                  router.push({ pathname: '/(customer)/load-detail', params: { id: item.id } })
                }
              >
                <Card variant="elevated" padding={4} style={styles.card}>
                  <View style={styles.cardTop}>
                    <Text style={styles.route}>
                      {item.fromCity} → {item.toCity}
                    </Text>
                    <StatusPill label={pill.label} tone={pill.tone} />
                  </View>
                  <View style={styles.priceRow}>
                    <Text style={styles.price}>{formatCurrencyTRY(item.price)}</Text>
                    <Text style={styles.meta}>{item.loadType ?? item.type ?? '-'}</Text>
                  </View>
                  <View style={styles.bidRow}>
                    <Text style={styles.bidLabel}>Gelen teklif</Text>
                    <View style={[styles.bidBadge, bidCount > 0 && styles.bidBadgeHot]}>
                      <Text style={[styles.bidCount, bidCount > 0 && styles.bidCountHot]}>
                        {bidCount}
                      </Text>
                    </View>
                  </View>
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
  headerPad: { paddingHorizontal: space.md, paddingTop: space.md, gap: spacing[3] },
  filterCard: { gap: spacing[3], marginBottom: space.sm },
  filterActions: { flexDirection: 'row', gap: space.sm },
  resultCount: { ...typography.caption, textTransform: 'none', color: palette.textMuted },
  list: { paddingHorizontal: space.md, paddingBottom: space.xl, gap: spacing[3] },
  createBtn: {
    backgroundColor: palette.brand,
    borderRadius: radius.sm,
    paddingHorizontal: spacing[3],
    paddingVertical: space.sm,
    minHeight: sizes.button.compact,
    justifyContent: 'center',
  },
  createBtnText: { ...typography.bodySmall, fontFamily: typography.bodyMedium.fontFamily, color: palette.onBrand },
  card: { marginBottom: spacing[3] },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: space.sm,
    marginBottom: space.sm,
  },
  route: { ...typography.bodyMedium, fontSize: 16, flex: 1 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: space.sm },
  price: { fontFamily: typography.h2.fontFamily, fontSize: 18, color: palette.text },
  meta: { ...typography.caption, textTransform: 'none' },
  bidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing[3],
    paddingTop: space.sm,
    borderTopWidth: 1,
    borderTopColor: palette.borderSubtle,
  },
  bidLabel: { ...typography.bodySmall, color: palette.textSecondary },
  bidBadge: {
    minWidth: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bidBadgeHot: {
    backgroundColor: palette.brandMuted,
    borderColor: palette.brandBorder,
  },
  bidCount: { ...typography.bodySmall, fontFamily: typography.bodyMedium.fontFamily, color: palette.textMuted },
  bidCountHot: { color: palette.brand },
  footer: { paddingVertical: space.md },
  footerPad: { height: space.md },
});
