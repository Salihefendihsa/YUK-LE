import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ScreenHeader } from '../../../src/components/ScreenHeader';
import { AlertBanner } from '../../../src/components/ui/AlertBanner';
import { Card } from '../../../src/components/ui/Card';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { LoadingState } from '../../../src/components/ui/LoadingState';
import { SecondaryButton } from '../../../src/components/ui/SecondaryButton';
import { StatusPill } from '../../../src/components/ui/StatusPill';
import { TextField } from '../../../src/components/ui/TextField';
import { ScreenContainer, useScreenInsets } from '../../../src/constants/layout';
import { getApiErrorMessage } from '../../../src/services/api.client';
import { getActiveLoadsPaged } from '../../../src/services/loads.service';
import type { Load } from '../../../src/types/load';
import { palette } from '../../../src/theme/colors';
import { fontFamily, typography } from '../../../src/theme/typography';
import { spacing } from '../../../src/theme/spacing';
import { formatCurrencyTRY, formatWeightKg } from '../../../src/utils/format';
import { getLoadStatusPill } from '../../../src/utils/statusPills';

const PAGE_SIZE = 20;

export default function DriverLoadsScreen() {
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
  const [vehicleQ, setVehicleQ] = useState('');
  const [appliedCity, setAppliedCity] = useState('');
  const [appliedVehicle, setAppliedVehicle] = useState('');

  const fetchPage = useCallback(
    async (pageNum: number, replace: boolean) => {
      const result = await getActiveLoadsPaged({
        page: pageNum,
        pageSize: PAGE_SIZE,
        fromCity: appliedCity || undefined,
        toCity: appliedCity || undefined,
        vehicleType: appliedVehicle || undefined,
        sortBy: 'date',
      });
      setTotal(result.total);
      setPage(result.page);
      setLoads((prev) => (replace ? result.items : [...prev, ...result.items]));
    },
    [appliedCity, appliedVehicle]
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

  const applyFilters = () => {
    setAppliedCity(cityQ.trim());
    setAppliedVehicle(vehicleQ.trim());
  };

  const clearFilters = () => {
    setCityQ('');
    setVehicleQ('');
    setAppliedCity('');
    setAppliedVehicle('');
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
        <LoadingState message="Yük panosu yükleniyor..." />
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
          <View style={styles.headerBlock}>
            <ScreenHeader title="Yük Panosu" subtitle="Aktif yük ilanları" />
            {error ? <AlertBanner message={error} tone="error" /> : null}

            <Card variant="default" padding={4} style={styles.filterCard}>
              <TextField
                label="Şehir (çıkış / varış)"
                placeholder="Örn: İstanbul"
                value={cityQ}
                onChangeText={setCityQ}
              />
              <TextField
                label="Araç tipi"
                placeholder="Örn: Kamyon"
                value={vehicleQ}
                onChangeText={setVehicleQ}
              />
              <View style={styles.filterActions}>
                <SecondaryButton title="Filtrele" onPress={applyFilters} />
                <SecondaryButton title="Temizle" onPress={clearFilters} />
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
              title="Şu an aktif yük ilanı yok"
              description="Filtreleri değiştirerek tekrar deneyin."
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
        renderItem={({ item }) => {
          const pill = getLoadStatusPill(item.status);
          return (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/(driver)/load-detail',
                  params: { id: item.id },
                })
              }
            >
              <Card variant="glass" padding={4} style={styles.loadCard}>
                <View style={styles.cardTop}>
                  <View style={styles.routeCol}>
                    <Text style={styles.route}>
                      {item.fromCity} → {item.toCity}
                    </Text>
                    <Text style={styles.districts}>
                      {item.fromDistrict} / {item.toDistrict}
                    </Text>
                  </View>
                  <Text style={styles.price}>{formatCurrencyTRY(item.price)}</Text>
                </View>

                <View style={styles.metaRow}>
                  <Text style={styles.meta}>
                    {item.loadType ?? item.type ?? '-'} · {formatWeightKg(item.weight)}
                  </Text>
                  <StatusPill label={pill.label} tone={pill.tone} />
                </View>

                <Text style={styles.metaLine}>
                  Araç: {item.requiredVehicleType ?? '-'} · Teklif: {item.bidCount}
                </Text>
                <Text style={styles.musteri}>Müşteri: {item.ownerFullName}</Text>

                <View style={styles.cardFooter}>
                  <Text style={styles.detailLink}>Detay ve teklif</Text>
                  <Ionicons name="chevron-forward" size={16} color={palette.brand} />
                </View>
              </Card>
            </Pressable>
          );
        }}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerBlock: { gap: spacing[3], marginBottom: spacing[2] },
  filterCard: { gap: spacing[3] },
  filterActions: { flexDirection: 'row', gap: spacing[2] },
  resultCount: { ...typography.caption, textTransform: 'none', color: palette.textMuted },
  list: { paddingHorizontal: spacing[4], paddingBottom: spacing[8], gap: spacing[3] },
  loadCard: { marginBottom: spacing[3] },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing[3], marginBottom: spacing[2] },
  routeCol: { flex: 1 },
  route: { fontFamily: fontFamily.bold, fontSize: 16, color: palette.text },
  districts: { ...typography.caption, textTransform: 'none', marginTop: 2 },
  price: { fontFamily: fontFamily.bold, fontSize: 15, color: palette.gold },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  meta: { ...typography.caption, textTransform: 'none', flex: 1 },
  metaLine: { ...typography.caption, textTransform: 'none', color: palette.textMuted },
  musteri: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: palette.textMuted,
    marginTop: spacing[1],
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing[1],
    marginTop: spacing[3],
    paddingTop: spacing[2],
    borderTopWidth: 1,
    borderTopColor: palette.borderSubtle,
  },
  detailLink: { fontFamily: fontFamily.semiBold, fontSize: 12, color: palette.brand },
  footer: { paddingVertical: spacing[4], gap: spacing[2] },
  footerPad: { height: spacing[4] },
});
