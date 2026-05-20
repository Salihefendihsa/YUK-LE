import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ScreenHeader } from '../../../src/components/ScreenHeader';
import { Colors } from '../../../src/constants/colors';
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
import { formatCurrencyTRY, formatWeightKg } from '../../../src/utils/format';
import { canDriverOpenChat } from '../../../src/utils/loadChat';

const STEP_LABELS = ['Atandi', 'Yukle', 'Yolda', 'Teslim'] as const;

const STATUS_STEP: Record<LoadStatus, number> = {
  Active: 0,
  Assigned: 1,
  OnWay: 2,
  Arrived: 3,
  Delivered: 4,
  Cancelled: -1,
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

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
      <View style={[screenRootStyle, styles.centered]}>
        <ActivityIndicator color={Colors.primary} size="large" />
        <Text style={styles.muted}>Aktif sefer yukleniyor...</Text>
      </View>
    );
  }

  if (!trip) {
    return (
      <ScrollView
        style={screenRootStyle}
        contentContainerStyle={styles.emptyWrap}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        <ScreenHeader title="Aktif Sefer" subtitle="Aktif sefer yok" />
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
        <View style={styles.card}>
          <Text style={styles.emptyTitle}>Su an aktif seferiniz yok</Text>
          <Text style={styles.muted}>Yuk Panosu uzerinden is bulabilirsiniz.</Text>
          <Pressable style={styles.linkBtn} onPress={() => router.push('/(driver)/(tabs)/loads')}>
            <Text style={styles.linkBtnText}>Yuk Panosu</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={screenRootStyle}
      contentContainerStyle={styles.scroll}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
      }
    >
      <ScreenHeader title="Aktif Sefer" subtitle={`${trip.fromCity} → ${trip.toCity}`} />
      <Text style={styles.route}>
        {trip.fromCity} → {trip.toCity}
      </Text>
      <Text style={styles.muted}>
        {trip.fromDistrict} / {trip.toDistrict}
      </Text>

      {canDriverOpenChat(trip) ? (
        <Pressable
          style={styles.chatBtn}
          onPress={() => router.push({ pathname: '/chat', params: { loadId: trip.id } })}
        >
          <Text style={styles.chatBtnText}>Musteriyle Sohbet</Text>
        </Pressable>
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

      <View style={styles.card}>
        <DetailRow label="Durum" value={trip.status} />
        <DetailRow label="Liste fiyati" value={formatCurrencyTRY(trip.price)} />
        <DetailRow label="Musteri" value={trip.ownerFullName || '-'} />
        <DetailRow label="Yuk tipi" value={trip.loadType ?? trip.type ?? '-'} />
        <DetailRow label="Agirlik" value={formatWeightKg(trip.weight)} />
      </View>

      {successMsg ? (
        <View style={styles.successBox}>
          <Text style={styles.successText}>{successMsg}</Text>
        </View>
      ) : null}
      {actionError ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{actionError}</Text>
        </View>
      ) : null}

      {!isDelivered ? (
        <View style={styles.actionsCard}>
          <Pressable
            style={[styles.actionBtn, styles.pickupBtn, (!canPickup || busy) && styles.btnDisabled]}
            onPress={onPickup}
            disabled={!canPickup || busy}
          >
            <Text style={styles.actionBtnText}>Yuku Aldim</Text>
          </Pressable>

          {canDeliver ? (
            <View style={styles.qrSection}>
              <Text style={styles.qrTitle}>Teslimat QR</Text>
              <Text style={styles.muted}>
                Musteri ekranindaki QR kodu okutun. Token asagiya girilir (15 dk gecerli).
              </Text>
              <View style={styles.qrPreview}>
                <Text style={styles.qrPreviewLabel}>QR token</Text>
                <Text style={styles.qrPreviewValue} numberOfLines={3}>
                  {qrToken.trim() || 'Musteri QR gosterdikten sonra token burada gorunur'}
                </Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="QR token yapistirin"
                placeholderTextColor={Colors.textMuted}
                value={qrToken}
                onChangeText={setQrToken}
                editable={!busy}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          ) : null}

          <Pressable
            style={[styles.actionBtn, styles.deliverBtn, (!canDeliver || busy) && styles.btnDisabled]}
            onPress={onDeliver}
            disabled={!canDeliver || busy}
          >
            {busy ? (
              <ActivityIndicator color={Colors.bgDark} />
            ) : (
              <Text style={styles.actionBtnText}>Teslim Ettim</Text>
            )}
          </Pressable>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.emptyTitle}>Sefer tamamlandi</Text>
          <Text style={styles.muted}>Yeni isler icin Yuk Panosu na gidebilirsiniz.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 32, gap: 12 },
  emptyWrap: { padding: 16, paddingBottom: 32, gap: 12 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  title: { color: Colors.textPrimary, fontSize: 22, fontWeight: '700' },
  route: { color: Colors.primaryGold, fontSize: 18, fontWeight: '700' },
  muted: { color: Colors.textSecondary, fontSize: 13 },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    gap: 10,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  rowLabel: { color: Colors.textSecondary, fontSize: 14 },
  rowValue: { color: Colors.textPrimary, fontSize: 14, fontWeight: '600', textAlign: 'right', flex: 1 },
  progressRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  step: {
    flex: 1,
    minWidth: 72,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
    alignItems: 'center',
  },
  stepDone: { borderColor: Colors.success, backgroundColor: 'rgba(16,185,129,0.12)' },
  stepOn: { borderColor: Colors.primary, backgroundColor: 'rgba(255,107,0,0.12)' },
  stepText: { color: Colors.textMuted, fontSize: 11, fontWeight: '600' },
  stepTextOn: { color: Colors.textPrimary },
  actionsCard: { gap: 12 },
  actionBtn: {
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  pickupBtn: { backgroundColor: Colors.primary },
  deliverBtn: { backgroundColor: Colors.primaryGold },
  btnDisabled: { opacity: 0.4 },
  actionBtnText: { color: Colors.bgDark, fontSize: 16, fontWeight: '700' },
  qrSection: {
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    gap: 8,
  },
  qrTitle: { color: Colors.primaryGold, fontSize: 15, fontWeight: '700' },
  qrPreview: {
    backgroundColor: Colors.bgInput,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  qrPreviewLabel: { color: Colors.textMuted, fontSize: 11, fontWeight: '600' },
  qrPreviewValue: { color: Colors.textPrimary, fontSize: 12, fontFamily: 'monospace' },
  input: {
    backgroundColor: Colors.bgInput,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: Colors.textPrimary,
    fontSize: 13,
  },
  emptyTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: '600' },
  linkBtn: {
    marginTop: 12,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  linkBtnText: { color: Colors.bgDark, fontWeight: '700' },
  chatBtn: {
    backgroundColor: 'rgba(255,107,0,0.15)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 4,
  },
  chatBtnText: { color: Colors.primary, fontSize: 16, fontWeight: '700' },
  successBox: {
    backgroundColor: 'rgba(16,185,129,0.12)',
    borderColor: Colors.success,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  successText: { color: Colors.success, fontSize: 14, fontWeight: '600' },
  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderColor: 'rgba(239,68,68,0.3)',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  errorText: { color: Colors.error, fontSize: 13 },
});
