import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { DetailRow } from '../../../src/components/driver/DetailRow';
import { ScreenHeader } from '../../../src/components/ScreenHeader';
import { AlertBanner } from '../../../src/components/ui/AlertBanner';
import { Card } from '../../../src/components/ui/Card';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { LoadingState } from '../../../src/components/ui/LoadingState';
import { PrimaryButton } from '../../../src/components/ui/PrimaryButton';
import { SecondaryButton } from '../../../src/components/ui/SecondaryButton';
import { StatusPill } from '../../../src/components/ui/StatusPill';
import { TextField } from '../../../src/components/ui/TextField';
import { ScreenContainer, ScreenScroll, useScreenInsets } from '../../../src/constants/layout';
import { getApiErrorMessage } from '../../../src/services/api.client';
import {
  deliverLoad,
  getDriverActiveTrip,
  getLoadById,
  pickupLoad,
} from '../../../src/services/loads.service';
import { useAuthStore } from '../../../src/store/auth.store';
import type { Load, LoadStatus } from '../../../src/types/load';
import { palette } from '../../../src/theme/colors';
import { fontFamily, typography } from '../../../src/theme/typography';
import { radius } from '../../../src/theme/radius';
import { spacing } from '../../../src/theme/spacing';
import { formatCurrencyTRY, formatLoadTypeLabel, formatWeightKg } from '../../../src/utils/format';
import { canDriverOpenChat } from '../../../src/utils/loadChat';
import { LiveMapPanel } from '../../../src/components/map/LiveMapPanel';
import type { MapMarker } from '../../../src/components/map/LiveMap.types';
import { isValidCoordinate } from '../../../src/components/map/mapUtils';
import { useDriverLocationTracking } from '../../../src/hooks/useDriverLocationTracking';
import { getLoadStatusPill } from '../../../src/utils/statusPills';

const STEP_LABELS = ['Atandı', 'Yükle', 'Yolda', 'Teslim'] as const;

const STATUS_STEP: Record<LoadStatus, number> = {
  Active: 0,
  Assigned: 1,
  OnWay: 2,
  Arrived: 3,
  Delivered: 4,
  Cancelled: -1,
};

export default function DriverActiveLoadScreen() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.userId);

  const [trip, setTrip] = useState<Load | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [qrToken, setQrToken] = useState('');

  const fetchTrip = useCallback(async () => {
    if (!userId) {
      setError('Oturum bulunamadi.');
      setTrip(null);
      return;
    }
    try {
      setError('');
      const current = await getDriverActiveTrip(userId);
      setTrip(current);
    } catch (e) {
      setError(getApiErrorMessage(e));
      setTrip(null);
    }
  }, [userId]);

  useEffect(() => {
    fetchTrip().finally(() => setLoading(false));
  }, [fetchTrip]);

  const onRefresh = async () => {
    setRefreshing(true);
    setActionError('');
    setSuccessMsg('');
    await fetchTrip();
    setRefreshing(false);
  };

  const refreshTrip = async (loadId: string) => {
    const updated = await getLoadById(loadId);
    setTrip(updated);
  };

  const stepIdx = useMemo(() => {
    if (!trip) return 0;
    return STATUS_STEP[trip.status] ?? 0;
  }, [trip]);

  const canPickup = trip?.status === 'Assigned';
  const canDeliver = trip?.status === 'OnWay' || trip?.status === 'Arrived';
  const isDelivered = trip?.status === 'Delivered';
  const shouldShareLocation =
    trip != null && (trip.status === 'Assigned' || trip.status === 'OnWay');

  const { statusMessage: locationStatus, lastPosition } = useDriverLocationTracking({
    loadId: trip?.id,
    enabled: shouldShareLocation,
  });

  const routeMapMarkers = useMemo((): MapMarker[] => {
    if (!trip) return [];
    const markers: MapMarker[] = [];
    if (isValidCoordinate(trip.destinationLat, trip.destinationLng)) {
      markers.push({
        id: 'destination',
        latitude: trip.destinationLat,
        longitude: trip.destinationLng,
        title: `Teslim · ${trip.toCity}`,
        kind: 'destination',
      });
    }
    if (lastPosition && isValidCoordinate(lastPosition.latitude, lastPosition.longitude)) {
      markers.push({
        id: 'driver',
        latitude: lastPosition.latitude,
        longitude: lastPosition.longitude,
        title: 'Konumunuz',
        kind: 'driver',
      });
    }
    return markers;
  }, [trip, lastPosition]);

  const onPickup = async () => {
    if (!trip || !canPickup) return;
    setBusy(true);
    setActionError('');
    setSuccessMsg('');
    try {
      await pickupLoad(trip.id);
      await refreshTrip(trip.id);
      setSuccessMsg('Yük alındı. Yola çıkabilirsiniz.');
    } catch (e) {
      setActionError(getApiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const onDeliver = async () => {
    if (!trip || !canDeliver) return;
    const token = qrToken.trim();
    if (!token) {
      setActionError('Teslimat için müşterinin QR kodunu girin veya okutun.');
      return;
    }
    setBusy(true);
    setActionError('');
    setSuccessMsg('');
    try {
      await deliverLoad(trip.id, {
        qrToken: token,
        targetLat: trip.destinationLat,
        targetLng: trip.destinationLng,
      });
      await refreshTrip(trip.id);
      setSuccessMsg('Yük teslim edildi. Ödeme cüzdanınıza aktarıldı.');
      setQrToken('');
    } catch (e) {
      setActionError(getApiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <ScreenContainer>
        <LoadingState message="Aktif sefer yükleniyor..." />
      </ScreenContainer>
    );
  }

  if (!trip) {
    return (
      <ScreenScroll
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.brand} />
        }
      >
        <ScreenHeader title="Aktif Sefer" subtitle="Aktif sefer yok" />
        {error ? <AlertBanner message={error} tone="error" /> : null}
        <EmptyState
          icon="🚛"
          title="Şu an aktif seferiniz yok"
          description="Yük Panosu üzerinden iş bulabilirsiniz."
          actionLabel="Yük Panosu"
          onAction={() => router.push('/(driver)/(tabs)/loads')}
        />
      </ScreenScroll>
    );
  }

  const statusPill = getLoadStatusPill(trip.status);

  return (
    <ScreenScroll
      contentContainerStyle={styles.scroll}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.brand} />
      }
    >
      <ScreenHeader title="Aktif Sefer" subtitle={`${trip.fromCity} → ${trip.toCity}`} />

      <Card variant="glass" padding={4}>
        <View style={styles.routeHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.route}>
              {trip.fromCity} → {trip.toCity}
            </Text>
            <Text style={styles.districts}>
              {trip.fromDistrict} / {trip.toDistrict}
            </Text>
          </View>
          <StatusPill label={statusPill.label} tone={statusPill.tone} />
        </View>
      </Card>

      {canDriverOpenChat(trip) ? (
        <SecondaryButton
          title="Müşteriyle Sohbet"
          onPress={() => router.push({ pathname: '/chat', params: { loadId: trip.id } })}
        />
      ) : null}

      <View style={styles.progressRow}>
        {STEP_LABELS.map((label, i) => {
          const done = stepIdx > i || (trip.status === 'Delivered' && i < 4);
          const on = stepIdx === i;
          return (
            <View
              key={label}
              style={[styles.step, done && styles.stepDone, on && styles.stepOn]}
            >
              <Text style={[styles.stepText, (done || on) && styles.stepTextOn]} numberOfLines={2}>
                {label}
              </Text>
            </View>
          );
        })}
      </View>

      <Card variant="default" padding={4}>
        <DetailRow label="Durum" value={getLoadStatusPill(trip.status).label} />
        <DetailRow label="Liste fiyatı" value={formatCurrencyTRY(trip.price)} />
        <DetailRow label="Müşteri" value={trip.ownerFullName || '-'} />
        <DetailRow label="Yük tipi" value={formatLoadTypeLabel(trip.loadType ?? trip.type)} />
        <DetailRow label="Ağırlık" value={formatWeightKg(trip.weight)} />
      </Card>

      {shouldShareLocation && routeMapMarkers.length > 0 ? (
        <LiveMapPanel markers={routeMapMarkers} height={180} />
      ) : null}

      {shouldShareLocation && locationStatus ? (
        <AlertBanner message={locationStatus} tone="info" />
      ) : null}

      {successMsg ? <AlertBanner message={successMsg} tone="success" /> : null}
      {actionError ? <AlertBanner message={actionError} tone="error" /> : null}

      {!isDelivered ? (
        <View style={styles.actions}>
          <PrimaryButton
            title="Yükü Aldım"
            onPress={onPickup}
            loading={busy && canPickup}
            disabled={!canPickup || busy}
          />

          {canDeliver ? (
            <Card variant="default" padding={4} style={styles.qrCard}>
              <Text style={styles.qrTitle}>Teslimat QR</Text>
              <Text style={styles.qrSub}>
                Müşteri ekranındaki QR kodu okutun. Token aşağıya girilir (15 dk geçerli).
              </Text>
              <View style={styles.qrPreview}>
                <Text style={styles.qrPreviewLabel}>QR token</Text>
                <Text style={styles.qrPreviewValue} numberOfLines={3}>
                  {qrToken.trim() || 'Müşteri QR gösterdikten sonra token burada görünür'}
                </Text>
              </View>
              <TextField
                placeholder="QR token yapistirin"
                value={qrToken}
                onChangeText={setQrToken}
                editable={!busy}
                autoCapitalize="none"
              />
            </Card>
          ) : null}

          <PrimaryButton
            title="Teslim Ettim"
            onPress={onDeliver}
            loading={busy && canDeliver}
            disabled={!canDeliver || busy}
            style={styles.deliverBtn}
          />
        </View>
      ) : (
        <Card variant="glass" padding={5}>
          <Text style={styles.doneTitle}>Sefer tamamlandi</Text>
          <Text style={styles.qrSub}>Yeni işler için Yük Panosu’na gidebilirsiniz.</Text>
        </Card>
      )}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing[4], paddingBottom: spacing[8], gap: spacing[4] },
  routeHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3] },
  route: { fontFamily: fontFamily.bold, fontSize: 18, color: palette.gold },
  districts: { ...typography.caption, textTransform: 'none', marginTop: 2 },
  progressRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  step: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: '22%',
    minWidth: 0,
    maxWidth: '25%',
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[2],
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.borderLight,
    backgroundColor: palette.surface,
    alignItems: 'center',
  },
  stepDone: {
    borderColor: palette.successBorder,
    backgroundColor: palette.successBg,
  },
  stepOn: {
    borderColor: palette.brandBorder,
    backgroundColor: palette.brandMuted,
  },
  stepText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 10,
    color: palette.textMuted,
    textAlign: 'center',
  },
  stepTextOn: { color: palette.text },
  actions: { gap: spacing[3] },
  qrCard: { gap: spacing[2] },
  qrTitle: { fontFamily: fontFamily.semiBold, fontSize: 15, color: palette.gold },
  qrSub: { ...typography.caption, textTransform: 'none' },
  qrPreview: {
    backgroundColor: palette.input,
    borderRadius: radius.md,
    padding: spacing[3],
    borderWidth: 1,
    borderColor: palette.borderLight,
    gap: spacing[1],
  },
  qrPreviewLabel: { ...typography.label, color: palette.textMuted },
  qrPreviewValue: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: palette.text,
  },
  deliverBtn: { backgroundColor: palette.gold },
  doneTitle: { ...typography.h3 },
});
