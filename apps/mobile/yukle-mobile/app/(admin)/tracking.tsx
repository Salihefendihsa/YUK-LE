import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { AlertBanner } from '../../src/components/ui/AlertBanner';
import { Card } from '../../src/components/ui/Card';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { LoadingState } from '../../src/components/ui/LoadingState';
import { SectionHeader } from '../../src/components/ui/SectionHeader';
import { StatusPill } from '../../src/components/ui/StatusPill';
import { screenRootStyle } from '../../src/constants/layout';
import { getApiErrorMessage } from '../../src/services/api.client';
import { getAdminActiveDrivers } from '../../src/services/admin.service';
import type { AdminActiveDriverRow } from '../../src/types/admin';
import { palette } from '../../src/theme/colors';
import { fontFamily, typography } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';
import { formatDateTimeTR } from '../../src/utils/format';

const POLL_MS = 20000;

export default function AdminTrackingScreen() {
  const router = useRouter();
  const [rows, setRows] = useState<AdminActiveDriverRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const mounted = useRef(true);

  const fetchData = useCallback(async () => {
    try {
      setError('');
      setRows(await getAdminActiveDrivers());
    } catch (e) {
      setError(getApiErrorMessage(e));
      setRows([]);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    fetchData().finally(() => {
      if (mounted.current) setLoading(false);
    });
    const timer = setInterval(() => {
      void fetchData();
    }, POLL_MS);
    return () => {
      mounted.current = false;
      clearInterval(timer);
    };
  }, [fetchData]);

  if (loading) {
    return (
      <View style={screenRootStyle}>
        <LoadingState message="Aktif soforler yukleniyor..." />
      </View>
    );
  }

  return (
    <View style={screenRootStyle}>
      <FlatList
        data={rows}
        keyExtractor={(item) => `${item.loadId}-${item.driverId}`}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await fetchData();
              setRefreshing(false);
            }}
            tintColor={palette.brand}
          />
        }
        ListHeaderComponent={
          <>
            <Pressable onPress={() => router.back()} style={styles.back}>
              <Text style={typography.link}>← Geri</Text>
            </Pressable>
            <SectionHeader
              title="Canli Takip"
              subtitle="Gercek REST (20 sn polling). Harita yok — koordinat listesi."
            />
            {error ? <AlertBanner message={error} tone="error" /> : null}
          </>
        }
        ListEmptyComponent={
          !error ? (
            <EmptyState
              icon="📍"
              title="Aktif sefer / konum yok"
              description="Assigned, OnWay veya Arrived ilan gerekir."
            />
          ) : null
        }
        renderItem={({ item }) => {
          const hasLoc = item.lastKnownLat != null && item.lastKnownLng != null;
          return (
            <Card variant="elevated" padding={4} style={styles.trackCard}>
              <View style={styles.head}>
                <Text style={styles.cardTitle}>{item.driverName}</Text>
                <StatusPill label={hasLoc ? 'Konum var' : 'Konum yok'} tone={hasLoc ? 'success' : 'warning'} />
              </View>
              <Text style={styles.muted}>{item.route}</Text>
              <Text style={styles.muted}>Plaka: {item.plate || '-'}</Text>
              <Text style={styles.mono}>
                Konum:{' '}
                {hasLoc
                  ? `${item.lastKnownLat!.toFixed(5)}, ${item.lastKnownLng!.toFixed(5)}`
                  : '-'}
              </Text>
              <Text style={styles.muted}>
                Guncelleme:{' '}
                {item.lastLocationUpdate ? formatDateTimeTR(item.lastLocationUpdate) : '-'}
              </Text>
              <Text style={styles.mono}>Ilan: {item.loadId.slice(0, 8)}...</Text>
            </Card>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing[4], paddingBottom: spacing[10], gap: spacing[2] },
  back: { marginBottom: spacing[2] },
  trackCard: { marginBottom: spacing[2], gap: spacing[1] },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing[2] },
  cardTitle: { ...typography.h3, flex: 1 },
  muted: { ...typography.caption, textTransform: 'none' },
  mono: {
    fontFamily: fontFamily.regular,
    fontSize: 11,
    color: palette.textMuted,
  },
});
