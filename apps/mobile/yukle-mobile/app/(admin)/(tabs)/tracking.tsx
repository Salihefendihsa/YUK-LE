import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { LiveMapPanel } from '../../../src/components/map/LiveMapPanel';
import type { MapMarker } from '../../../src/components/map/LiveMap.types';
import { isValidCoordinate } from '../../../src/components/map/mapUtils';
import { ScreenHeader } from '../../../src/components/ScreenHeader';
import { AlertBanner } from '../../../src/components/ui/AlertBanner';
import { Card } from '../../../src/components/ui/Card';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { FadeInView } from '../../../src/components/ui/FadeInView';
import { LoadingState } from '../../../src/components/ui/LoadingState';
import { StatusPill } from '../../../src/components/ui/StatusPill';
import { ScreenContainer, useScreenInsets } from '../../../src/constants/layout';
import { getApiErrorMessage } from '../../../src/services/api.client';
import { getAdminActiveDrivers } from '../../../src/services/admin.service';
import type { AdminActiveDriverRow } from '../../../src/types/admin';
import { palette } from '../../../src/theme/colors';
import { typography } from '../../../src/theme/typography';
import { space, spacing } from '../../../src/theme/spacing';
import { formatDateTimeTR } from '../../../src/utils/format';

const POLL_MS = 20000;

export default function AdminTrackingScreen() {
  const { contentInset } = useScreenInsets();
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

  const mapMarkers = useMemo((): MapMarker[] => {
    return rows
      .filter(
        (r) =>
          isValidCoordinate(r.lastKnownLat, r.lastKnownLng) &&
          r.lastKnownLat != null &&
          r.lastKnownLng != null
      )
      .map((r) => ({
        id: `${r.loadId}-${r.driverId}`,
        latitude: r.lastKnownLat!,
        longitude: r.lastKnownLng!,
        title: r.driverName,
        description: r.route,
        kind: 'driver' as const,
      }));
  }, [rows]);

  if (loading) {
    return (
      <ScreenContainer>
        <LoadingState message="Aktif şoförler yükleniyor..." variant="skeleton" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <FlatList
        data={rows}
        keyExtractor={(item) => `${item.loadId}-${item.driverId}`}
        contentContainerStyle={[styles.list, contentInset]}
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
            <ScreenHeader
              title="Canlı Takip"
              subtitle="Aktif konumlar periyodik güncellenir (harita + liste)."
            />
            {mapMarkers.length > 0 ? (
              <LiveMapPanel markers={mapMarkers} height={260} style={styles.map} />
            ) : null}
            {error ? <AlertBanner message={error} tone="error" /> : null}
          </>
        }
        ListEmptyComponent={
          !error ? (
            <EmptyState
              icon="📍"
              title="Aktif sefer / konum yok"
              description="Atanmış, yolda veya varış aşamasındaki ilan gerekir."
            />
          ) : null
        }
        renderItem={({ item, index }) => {
          const hasLoc = item.lastKnownLat != null && item.lastKnownLng != null;
          return (
            <FadeInView delay={Math.min(index * 40, 200)}>
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
                  Güncelleme:{' '}
                  {item.lastLocationUpdate ? formatDateTimeTR(item.lastLocationUpdate) : '-'}
                </Text>
                <Text style={styles.mono}>İlan: {item.loadId.slice(0, 8)}...</Text>
              </Card>
            </FadeInView>
          );
        }}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: { padding: space.md, paddingBottom: spacing[10], gap: space.sm },
  map: { marginBottom: space.sm },
  trackCard: { marginBottom: space.sm, gap: space.xs },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.sm },
  cardTitle: { ...typography.h3, flex: 1 },
  muted: { ...typography.caption, textTransform: 'none' },
  mono: { ...typography.caption, fontSize: 11, color: palette.textMuted, textTransform: 'none' },
});
