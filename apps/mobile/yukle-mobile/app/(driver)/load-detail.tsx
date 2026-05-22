import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { DetailRow } from '../../src/components/driver/DetailRow';
import { AlertBanner } from '../../src/components/ui/AlertBanner';
import { Card } from '../../src/components/ui/Card';
import { LoadingState } from '../../src/components/ui/LoadingState';
import { PrimaryButton } from '../../src/components/ui/PrimaryButton';
import { SecondaryButton } from '../../src/components/ui/SecondaryButton';
import { StatusPill } from '../../src/components/ui/StatusPill';
import { TextField } from '../../src/components/ui/TextField';
import { screenRootStyle } from '../../src/constants/layout';
import { getApiErrorMessage } from '../../src/services/api.client';
import { submitBid } from '../../src/services/bids.service';
import { getLoadById } from '../../src/services/loads.service';
import type { Load } from '../../src/types/load';
import { palette } from '../../src/theme/colors';
import { fontFamily, typography } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';
import { formatCurrencyTRY, formatWeightKg } from '../../src/utils/format';
import { canDriverOpenChat } from '../../src/utils/loadChat';
import { getLoadStatusPill } from '../../src/utils/statusPills';

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
      <View style={screenRootStyle}>
        <LoadingState message="Ilan detayi yukleniyor..." />
      </View>
    );
  }

  if (fetchError || !load) {
    return (
      <View style={[screenRootStyle, styles.centered]}>
        <Text style={styles.pageTitle}>Yuk Detayi</Text>
        <AlertBanner message={fetchError || 'Ilan bulunamadi.'} tone="error" />
        <SecondaryButton title="Geri" onPress={() => router.back()} style={{ minWidth: 120 }} />
      </View>
    );
  }

  const yukTipi = load.loadType ?? load.type ?? '-';
  const mesafe =
    load.distanceKm != null && load.distanceKm > 0
      ? `${load.distanceKm.toLocaleString('tr-TR')} km`
      : '-';
  const statusPill = getLoadStatusPill(load.status);

  return (
    <KeyboardAvoidingView
      style={screenRootStyle}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => router.back()}>
          <Text style={typography.link}>← Yuk Panosu</Text>
        </Pressable>

        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.pageTitle}>Yuk Detayi</Text>
            <Text style={styles.route}>
              {load.fromCity} → {load.toCity}
            </Text>
            <Text style={styles.districts}>
              {load.fromDistrict} / {load.toDistrict}
            </Text>
          </View>
          <StatusPill label={statusPill.label} tone={statusPill.tone} />
        </View>

        <Card variant="glass" padding={4}>
          <Text style={styles.sectionLabel}>Guzergah</Text>
          <Text style={styles.routeBody}>
            {load.fromCity} ({load.fromDistrict}) → {load.toCity} ({load.toDistrict})
          </Text>
        </Card>

        <Card variant="default" padding={4}>
          <DetailRow label="Liste fiyati" value={formatCurrencyTRY(load.price)} />
          <DetailRow label="Yuk tipi" value={yukTipi} />
          <DetailRow label="Agirlik" value={formatWeightKg(load.weight)} />
          <DetailRow label="Hacim" value={load.volume ? `${load.volume} m3` : '-'} />
          <DetailRow label="Mesafe" value={mesafe} />
          <DetailRow label="Musteri" value={load.ownerFullName || '-'} />
          <DetailRow label="Teklif sayisi" value={String(load.bidCount)} />
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

        {load.description ? (
          <Card variant="default" padding={4}>
            <Text style={styles.sectionLabel}>Aciklama</Text>
            <Text style={styles.desc}>{load.description}</Text>
          </Card>
        ) : null}

        {canDriverOpenChat(load) ? (
          <SecondaryButton
            title="Musteriyle Sohbet"
            onPress={() => router.push({ pathname: '/chat', params: { loadId } })}
          />
        ) : null}

        <Card variant="elevated" padding={5} style={styles.bidCard}>
          <Text style={styles.bidTitle}>Teklif Ver</Text>
          <Text style={styles.bidSub}>Navlun tutarinizi TL olarak girin.</Text>

          {bidSuccess ? <AlertBanner message={bidSuccess} tone="success" /> : null}
          {bidError ? <AlertBanner message={bidError} tone="error" /> : null}

          <TextField
            label="Teklif tutari (TL)"
            icon="cash-outline"
            placeholder="Ornek: 15000"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
            editable={!bidSent && !submitting}
          />

          <PrimaryButton
            title={bidSent ? 'Teklif Gonderildi' : 'Teklif Gonder'}
            onPress={onSubmitBid}
            loading={submitting}
            disabled={bidSent}
          />
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
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
  pageTitle: { ...typography.h1, marginBottom: spacing[1] },
  route: { fontFamily: fontFamily.bold, fontSize: 18, color: palette.gold },
  districts: { ...typography.caption, textTransform: 'none' },
  sectionLabel: { ...typography.label, marginBottom: spacing[2] },
  routeBody: { fontFamily: fontFamily.semiBold, fontSize: 15, color: palette.text },
  aiCard: { borderColor: palette.goldBorder, backgroundColor: palette.goldMuted },
  aiTitle: { fontFamily: fontFamily.semiBold, fontSize: 13, color: palette.gold },
  aiPrice: { fontFamily: fontFamily.bold, fontSize: 22, color: palette.text, marginVertical: spacing[1] },
  aiMeta: { ...typography.caption, textTransform: 'none' },
  aiReason: { ...typography.caption, textTransform: 'none', marginTop: spacing[2] },
  desc: { ...typography.body, marginTop: spacing[1] },
  bidCard: { borderColor: palette.brandBorder },
  bidTitle: { ...typography.h2, fontSize: 18 },
  bidSub: { ...typography.caption, textTransform: 'none', marginBottom: spacing[2] },
});
