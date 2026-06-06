import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { DeliveryQrSection } from '../../src/components/DeliveryQrSection';
import { DetailRow } from '../../src/components/driver/DetailRow';
import { AlertBanner } from '../../src/components/ui/AlertBanner';
import { Card } from '../../src/components/ui/Card';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { FadeInView } from '../../src/components/ui/FadeInView';
import { GhostButton } from '../../src/components/ui/GhostButton';
import { LoadingState } from '../../src/components/ui/LoadingState';
import { PressableScale } from '../../src/components/ui/PressableScale';
import { PrimaryButton } from '../../src/components/ui/PrimaryButton';
import { SecondaryButton } from '../../src/components/ui/SecondaryButton';
import { StatusPill } from '../../src/components/ui/StatusPill';
import { ScreenContainer, ScreenScroll, useScreenInsets } from '../../src/constants/layout';
import { getApiErrorMessage } from '../../src/services/api.client';
import { acceptBid, getBidsForLoad } from '../../src/services/bids.service';
import { LiveMapPanel } from '../../src/components/map/LiveMapPanel';
import type { MapMarker } from '../../src/components/map/LiveMap.types';
import { isValidCoordinate } from '../../src/components/map/mapUtils';
import { useCustomerDriverLocation } from '../../src/hooks/useCustomerDriverLocation';
import { getLoadById, cancelLoad } from '../../src/services/loads.service';
import type { LoadBid } from '../../src/types/bid';
import type { Load } from '../../src/types/load';
import { palette } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { space, spacing } from '../../src/theme/spacing';
import { radius } from '../../src/theme/radius';
import { formatCurrencyTRY, formatLoadTypeLabel, formatWeightKg } from '../../src/utils/format';
import { canCustomerOpenChat } from '../../src/utils/loadChat';
import { LoadStatusTimeline } from '../../src/components/load/LoadStatusTimeline';
import { DriverRatingForm } from '../../src/components/customer/DriverRatingForm';
import {
  getAiPriceComparePill,
  getBidStatusPill,
  getLoadStatusPill,
} from '../../src/utils/statusPills';
import { SettlementBreakdown } from '../../src/components/settlement/SettlementBreakdown';
import { EscrowCard } from '../../src/components/payment/EscrowCard';
import { previewSettlement } from '../../src/services/settlement.service';
import type { SettlementPreview } from '../../src/types/settlement';

function AcceptedPaymentSummary({ amount }: { amount: number }) {
  const [settlement, setSettlement] = useState<SettlementPreview | null>(null);

  useEffect(() => {
    let cancelled = false;
    void previewSettlement(amount)
      .then((s) => {
        if (!cancelled) setSettlement(s);
      })
      .catch(() => {
        if (!cancelled) setSettlement(null);
      });
    return () => {
      cancelled = true;
    };
  }, [amount]);

  if (!settlement) return null;

  return (
    <View style={{ marginTop: space.sm }}>
      <Text style={styles.paymentTitle}>Ödeme özeti</Text>
      <SettlementBreakdown settlement={settlement} mode="customer" />
    </View>
  );
}

function BidCard({
  bid,
  load,
  accepting,
  onAccept,
}: {
  bid: LoadBid;
  load: Load;
  accepting: boolean;
  onAccept: (bid: LoadBid) => void;
}) {
  const bidPill = getBidStatusPill(bid.status);
  const pricePill = getAiPriceComparePill(bid.amount, load.aiMinPrice, load.aiMaxPrice);
  const canAccept = load.status === 'Active' && bid.status === 'Pending';
  const [settlement, setSettlement] = useState<SettlementPreview | null>(null);

  useEffect(() => {
    let cancelled = false;
    void previewSettlement(bid.amount)
      .then((s) => {
        if (!cancelled) setSettlement(s);
      })
      .catch(() => {
        if (!cancelled) setSettlement(null);
      });
    return () => {
      cancelled = true;
    };
  }, [bid.amount]);

  return (
    <View style={[styles.bidItem, bid.status === 'Accepted' && styles.bidItemAccepted]}>
      <View style={styles.bidTop}>
        <Text style={styles.bidDriver}>{bid.driverFullName}</Text>
        <Text style={styles.bidAmount}>{formatCurrencyTRY(bid.amount)}</Text>
      </View>
      <View style={styles.bidMetaRow}>
        <StatusPill label={bidPill.label} tone={bidPill.tone} />
        {pricePill ? <StatusPill label={pricePill.label} tone={pricePill.tone} /> : null}
      </View>
      {settlement ? (
        <SettlementBreakdown settlement={settlement} mode="customer" compact />
      ) : null}
      {canAccept ? (
        <PrimaryButton
          title="Kabul Et"
          onPress={() => onAccept(bid)}
          loading={accepting}
          disabled={accepting}
          style={{ marginTop: space.sm }}
        />
      ) : null}
    </View>
  );
}

export default function CustomerLoadDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const loadId = typeof id === 'string' ? id : Array.isArray(id) ? id[0] : '';

  const [load, setLoad] = useState<Load | null>(null);
  const [bids, setBids] = useState<LoadBid[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [actionError, setActionError] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const [acceptingId, setAcceptingId] = useState<number | null>(null);
  const [showRating, setShowRating] = useState(false);

  const refresh = useCallback(async () => {
    if (!loadId) {
      setFetchError('Geçersiz ilan ID.');
      setLoading(false);
      return;
    }
    try {
      setFetchError('');
      const [loadData, bidData] = await Promise.all([getLoadById(loadId), getBidsForLoad(loadId)]);
      setLoad(loadData);
      setBids(bidData);
    } catch (e) {
      setFetchError(getApiErrorMessage(e));
      setLoad(null);
      setBids([]);
    } finally {
      setLoading(false);
    }
  }, [loadId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const driverTracking = useCustomerDriverLocation({
    loadId,
    status: load?.status,
    destinationLat: load?.destinationLat,
    destinationLng: load?.destinationLng,
  });

  const trackingMarkers = useMemo((): MapMarker[] => {
    if (!load || !driverTracking.hasCoords) return [];
    const markers: MapMarker[] = [];
    if (isValidCoordinate(load.destinationLat, load.destinationLng)) {
      markers.push({
        id: 'destination',
        latitude: load.destinationLat,
        longitude: load.destinationLng,
        title: `Teslim · ${load.toCity}`,
        kind: 'destination',
      });
    }
    if (
      driverTracking.driverLatitude != null &&
      driverTracking.driverLongitude != null &&
      isValidCoordinate(driverTracking.driverLatitude, driverTracking.driverLongitude)
    ) {
      markers.push({
        id: 'driver',
        latitude: driverTracking.driverLatitude,
        longitude: driverTracking.driverLongitude,
        title: driverTracking.driverName ?? 'Şoför',
        kind: 'driver',
      });
    }
    return markers;
  }, [load, driverTracking]);

  const doAccept = async (bid: LoadBid) => {
    setActionMsg('');
    setActionError('');
    setAcceptingId(bid.id);
    try {
      await acceptBid(bid.id);
      setActionMsg('Teklif kabul edildi. İlan durumu güncellendi.');
      await refresh();
    } catch (e) {
      setActionError(getApiErrorMessage(e));
    } finally {
      setAcceptingId(null);
    }
  };

  const onAcceptPress = (bid: LoadBid) => {
    void previewSettlement(bid.amount)
      .then((s) => {
        Alert.alert(
          'Teklifi kabul et',
          `${bid.driverFullName}\n\nTeklif: ${formatCurrencyTRY(s.bidAmount)}\nKomisyon: +${formatCurrencyTRY(s.customerCommission)}\nÖdenecek tutar: ${formatCurrencyTRY(s.customerTotal)}\n\nBu işlem geri alınamaz.`,
          [
            { text: 'İptal', style: 'cancel' },
            { text: 'Kabul Et', style: 'destructive', onPress: () => doAccept(bid) },
          ]
        );
      })
      .catch(() => {
        Alert.alert(
          'Teklifi kabul et',
          `${bid.driverFullName} - ${formatCurrencyTRY(bid.amount)} teklifini kabul etmek istiyor musunuz?`,
          [
            { text: 'İptal', style: 'cancel' },
            { text: 'Kabul Et', style: 'destructive', onPress: () => doAccept(bid) },
          ]
        );
      });
  };

  const canCancel =
    load?.status === 'Active' && !bids.some((b) => b.status === 'Accepted');
  const canEdit = canCancel;

  const onCancelPress = () => {
    if (!load) return;
    Alert.alert(
      'İlanı iptal et',
      'İlan iptal edilecek ve açık teklifler kapatılacak. Devam?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Iptal Et',
          style: 'destructive',
          onPress: () => {
            setCancelling(true);
            setActionError('');
            void cancelLoad(load.id)
              .then((res) => {
                setActionMsg(res.message || 'İlan iptal edildi.');
                return refresh();
              })
              .catch((e) => setActionError(getApiErrorMessage(e)))
              .finally(() => setCancelling(false));
          },
        },
      ]
    );
  };

  const onEditPress = () => {
    if (!load) return;
    router.push({ pathname: '/(customer)/edit-load', params: { id: load.id } });
  };

  if (loading) {
    return (
      <ScreenContainer>
        <LoadingState message="İlan detayı yükleniyor..." variant="skeleton" />
      </ScreenContainer>
    );
  }

  if (fetchError && !load) {
    return (
      <ScreenContainer style={styles.centered}>
        <Text style={styles.pageTitle}>İlan Detayı</Text>
        <AlertBanner message={fetchError} tone="error" />
        <SecondaryButton title="Geri" onPress={() => router.back()} style={{ minWidth: 120 }} />
      </ScreenContainer>
    );
  }

  if (!load) {
    return (
      <ScreenContainer style={styles.centered}>
        <Text style={styles.pageTitle}>İlan bulunamadı</Text>
        <SecondaryButton title="Geri" onPress={() => router.back()} />
      </ScreenContainer>
    );
  }

  const yukTipi = formatLoadTypeLabel(load.loadType ?? load.type);
  const showQr = load.status === 'Assigned' || load.status === 'OnWay';
  const statusPill = getLoadStatusPill(load.status);
  const acceptedBid = bids.find((b) => b.status === 'Accepted');

  return (
    <ScreenScroll contentContainerStyle={styles.scroll}>
      <GhostButton title="← Geri" onPress={() => router.back()} style={styles.backBtn} />

      <FadeInView>
      <View style={styles.titleRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.pageTitle}>İlan Detayı</Text>
          <Text style={styles.route}>
            {load.fromCity} → {load.toCity}
          </Text>
        </View>
        <StatusPill label={statusPill.label} tone={statusPill.tone} />
      </View>
      </FadeInView>

      {actionError ? <AlertBanner message={actionError} tone="error" /> : null}
      {actionMsg ? <AlertBanner message={actionMsg} tone="success" /> : null}

      <FadeInView delay={40}>
      <Card variant="default" padding={4}>
        <Text style={styles.cardTitle}>Yük bilgileri</Text>
        <DetailRow label="Yük tipi" value={String(yukTipi)} />
        <DetailRow label="Ağırlık" value={formatWeightKg(load.weight)} />
        <DetailRow label="İlan fiyatı" value={formatCurrencyTRY(load.price)} />
        {acceptedBid ? (
          <>
            <DetailRow label="Kabul edilen teklif" value={formatCurrencyTRY(acceptedBid.amount)} />
            <AcceptedPaymentSummary amount={acceptedBid.amount} />
          </>
        ) : null}
        {load.description ? <Text style={styles.desc}>{load.description}</Text> : null}
        <LoadStatusTimeline status={load.status} />
      </Card>
      </FadeInView>

      <FadeInView delay={60}>
        <EscrowCard loadId={loadId} loadStatus={load.status} view="customer" />
      </FadeInView>

      {driverTracking.shouldShow ? (
        <Card variant="glass" padding={4}>
          <Text style={styles.cardTitle}>Şoför konumu</Text>
          <LiveMapPanel
            markers={trackingMarkers}
            height={240}
            fallback={
              <>
                {driverTracking.driverName ? (
                  <Text style={styles.driverName}>{driverTracking.driverName}</Text>
                ) : null}
                <Text style={styles.locSummary}>{driverTracking.summary}</Text>
                {driverTracking.coordsText ? (
                  <Text style={styles.locCoords}>Koordinat: {driverTracking.coordsText}</Text>
                ) : null}
              </>
            }
            footer={
              driverTracking.hasCoords && driverTracking.summary ? (
                <>
                  {driverTracking.driverName ? (
                    <Text style={styles.driverName}>{driverTracking.driverName}</Text>
                  ) : null}
                  <Text style={styles.locSummary}>{driverTracking.summary}</Text>
                  {driverTracking.coordsText ? (
                    <Text style={styles.locCoords}>Koordinat: {driverTracking.coordsText}</Text>
                  ) : null}
                </>
              ) : null
            }
          />
        </Card>
      ) : null}

      {load.aiSuggestedPrice != null && load.aiSuggestedPrice > 0 ? (
        <Card variant="elevated" padding={4} style={styles.aiCard}>
          <Text style={styles.aiTitle}>Önerilen fiyat</Text>
          <Text style={styles.aiPrice}>{formatCurrencyTRY(load.aiSuggestedPrice)}</Text>
          {load.aiMinPrice != null && load.aiMaxPrice != null ? (
            <Text style={styles.aiMeta}>
              Aralık: {formatCurrencyTRY(load.aiMinPrice)} – {formatCurrencyTRY(load.aiMaxPrice)}
            </Text>
          ) : null}
        </Card>
      ) : null}

      {showQr ? (
        <Card variant="glass" padding={4}>
          <Text style={styles.cardTitle}>Teslimat QR</Text>
          <DeliveryQrSection loadId={loadId} />
        </Card>
      ) : null}

      {canCustomerOpenChat(load) ? (
        <SecondaryButton
          title="Şoförle Sohbet"
          onPress={() => router.push({ pathname: '/chat', params: { loadId } })}
        />
      ) : null}

      {canEdit ? (
        <FadeInView delay={80} style={{ gap: space.sm }}>
          <SecondaryButton title="İlanı Düzenle" onPress={onEditPress} />
          <PrimaryButton
            title={cancelling ? 'İptal ediliyor…' : 'İlanı İptal Et'}
            onPress={onCancelPress}
            disabled={cancelling}
          />
        </FadeInView>
      ) : null}

      {load.status === 'Delivered' && load.driverId ? (
        showRating ? (
          <DriverRatingForm
            loadId={load.id}
            driverUserId={load.driverId}
            driverName={bids.find((b) => b.status === 'Accepted')?.driverFullName}
            onRated={() => setShowRating(false)}
          />
        ) : (
          <PrimaryButton title="Şoförü Puanla" onPress={() => setShowRating(true)} />
        )
      ) : null}

      <Card variant="glass" padding={4}>
        <Text style={styles.cardTitle}>Gelen teklifler ({bids.length})</Text>
        {bids.length === 0 ? (
          <EmptyState
            icon="💬"
            title="Henüz teklif gelmedi"
            description="İlanınız yayında; teklifler burada listelenecek."
          />
        ) : (
          bids.map((bid, index) => (
            <FadeInView key={bid.id} delay={100 + index * 40}>
            <BidCard
              bid={bid}
              load={load}
              accepting={acceptingId === bid.id}
              onAccept={onAcceptPress}
            />
            </FadeInView>
          ))
        )}
      </Card>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: space.md, paddingBottom: spacing[10], gap: space.md },
  backBtn: { alignSelf: 'flex-start', marginBottom: space.xs },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.lg,
    gap: space.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
    marginTop: space.sm,
  },
  pageTitle: { ...typography.h1 },
  route: { ...typography.h2, fontSize: 18, color: palette.gold, marginTop: space.xs },
  cardTitle: { ...typography.h3, marginBottom: spacing[3] },
  paymentTitle: {
    ...typography.bodySmall,
    color: palette.textSecondary,
    marginBottom: space.xs,
  },
  driverName: {
    ...typography.bodyMedium,
    marginBottom: space.xs,
  },
  locSummary: { ...typography.body, color: palette.textSecondary },
  locCoords: { ...typography.caption, textTransform: 'none', marginTop: space.sm },
  desc: { ...typography.body, marginTop: space.sm },
  aiCard: { borderColor: palette.goldBorder, backgroundColor: palette.goldMuted },
  aiTitle: { ...typography.bodySmall, color: palette.gold },
  aiPrice: { ...typography.h2, fontSize: 22, marginVertical: space.xs },
  aiMeta: { ...typography.caption, textTransform: 'none' },
  bidItem: {
    borderTopWidth: 1,
    borderTopColor: palette.borderSubtle,
    paddingTop: space.md,
    marginTop: space.sm,
    gap: space.sm,
  },
  bidItemAccepted: {
    borderLeftWidth: 3,
    borderLeftColor: palette.success,
    paddingLeft: spacing[3],
    borderRadius: radius.sm,
  },
  bidTop: { flexDirection: 'row', justifyContent: 'space-between', gap: space.sm },
  bidDriver: { ...typography.bodyMedium, flex: 1 },
  bidAmount: { ...typography.bodyMedium, fontSize: 16, color: palette.gold },
  bidMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
});
