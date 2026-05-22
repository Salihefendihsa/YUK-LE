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
import { screenRootStyle } from '../../../src/constants/layout';
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
import { formatCurrencyTRY, formatWeightKg } from '../../../src/utils/format';
import { canDriverOpenChat } from '../../../src/utils/loadChat';
import { getLoadStatusPill } from '../../../src/utils/statusPills';

const STEP_LABELS = ['Atandi', 'Yukle', 'Yolda', 'Teslim'] as const;

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

  const onPickup = async () => {
    if (!trip || !canPickup) return;
    setBusy(true);
    setActionError('');
    setSuccessMsg('');
    try {
      await pickupLoad(trip.id);
      await refreshTrip(trip.id);
      setSuccessMsg('Yuk alindi. Yola cikabilirsiniz.');
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
      setActionError('Teslimat icin musterinin QR kodunu girin veya okutun.');
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
      setSuccessMsg('Yuk teslim edildi. Odeme cuzdaniniza aktarildi.');
      setQrToken('');
    } catch (e) {
      setActionError(getApiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <View style={screenRootStyle}>
        <LoadingState message="Aktif sefer yukleniyor..." />
      </View>
    );
  }

  if (!trip) {
    return (
      <ScrollView
        style={screenRootStyle}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.brand} />
        }
      >
        <ScreenHeader title="Aktif Sefer" subtitle="Aktif sefer yok" />
        {error ? <AlertBanner message={error} tone="error" /> : null}
        <EmptyState
          icon="🚛"
          title="Su an aktif seferiniz yok"
          description="Yuk Panosu uzerinden is bulabilirsiniz."
          actionLabel="Yuk Panosu"
          onAction={() => router.push('/(driver)/(tabs)/loads')}
        />
      </ScrollView>
    );
  }

  const statusPill = getLoadStatusPill(trip.status);

  return (
    <ScrollView
      style={screenRootStyle}
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
          title="Musteriyle Sohbet"
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
              <Text style={[styles.stepText, (done || on) && styles.stepTextOn]}>{label}</Text>
            </View>
          );
        })}
      </View>

      <Card variant="default" padding={4}>
        <DetailRow label="Durum" value={trip.status} />
        <DetailRow label="Liste fiyati" value={formatCurrencyTRY(trip.price)} />
        <DetailRow label="Musteri" value={trip.ownerFullName || '-'} />
        <DetailRow label="Yuk tipi" value={trip.loadType ?? trip.type ?? '-'} />
        <DetailRow label="Agirlik" value={formatWeightKg(trip.weight)} />
      </Card>

      {successMsg ? <AlertBanner message={successMsg} tone="success" /> : null}
      {actionError ? <AlertBanner message={actionError} tone="error" /> : null}

      {!isDelivered ? (
        <View style={styles.actions}>
          <PrimaryButton
            title="Yuku Aldim"
            onPress={onPickup}
            loading={busy && canPickup}
            disabled={!canPickup || busy}
          />

          {canDeliver ? (
            <Card variant="default" padding={4} style={styles.qrCard}>
              <Text style={styles.qrTitle}>Teslimat QR</Text>
              <Text style={styles.qrSub}>
                Musteri ekranindaki QR kodu okutun. Token asagiya girilir (15 dk gecerli).
              </Text>
              <View style={styles.qrPreview}>
                <Text style={styles.qrPreviewLabel}>QR token</Text>
                <Text style={styles.qrPreviewValue} numberOfLines={3}>
                  {qrToken.trim() || 'Musteri QR gosterdikten sonra token burada gorunur'}
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
          <Text style={styles.qrSub}>Yeni isler icin Yuk Panosu na gidebilirsiniz.</Text>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing[4], paddingBottom: spacing[8], gap: spacing[4] },
  routeHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3] },
  route: { fontFamily: fontFamily.bold, fontSize: 18, color: palette.gold },
  districts: { ...typography.caption, textTransform: 'none', marginTop: 2 },
  progressRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  step: {
    flex: 1,
    minWidth: 72,
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
    fontSize: 11,
    color: palette.textMuted,
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
