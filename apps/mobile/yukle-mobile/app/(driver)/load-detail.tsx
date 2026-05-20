import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Colors } from '../../src/constants/colors';
import { screenRootStyle } from '../../src/constants/layout';
import { getApiErrorMessage } from '../../src/services/api.client';
import { submitBid } from '../../src/services/bids.service';
import { getLoadById } from '../../src/services/loads.service';
import type { Load } from '../../src/types/load';
import { formatCurrencyTRY, formatWeightKg } from '../../src/utils/format';
import { canDriverOpenChat } from '../../src/utils/loadChat';

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export default function DriverLoadDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const loadId = typeof id === 'string' ? id : Array.isArray(id) ? id[0] : '';

  const [load, setLoad] = useState<Load | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [amount, setAmount] = useState('');
  const [bidError, setBidError] = useState('');
  const [bidSuccess, setBidSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [bidSent, setBidSent] = useState(false);

  const fetchLoad = useCallback(async () => {
    if (!loadId) {
      setFetchError('Gecersiz ilan ID.');
      setLoading(false);
      return;
    }
    try {
      setFetchError('');
      const data = await getLoadById(loadId);
      setLoad(data);
    } catch (e) {
      setFetchError(getApiErrorMessage(e));
      setLoad(null);
    } finally {
      setLoading(false);
    }
  }, [loadId]);

  useEffect(() => {
    fetchLoad();
  }, [fetchLoad]);

  const onSubmitBid = async () => {
    if (!loadId || bidSent) return;
    setBidError('');
    setBidSuccess('');
    const numericAmount = Number(amount.replace(',', '.'));
    if (Number.isNaN(numericAmount) || numericAmount < 100 || numericAmount > 9999999) {
      setBidError('Fiyat 100 TL ile 9.999.999 TL arasinda olmalidir.');
      return;
    }
    setSubmitting(true);
    try {
      await submitBid({ loadId, amount: numericAmount });
      setBidSuccess('Teklifiniz iletildi, musteri onayi bekleniyor.');
      setBidSent(true);
      setAmount('');
    } catch (e) {
      setBidError(getApiErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[screenRootStyle, styles.centered]}>
        <ActivityIndicator color={Colors.primary} size="large" />
        <Text style={styles.muted}>Ilan detayi yukleniyor...</Text>
      </View>
    );
  }

  if (fetchError || !load) {
    return (
      <View style={[screenRootStyle, styles.centered, styles.pad]}>
        <Text style={styles.title}>Yuk Detayi</Text>
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{fetchError || 'Ilan bulunamadi.'}</Text>
        </View>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Geri</Text>
        </Pressable>
      </View>
    );
  }

  const yukTipi = load.loadType ?? load.type ?? '-';
  const mesafe =
    load.distanceKm != null && load.distanceKm > 0
      ? `${load.distanceKm.toLocaleString('tr-TR')} km`
      : '-';

  return (
    <KeyboardAvoidingView
      style={screenRootStyle}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backLink}>← Yuk Panosu</Text>
        </Pressable>

        <Text style={styles.title}>Yuk Detayi</Text>
        <Text style={styles.route}>
          {load.fromCity} → {load.toCity}
        </Text>
        <Text style={styles.muted}>
          {load.fromDistrict} / {load.toDistrict}
        </Text>

        <View style={styles.routeCard}>
          <Text style={styles.routeCardTitle}>Guzergah</Text>
          <Text style={styles.routeCardBody}>
            {load.fromCity} ({load.fromDistrict}) → {load.toCity} ({load.toDistrict})
          </Text>
        </View>

        <View style={styles.card}>
          <DetailRow label="Liste fiyati" value={formatCurrencyTRY(load.price)} />
          <DetailRow label="Yuk tipi" value={yukTipi} />
          <DetailRow label="Agirlik" value={formatWeightKg(load.weight)} />
          <DetailRow label="Hacim" value={load.volume ? `${load.volume} m3` : '-'} />
          <DetailRow label="Mesafe" value={mesafe} />
          <DetailRow label="Musteri" value={load.ownerFullName || '-'} />
          <DetailRow label="Durum" value={load.status} />
          <DetailRow label="Teklif sayisi" value={String(load.bidCount)} />
        </View>

        {load.aiSuggestedPrice != null && load.aiSuggestedPrice > 0 ? (
          <View style={styles.aiCard}>
            <Text style={styles.aiTitle}>AI onerilen fiyat</Text>
            <Text style={styles.aiPrice}>{formatCurrencyTRY(load.aiSuggestedPrice)}</Text>
            {load.aiMinPrice != null && load.aiMaxPrice != null ? (
              <Text style={styles.muted}>
                Aralik: {formatCurrencyTRY(load.aiMinPrice)} – {formatCurrencyTRY(load.aiMaxPrice)}
              </Text>
            ) : null}
            {load.aiPriceReasoning ? (
              <Text style={styles.aiReason}>{load.aiPriceReasoning}</Text>
            ) : null}
          </View>
        ) : null}

        {load.description ? (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Aciklama</Text>
            <Text style={styles.desc}>{load.description}</Text>
          </View>
        ) : null}

        {canDriverOpenChat(load) ? (
          <Pressable
            style={styles.chatBtn}
            onPress={() => router.push({ pathname: '/chat', params: { loadId } })}
          >
            <Text style={styles.chatBtnText}>Musteriyle Sohbet</Text>
          </Pressable>
        ) : null}

        <View style={styles.bidCard}>
          <Text style={styles.bidTitle}>Teklif Ver</Text>
          <Text style={styles.muted}>Navlun tutarinizi TL olarak girin.</Text>

          {bidSuccess ? (
            <View style={styles.successBox}>
              <Text style={styles.successText}>{bidSuccess}</Text>
            </View>
          ) : null}
          {bidError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{bidError}</Text>
            </View>
          ) : null}

          <TextInput
            style={[styles.input, bidSent && styles.inputDisabled]}
            placeholder="Ornek: 15000"
            placeholderTextColor={Colors.textMuted}
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
            editable={!bidSent && !submitting}
          />

          <Pressable
            style={[styles.submitBtn, (bidSent || submitting) && styles.submitBtnDisabled]}
            onPress={onSubmitBid}
            disabled={bidSent || submitting}
          >
            {submitting ? (
              <ActivityIndicator color={Colors.bgDark} />
            ) : (
              <Text style={styles.submitBtnText}>
                {bidSent ? 'Teklif Gonderildi' : 'Teklif Gonder'}
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40, gap: 12 },
  pad: { padding: 24 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  backLink: { color: Colors.primary, fontSize: 14, fontWeight: '600' },
  title: { color: Colors.textPrimary, fontSize: 22, fontWeight: '700' },
  route: { color: Colors.primaryGold, fontSize: 18, fontWeight: '700' },
  muted: { color: Colors.textSecondary, fontSize: 13 },
  routeCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    gap: 6,
  },
  routeCardTitle: { color: Colors.textSecondary, fontSize: 12, fontWeight: '600' },
  routeCardBody: { color: Colors.textPrimary, fontSize: 15, fontWeight: '600' },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    gap: 10,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  rowLabel: { color: Colors.textSecondary, fontSize: 14, flex: 1 },
  rowValue: { color: Colors.textPrimary, fontSize: 14, fontWeight: '600', flex: 1, textAlign: 'right' },
  sectionLabel: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600' },
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
  bidCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
    padding: 16,
    gap: 12,
    marginTop: 4,
  },
  bidTitle: { color: Colors.textPrimary, fontSize: 18, fontWeight: '700' },
  input: {
    backgroundColor: Colors.bgInput,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  inputDisabled: { opacity: 0.5 },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  submitBtnDisabled: { opacity: 0.45 },
  submitBtnText: { color: Colors.bgDark, fontSize: 16, fontWeight: '700' },
  chatBtn: {
    backgroundColor: 'rgba(255,107,0,0.15)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingVertical: 14,
    alignItems: 'center',
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
  backBtn: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  backBtnText: { color: Colors.textPrimary, fontWeight: '600' },
});
