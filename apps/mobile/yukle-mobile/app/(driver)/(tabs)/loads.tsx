import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { ScreenHeader } from '../../../src/components/ScreenHeader';
import { AlertBanner } from '../../../src/components/ui/AlertBanner';
import { Card } from '../../../src/components/ui/Card';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { LoadingState } from '../../../src/components/ui/LoadingState';
import { StatusPill } from '../../../src/components/ui/StatusPill';
import { screenRootStyle } from '../../../src/constants/layout';
import { getApiErrorMessage } from '../../../src/services/api.client';
import { getActiveLoads } from '../../../src/services/loads.service';
import type { Load } from '../../../src/types/load';
import { palette } from '../../../src/theme/colors';
import { fontFamily, typography } from '../../../src/theme/typography';
import { spacing } from '../../../src/theme/spacing';
import { formatCurrencyTRY, formatWeightKg } from '../../../src/utils/format';
import { getLoadStatusPill } from '../../../src/utils/statusPills';

export default function DriverLoadsScreen() {
  const router = useRouter();
  const [loads, setLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchLoads = async () => {
    try {
      setError('');
      const data = await getActiveLoads();
      setLoads(data);
    } catch (e) {
      setError(getApiErrorMessage(e));
      setLoads([]);
    }
  };

  useEffect(() => {
    fetchLoads().finally(() => setLoading(false));
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLoads();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={screenRootStyle}>
        <LoadingState message="Yuk panosu yukleniyor..." />
      </View>
    );
  }

  return (
    <View style={screenRootStyle}>
      <View style={styles.headerPad}>
        <ScreenHeader title="Yuk Panosu" subtitle="Aktif yuk ilanlari" />
        {error ? <AlertBanner message={error} tone="error" /> : null}
      </View>

      <FlatList
        data={loads}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.brand} />
        }
        ListEmptyComponent={
          !error ? (
            <EmptyState
              icon="📦"
              title="Su an aktif yuk ilani yok"
              description="Yeni ilanlar burada listelenecek."
            />
          ) : null
        }
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
                  Arac: {item.requiredVehicleType ?? '-'} · Teklif: {item.bidCount}
                </Text>
                <Text style={styles.musteri}>Musteri: {item.ownerFullName}</Text>

                <View style={styles.cardFooter}>
                  <Text style={styles.detailLink}>Detay ve teklif</Text>
                  <Ionicons name="chevron-forward" size={16} color={palette.brand} />
                </View>
              </Card>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  headerPad: { paddingHorizontal: spacing[4], paddingTop: spacing[4] },
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
});
