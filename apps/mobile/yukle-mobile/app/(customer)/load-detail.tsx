import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { DeliveryQrSection } from '../../src/components/DeliveryQrSection';
import { Colors } from '../../src/constants/colors';
import { screenRootStyle } from '../../src/constants/layout';
import { getApiErrorMessage } from '../../src/services/api.client';
import { acceptBid, getBidsForLoad } from '../../src/services/bids.service';
import { getLoadById } from '../../src/services/loads.service';
import type { LoadBid } from '../../src/types/bid';
import type { Load } from '../../src/types/load';
import { formatCurrencyTRY, formatWeightKg } from '../../src/utils/format';
import { canCustomerOpenChat } from '../../src/utils/loadChat';

const STATUS_LABEL: Record<string, string> = {
  Active: 'Yayinda',
  Assigned: 'Sofor atandi',
  OnWay: 'Yolda',
  Arrived: 'Varildi',
  Delivered: 'Teslim',
  Cancelled: 'Iptal',
};

const BID_STATUS_LABEL: Record<string, string> = {
  Pending: 'Beklemede',
  Accepted: 'Kabul edildi',
  Rejected: 'Reddedildi',
  Cancelled: 'Iptal',
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function bidPriceHint(
  amount: number,
  load: Load
): { label: string; color: string } | null {
  const min = load.aiMinPrice;
  const max = load.aiMaxPrice;
  if (min == null || max == null || min <= 0) return null;
  if (amount < min) return { label: 'Uygun fiyat', color: Colors.success };
  if (amount > max) return { label: 'Yuksek teklif', color: Colors.error };
  return { label: 'Onerilen aralikta', color: Colors.primaryGold };
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
  const hint = bidPriceHint(bid.amount, load);
  const canAccept = load.status === 'Active' && bid.status === 'Pending';

  return (
    <View style={[styles.bidItem, bid.status === 'Accepted' && styles.bidItemAccepted]}>
      <View style={styles.row}>
        <Text style={styles.bidDriver}>{bid.driverFullName}</Text>
        <Text style={styles.bidAmount}>{formatCurrencyTRY(bid.amount)}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.mutedSmall}>
          Durum: {BID_STATUS_LABEL[bid.status] ?? bid.status}
          {bid.driverPhone ? ` · ${bid.driverPhone}` : ''}
        </Text>
      </View>
      {hint ? (
        <Text style={[styles.priceHint, { color: hint.color }]}>{hint.label}</Text>
      ) : null}
      {canAccept ? (
        <Pressable
          style={[styles.acceptBtn, accepting && styles.acceptBtnDisabled]}
          onPress={() => onAccept(bid)}
          disabled={accepting}
        >
          {accepting ? (
            <ActivityIndicator color={Colors.bgDark} size="small" />
          ) : (
            <Text style={styles.acceptBtnText}>Kabul Et</Text>
          )}
        </Pressable>
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
      <View style={[screenRootStyle, styles.centered]}>
        <ActivityIndicator color={Colors.primary} size="large" />
        <Text style={styles.muted}>Ilan detayi yukleniyor...</Text>
      </View>
    );
  }

  if (fetchError && !load) {
    return (
      <View style={[screenRootStyle, styles.centered, styles.pad]}>
        <Text style={styles.title}>Ilan Detayi</Text>
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{fetchError}</Text>
        </View>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Geri</Text>
        </Pressable>
      </View>
    );
  }

  if (!load) {
    return (
      <View style={[screenRootStyle, styles.centered, styles.pad]}>
        <Text style={styles.title}>Ilan bulunamadi</Text>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Geri</Text>
        </Pressable>
      </View>
    );
  }

  const yukTipi = load.loadType ?? load.type ?? '-';
  const showQr = load.status === 'Assigned' || load.status === 'OnWay';

  return (
    <ScrollView style={screenRootStyle} contentContainerStyle={styles.scroll}>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.backLink}>← Geri</Text>
      </Pressable>

      <Text style={styles.title}>Ilan Detayi</Text>
      <Text style={styles.route}>
        {load.fromCity} → {load.toCity}
      </Text>

      {fetchError ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{fetchError}</Text>
        </View>
      ) : null}

      {actionMsg ? (
        <View style={styles.successBox}>
          <Text style={styles.successText}>{actionMsg}</Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Yuk bilgileri</Text>
        <DetailRow label="Durum" value={STATUS_LABEL[load.status] ?? load.status} />
        <DetailRow label="Yuk tipi" value={String(yukTipi)} />
        <DetailRow label="Agirlik" value={formatWeightKg(load.weight)} />
        <DetailRow label="Ilan fiyati" value={formatCurrencyTRY(load.price)} />
        {load.description ? (
          <Text style={styles.desc}>{load.description}</Text>
        ) : null}
      </View>

      {load.aiSuggestedPrice != null && load.aiSuggestedPrice > 0 ? (
        <View style={styles.aiCard}>
          <Text style={styles.aiTitle}>AI onerilen fiyat</Text>
          <Text style={styles.aiPrice}>{formatCurrencyTRY(load.aiSuggestedPrice)}</Text>
          {load.aiMinPrice != null && load.aiMaxPrice != null ? (
            <Text style={styles.mutedSmall}>
              Aralik: {formatCurrencyTRY(load.aiMinPrice)} – {formatCurrencyTRY(load.aiMaxPrice)}
            </Text>
          ) : null}
          {load.aiPriceReasoning ? (
            <Text style={styles.aiReason}>{load.aiPriceReasoning}</Text>
          ) : null}
        </View>
      ) : null}

      {showQr ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Teslimat QR</Text>
          <DeliveryQrSection loadId={loadId} />
        </View>
      ) : null}

      {canCustomerOpenChat(load) ? (
        <Pressable
          style={styles.chatBtn}
          onPress={() => router.push({ pathname: '/chat', params: { loadId } })}
        >
          <Text style={styles.chatBtnText}>Soforle Sohbet</Text>
        </Pressable>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Gelen teklifler</Text>
        {bids.length === 0 ? (
          <Text style={styles.muted}>Henuz teklif gelmedi.</Text>
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
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40, gap: 12 },
  pad: { padding: 24 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  backLink: { color: Colors.primary, fontSize: 14, fontWeight: '600' },
  title: { color: Colors.textPrimary, fontSize: 22, fontWeight: '700' },
  route: { color: Colors.primaryGold, fontSize: 18, fontWeight: '700' },
  muted: { color: Colors.textSecondary, fontSize: 14 },
  mutedSmall: { color: Colors.textSecondary, fontSize: 12 },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    gap: 10,
  },
  cardTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  rowLabel: { color: Colors.textSecondary, fontSize: 14, flex: 1 },
  rowValue: { color: Colors.textPrimary, fontSize: 14, fontWeight: '600', flex: 1, textAlign: 'right' },
  desc: { color: Colors.textPrimary, fontSize: 14, marginTop: 4 },
  aiCard: {
    backgroundColor: 'rgba(255,182,39,0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primaryGold,
    padding: 14,
    gap: 6,
  },
  aiTitle: { color: Colors.primaryGold, fontSize: 13, fontWeight: '700' },
  aiPrice: { color: Colors.textPrimary, fontSize: 20, fontWeight: '700' },
  aiReason: { color: Colors.textSecondary, fontSize: 12, marginTop: 4 },
  bidItem: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
    marginTop: 4,
    gap: 8,
  },
  bidItemAccepted: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.success,
    paddingLeft: 8,
  },
  bidDriver: { color: Colors.textPrimary, fontSize: 15, fontWeight: '700', flex: 1 },
  bidAmount: { color: Colors.primaryGold, fontSize: 16, fontWeight: '700' },
  priceHint: { fontSize: 12, fontWeight: '600' },
  acceptBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  acceptBtnDisabled: { opacity: 0.5 },
  acceptBtnText: { color: Colors.bgDark, fontSize: 15, fontWeight: '700' },
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
  backBtn: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  backBtnText: { color: Colors.textPrimary, fontWeight: '600' },
  chatBtn: {
    backgroundColor: 'rgba(255,107,0,0.15)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingVertical: 14,
    alignItems: 'center',
  },
  chatBtnText: { color: Colors.primary, fontSize: 16, fontWeight: '700' },
});
