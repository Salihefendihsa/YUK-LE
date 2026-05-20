import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { adminScreenStyles as s } from '../../src/constants/adminScreenStyles';
import { Colors } from '../../src/constants/colors';
import { screenRootStyle } from '../../src/constants/layout';
import { getApiErrorMessage } from '../../src/services/api.client';
import { getAdminActiveDrivers } from '../../src/services/admin.service';
import type { AdminActiveDriverRow } from '../../src/types/admin';
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
      <View style={[screenRootStyle, s.centered]}>
        <ActivityIndicator color={Colors.primary} size="large" />
        <Text style={s.muted}>Aktif soforler yukleniyor...</Text>
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
            tintColor={Colors.primary}
          />
        }
        ListHeaderComponent={
          <>
            <Pressable onPress={() => router.back()}>
              <Text style={s.backLink}>← Geri</Text>
            </Pressable>
            <Text style={s.title}>Canli Takip</Text>
            <Text style={s.sub}>
              Gercek REST (20 sn polling). Harita yok — koordinat listesi. Web sayfasi tamamen placeholder idi.
            </Text>
            {error ? (
              <View style={s.errorBox}>
                <Text style={s.errorText}>{error}</Text>
              </View>
            ) : null}
          </>
        }
        ListEmptyComponent={
          !error ? (
            <View style={s.empty}>
              <Text style={s.emptyTitle}>Aktif sefer / konum yok</Text>
              <Text style={s.muted}>Assigned, OnWay veya Arrived ilan gerekir.</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={s.card}>
            <Text style={s.cardTitle}>{item.driverName}</Text>
            <Text style={s.muted}>{item.route}</Text>
            <Text style={s.muted}>Plaka: {item.plate || '-'}</Text>
            <Text style={s.mono}>
              Konum:{' '}
              {item.lastKnownLat != null && item.lastKnownLng != null
                ? `${item.lastKnownLat.toFixed(5)}, ${item.lastKnownLng.toFixed(5)}`
                : 'Konum yok'}
            </Text>
            <Text style={s.muted}>
              Guncelleme:{' '}
              {item.lastLocationUpdate ? formatDateTimeTR(item.lastLocationUpdate) : '-'}
            </Text>
            <Text style={s.mono}>Ilan: {item.loadId.slice(0, 8)}...</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, paddingBottom: 40, gap: 10 },
});
