import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { ScreenHeader } from '../../../src/components/ScreenHeader';
import { AlertBanner } from '../../../src/components/ui/AlertBanner';
import { Card } from '../../../src/components/ui/Card';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { LoadingState } from '../../../src/components/ui/LoadingState';
import { StatusPill } from '../../../src/components/ui/StatusPill';
import { ScreenContainer, ScreenScroll, useScreenInsets } from '../../../src/constants/layout';
import { getApiErrorMessage } from '../../../src/services/api.client';
import { getCustomerLoads } from '../../../src/services/loads.service';
import type { Load } from '../../../src/types/load';
import { palette } from '../../../src/theme/colors';
import { fontFamily, typography } from '../../../src/theme/typography';
import { spacing } from '../../../src/theme/spacing';
import { formatCurrencyTRY } from '../../../src/utils/format';
import { getLoadStatusPill } from '../../../src/utils/statusPills';

export default function CustomerLoadsScreen() {
  const { contentInset } = useScreenInsets();
  const router = useRouter();
  const [loads, setLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchLoads = useCallback(async () => {
    try {
      setError('');
      const data = await getCustomerLoads();
      setLoads(data);
    } catch (e) {
      setError(getApiErrorMessage(e));
      setLoads([]);
    }
  }, []);

  useEffect(() => {
    fetchLoads().finally(() => setLoading(false));
  }, [fetchLoads]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLoads();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <ScreenContainer>
        <LoadingState message="İlanlar yükleniyor..." />
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
              subtitle="Tum ilanlar ve durumlari"
              right={
                <Pressable
                  style={styles.createBtn}
                  onPress={() => router.push('/(customer)/(tabs)/create-load')}
                >
                  <Text style={styles.createBtnText}>+ Yeni</Text>
                </Pressable>
              }
            />
            {error ? <AlertBanner message={error} tone="error" /> : null}
          </View>
        }
        ListEmptyComponent={
          !error ? (
            <EmptyState
              icon="📦"
              title="Henüz ilaniniz yok"
              description="İlan Oluştur ile başlayın."
              actionLabel="İlan Oluştur"
              onAction={() => router.push('/(customer)/(tabs)/create-load')}
            />
          ) : null
        }
        renderItem={({ item }) => {
          const pill = getLoadStatusPill(item.status);
          const bidCount = item.bidCount ?? 0;
          return (
            <Pressable
              onPress={() =>
                router.push({ pathname: '/(customer)/load-detail', params: { id: item.id } })
              }
            >
              <Card variant="glass" padding={4} style={styles.card}>
                <View style={styles.cardTop}>
                  <Text style={styles.route}>
                    {item.fromCity} → {item.toCity}
                  </Text>
                  <StatusPill label={pill.label} tone={pill.tone} />
                </View>
                <Text style={styles.meta}>
                  {item.loadType ?? item.type ?? '-'} · {formatCurrencyTRY(item.price)}
                </Text>
                <View style={styles.bidRow}>
                  <Text style={styles.bidLabel}>Gelen teklif</Text>
                  <View style={[styles.bidBadge, bidCount > 0 && styles.bidBadgeHot]}>
                    <Text style={[styles.bidCount, bidCount > 0 && styles.bidCountHot]}>
                      {bidCount}
                    </Text>
                  </View>
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
  headerPad: { paddingHorizontal: spacing[4], paddingTop: spacing[4] },
  list: { paddingHorizontal: spacing[4], paddingBottom: spacing[8], gap: spacing[3] },
  createBtn: {
    backgroundColor: palette.brand,
    borderRadius: 8,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  createBtnText: { fontFamily: fontFamily.bold, fontSize: 13, color: palette.onBrand },
  card: { marginBottom: spacing[3] },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  route: { fontFamily: fontFamily.bold, fontSize: 16, color: palette.text, flex: 1 },
  meta: { ...typography.caption, textTransform: 'none' },
  bidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing[3],
    paddingTop: spacing[2],
    borderTopWidth: 1,
    borderTopColor: palette.borderSubtle,
  },
  bidLabel: { fontFamily: fontFamily.medium, fontSize: 13, color: palette.textSecondary },
  bidBadge: {
    minWidth: 32,
    height: 32,
    borderRadius: 16,
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
  bidCount: { fontFamily: fontFamily.bold, fontSize: 14, color: palette.textMuted },
  bidCountHot: { color: palette.brand },
});
