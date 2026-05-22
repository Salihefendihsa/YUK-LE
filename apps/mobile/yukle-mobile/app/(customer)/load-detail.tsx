import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { DeliveryQrSection } from '../../src/components/DeliveryQrSection';
import { DetailRow } from '../../src/components/driver/DetailRow';
import { AlertBanner } from '../../src/components/ui/AlertBanner';
import { Card } from '../../src/components/ui/Card';
import { LoadingState } from '../../src/components/ui/LoadingState';
import { PrimaryButton } from '../../src/components/ui/PrimaryButton';
import { SecondaryButton } from '../../src/components/ui/SecondaryButton';
import { StatusPill } from '../../src/components/ui/StatusPill';
import { screenRootStyle } from '../../src/constants/layout';
import { getApiErrorMessage } from '../../src/services/api.client';
import { acceptBid, getBidsForLoad } from '../../src/services/bids.service';
import { getLoadById } from '../../src/services/loads.service';
import type { LoadBid } from '../../src/types/bid';
import type { Load } from '../../src/types/load';
import { palette } from '../../src/theme/colors';
import { fontFamily, typography } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';
import { formatCurrencyTRY, formatWeightKg } from '../../src/utils/format';
import { canCustomerOpenChat } from '../../src/utils/loadChat';
import {
  getAiPriceComparePill,
  getBidStatusPill,
  getLoadStatusPill,
} from '../../src/utils/statusPills';

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
      {bid.driverPhone ? (
        <Text style={styles.bidPhone}>{bid.driverPhone}</Text>
      ) : null}
      {canAccept ? (
        <PrimaryButton
          title="Kabul Et"
          onPress={() => onAccept(bid)}
          loading={accepting}
          disabled={accepting}
          style={{ marginTop: spacing[2] }}
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
  const [actionMsg, setActionMsg] = useState('');
  const [acceptingId, setAcceptingId] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    if (!loadId) {
      setFetchError('Gecersiz ilan ID.');
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

  const doAccept = async (bid: LoadBid) => {
    setActionMsg('');
    setAcceptingId(bid.id);
    try {
      await acceptBid(bid.id);
      setActionMsg('Teklif kabul edildi. Ilan durumu guncellendi.');
      await refresh();
    } catch (e) {
      setFetchError(getApiErrorMessage(e));
    } finally {
      setAcceptingId(null);
    }
  };

  const onAcceptPress = (bid: LoadBid) => {
    Alert.alert(
      'Teklifi kabul et',
      `${bid.driverFullName} - ${formatCurrencyTRY(bid.amount)} teklifini kabul etmek istiyor musunuz? Bu islem geri alinamaz.`,
      [
        { text: 'Iptal', style: 'cancel' },
        { text: 'Kabul Et', style: 'destructive', onPress: () => doAccept(bid) },
      ]
    );
  };

  if (loading) {
    return (
      <View style={screenRootStyle}>
        <LoadingState message="Ilan detayi yukleniyor..." />
      </View>
    );
  }

  if (fetchError && !load) {
    return (
      <View style={[screenRootStyle, styles.centered]}>
        <Text style={styles.pageTitle}>Ilan Detayi</Text>
        <AlertBanner message={fetchError} tone="error" />
        <SecondaryButton title="Geri" onPress={() => router.back()} style={{ minWidth: 120 }} />
      </View>
    );
  }

  if (!load) {
    return (
      <View style={[screenRootStyle, styles.centered]}>
        <Text style={styles.pageTitle}>Ilan bulunamadi</Text>
        <SecondaryButton title="Geri" onPress={() => router.back()} />
      </View>
    );
  }

  const yukTipi = load.loadType ?? load.type ?? '-';
  const showQr = load.status === 'Assigned' || load.status === 'OnWay';
  const statusPill = getLoadStatusPill(load.status);

  return (
    <ScrollView style={screenRootStyle} contentContainerStyle={styles.scroll}>
      <Pressable onPress={() => router.back()}>
        <Text style={typography.link}>← Geri</Text>
      </Pressable>

      <View style={styles.titleRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.pageTitle}>Ilan Detayi</Text>
          <Text style={styles.route}>
            {load.fromCity} → {load.toCity}
          </Text>
        </View>
        <StatusPill label={statusPill.label} tone={statusPill.tone} />
      </View>

      {fetchError ? <AlertBanner message={fetchError} tone="error" /> : null}
      {actionMsg ? <AlertBanner message={actionMsg} tone="success" /> : null}

      <Card variant="default" padding={4}>
        <Text style={styles.cardTitle}>Yuk bilgileri</Text>
        <DetailRow label="Yuk tipi" value={String(yukTipi)} />
        <DetailRow label="Agirlik" value={formatWeightKg(load.weight)} />
        <DetailRow label="Ilan fiyati" value={formatCurrencyTRY(load.price)} />
        {load.description ? <Text style={styles.desc}>{load.description}</Text> : null}
      </Card>

      {load.aiSuggestedPrice != null && load.aiSuggestedPrice > 0 ? (
        <Card variant="elevated" padding={4} style={styles.aiCard}>
          <Text style={styles.aiTitle}>AI onerilen fiyat</Text>
          <Text style={styles.aiPrice}>{formatCurrencyTRY(load.aiSuggestedPrice)}</Text>
          {load.aiMinPrice != null && load.aiMaxPrice != null ? (
            <Text style={styles.aiMeta}>
              Aralik: {formatCurrencyTRY(load.aiMinPrice)} – {formatCurrencyTRY(load.aiMaxPrice)}
            </Text>
          ) : null}
          {load.aiPriceReasoning ? (
            <Text style={styles.aiReason}>{load.aiPriceReasoning}</Text>
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
          title="Soforle Sohbet"
          onPress={() => router.push({ pathname: '/chat', params: { loadId } })}
        />
      ) : null}

      <Card variant="glass" padding={4}>
        <Text style={styles.cardTitle}>Gelen teklifler ({bids.length})</Text>
        {bids.length === 0 ? (
          <Text style={styles.emptyBid}>Henuz teklif gelmedi.</Text>
        ) : (
          bids.map((bid) => (
            <BidCard
              key={bid.id}
              bid={bid}
              load={load}
              accepting={acceptingId === bid.id}
              onAccept={onAcceptPress}
            />
          ))
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing[4], paddingBottom: spacing[10], gap: spacing[4] },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
    gap: spacing[4],
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
    marginTop: spacing[2],
  },
  pageTitle: { ...typography.h1 },
  route: { fontFamily: fontFamily.bold, fontSize: 18, color: palette.gold, marginTop: spacing[1] },
  cardTitle: { ...typography.h3, marginBottom: spacing[3] },
  desc: { ...typography.body, marginTop: spacing[2] },
  aiCard: { borderColor: palette.goldBorder, backgroundColor: palette.goldMuted },
  aiTitle: { fontFamily: fontFamily.semiBold, fontSize: 13, color: palette.gold },
  aiPrice: { fontFamily: fontFamily.bold, fontSize: 22, color: palette.text, marginVertical: spacing[1] },
  aiMeta: { ...typography.caption, textTransform: 'none' },
  aiReason: { ...typography.caption, textTransform: 'none', marginTop: spacing[2] },
  bidItem: {
    borderTopWidth: 1,
    borderTopColor: palette.borderSubtle,
    paddingTop: spacing[4],
    marginTop: spacing[2],
    gap: spacing[2],
  },
  bidItemAccepted: {
    borderLeftWidth: 3,
    borderLeftColor: palette.success,
    paddingLeft: spacing[3],
  },
  bidTop: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing[2] },
  bidDriver: { fontFamily: fontFamily.bold, fontSize: 15, color: palette.text, flex: 1 },
  bidAmount: { fontFamily: fontFamily.bold, fontSize: 16, color: palette.gold },
  bidMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  bidPhone: { ...typography.caption, textTransform: 'none' },
  emptyBid: { ...typography.caption, textTransform: 'none' },
});
