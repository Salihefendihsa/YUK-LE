import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { DetailRow } from '../../src/components/driver/DetailRow';
import { AlertBanner } from '../../src/components/ui/AlertBanner';
import { Card } from '../../src/components/ui/Card';
import { FadeInView } from '../../src/components/ui/FadeInView';
import { GhostButton } from '../../src/components/ui/GhostButton';
import { LoadingState } from '../../src/components/ui/LoadingState';
import { PrimaryButton } from '../../src/components/ui/PrimaryButton';
import { SecondaryButton } from '../../src/components/ui/SecondaryButton';
import { StatusPill } from '../../src/components/ui/StatusPill';
import { TextField } from '../../src/components/ui/TextField';
import {
  ScreenContainer,
  ScreenScroll,
  screenRootStyle,
  useScreenInsets,
} from '../../src/constants/layout';
import { getApiErrorMessage } from '../../src/services/api.client';
import { cancelBid, getDriverBids, submitBid } from '../../src/services/bids.service';
import { getLoadById } from '../../src/services/loads.service';
import { getUserProfile } from '../../src/services/user.service';
import type { Load } from '../../src/types/load';
import { palette } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { space, spacing } from '../../src/theme/spacing';
import { formatCurrencyTRY, formatLoadTypeLabel, formatWeightKg } from '../../src/utils/format';
import { canDriverOpenChat } from '../../src/utils/loadChat';
import { getLoadStatusPill } from '../../src/utils/statusPills';
import { useAuthStore } from '../../src/store/auth.store';

export default function DriverLoadDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const loadId = typeof id === 'string' ? id : Array.isArray(id) ? id[0] : '';

  const [load, setLoad] = useState<Load | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [bidError, setBidError] = useState('');
  const [bidSuccess, setBidSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [bidSent, setBidSent] = useState(false);
  const [pendingBidId, setPendingBidId] = useState<number | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const user = useAuthStore((s) => s.user);
  const [driverApproved, setDriverApproved] = useState<boolean | null>(null);
  const canSubmitBid = driverApproved === true;

  useEffect(() => {
    if (user?.role !== 'Driver' || !user.userId) {
      setDriverApproved(false);
      return;
    }
    let cancelled = false;
    void getUserProfile(user.userId)
      .then((profile) => {
        if (!cancelled) setDriverApproved(profile.approvalStatus === 'Active');
      })
      .catch(() => {
        if (!cancelled) setDriverApproved(user.isActive);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const fetchLoad = useCallback(async () => {
    if (!loadId) {
      setFetchError('Geçersiz ilan ID.');
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

  useEffect(() => {
    if (!loadId) return;
    void getDriverBids()
      .then((bids) => {
        const mine = bids.find(
          (b) => b.loadId === loadId && b.status.toLowerCase() === 'pending'
        );
        if (mine) {
          setPendingBidId(mine.id);
          setBidSent(true);
          if (mine.note) setNote(mine.note);
        }
      })
      .catch(() => {
        /* teklif listesi opsiyonel */
      });
  }, [loadId]);

  const onCancelBid = async () => {
    if (!pendingBidId) return;
    setCancelling(true);
    setBidError('');
    setBidSuccess('');
    try {
      await cancelBid(pendingBidId);
      setPendingBidId(null);
      setBidSent(false);
      setBidSuccess('Teklifiniz iptal edildi.');
    } catch (e) {
      setBidError(getApiErrorMessage(e));
    } finally {
      setCancelling(false);
    }
  };

  const onSubmitBid = async () => {
    if (!loadId || bidSent || !canSubmitBid) return;
    setBidError('');
    setBidSuccess('');
    const numericAmount = Number(amount.replace(',', '.'));
    if (Number.isNaN(numericAmount) || numericAmount < 100 || numericAmount > 9999999) {
      setBidError('Fiyat 100 TL ile 9.999.999 TL arasinda olmalıdır.');
      return;
    }
    setSubmitting(true);
    try {
      const res = (await submitBid({
        loadId,
        amount: numericAmount,
        note: note.trim() || undefined,
      })) as Record<string, unknown> | undefined;
      const bidId = Number(res?.bidId ?? res?.BidId ?? 0);
      if (bidId > 0) setPendingBidId(bidId);
      setBidSuccess('Teklifiniz iletildi; müşteri onayı bekleniyor.');
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
      <ScreenContainer>
        <LoadingState message="İlan detayı yükleniyor..." variant="skeleton" />
      </ScreenContainer>
    );
  }

  if (fetchError || !load) {
    return (
      <ScreenContainer style={styles.centered}>
        <Text style={styles.pageTitle}>Yük Detayı</Text>
        <AlertBanner message={fetchError || 'İlan bulunamadı.'} tone="error" />
        <SecondaryButton title="Geri" onPress={() => router.back()} style={{ minWidth: 120 }} />
      </ScreenContainer>
    );
  }

  const yukTipi = formatLoadTypeLabel(load.loadType ?? load.type);
  const mesafe =
    load.distanceKm != null && load.distanceKm > 0
      ? `${load.distanceKm.toLocaleString('tr-TR')} km`
      : '-';
  const statusPill = getLoadStatusPill(load.status);
  const { edgeStyle } = useScreenInsets();

  return (
    <KeyboardAvoidingView
      style={[screenRootStyle, edgeStyle]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenScroll contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <GhostButton title="← Yük Panosu" onPress={() => router.back()} style={styles.backBtn} />

        <FadeInView>
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.pageTitle}>Yük Detayı</Text>
            <Text style={styles.route}>
              {load.fromCity} → {load.toCity}
            </Text>
            <Text style={styles.districts}>
              {load.fromDistrict} / {load.toDistrict}
            </Text>
          </View>
          <StatusPill label={statusPill.label} tone={statusPill.tone} />
        </View>
        </FadeInView>

        <FadeInView delay={40}>
        <Card variant="glass" padding={4}>
          <Text style={styles.sectionLabel}>Güzergah</Text>
          <Text style={styles.routeBody}>
            {load.fromCity} ({load.fromDistrict}) → {load.toCity} ({load.toDistrict})
          </Text>
        </Card>
        </FadeInView>

        <FadeInView delay={60}>
        <Card variant="default" padding={4}>
          <DetailRow label="Liste fiyatı" value={formatCurrencyTRY(load.price)} />
          <DetailRow label="Yük tipi" value={yukTipi} />
          <DetailRow label="Ağırlık" value={formatWeightKg(load.weight)} />
          <DetailRow label="Hacim" value={load.volume ? `${load.volume} m³` : '-'} />
          <DetailRow label="Mesafe" value={mesafe} />
          <DetailRow label="Müşteri" value={load.ownerFullName || '-'} />
          <DetailRow label="Teklif sayısı" value={String(load.bidCount)} />
        </Card>
        </FadeInView>

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

        {load.description ? (
          <FadeInView delay={80}>
          <Card variant="default" padding={4}>
            <Text style={styles.sectionLabel}>Açıklama</Text>
            <Text style={styles.desc}>{load.description}</Text>
          </Card>
          </FadeInView>
        ) : null}

        {canDriverOpenChat(load) ? (
          <SecondaryButton
            title="Müşteriyle Sohbet"
            onPress={() => router.push({ pathname: '/chat', params: { loadId } })}
          />
        ) : null}

        <FadeInView delay={100}>
        <Card variant="elevated" padding={5} style={styles.bidCard}>
          <Text style={styles.bidTitle}>Teklif Ver</Text>
          {!canSubmitBid && driverApproved !== null ? (
            <AlertBanner message="Hesabınız onay bekliyor. Belgeleriniz onaylandıktan sonra teklif verebilirsiniz." tone="info" />
          ) : (
            <Text style={styles.bidSub}>Navlun tutarınızı TL olarak girin.</Text>
          )}

          {bidSuccess ? <AlertBanner message={bidSuccess} tone="success" /> : null}
          {bidError ? <AlertBanner message={bidError} tone="error" /> : null}

          <TextField
            label="Teklif tutarı (TL)"
            icon="cash-outline"
            placeholder="Örn: 15000"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
            editable={canSubmitBid && !bidSent && !submitting}
          />

          <TextField
            label="Not (isteğe bağlı)"
            placeholder="Müşteriye iletilecek kısa not"
            value={note}
            onChangeText={setNote}
            editable={canSubmitBid && !bidSent && !submitting}
            multiline
          />

          <PrimaryButton
            title={bidSent ? 'Teklif Gönderildi' : 'Teklif Gönder'}
            onPress={onSubmitBid}
            loading={submitting}
            disabled={driverApproved === false || driverApproved === null || bidSent}
          />

          {pendingBidId && bidSent ? (
            <SecondaryButton
              title={cancelling ? 'İptal ediliyor…' : 'Teklifi İptal Et'}
              onPress={onCancelBid}
              disabled={cancelling}
            />
          ) : null}
        </Card>
        </FadeInView>
      </ScreenScroll>
    </KeyboardAvoidingView>
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
  pageTitle: { ...typography.h1, marginBottom: space.xs },
  route: { ...typography.h2, fontSize: 18, color: palette.gold },
  districts: { ...typography.caption, textTransform: 'none' },
  sectionLabel: { ...typography.label, marginBottom: space.sm },
  routeBody: { ...typography.bodyMedium },
  aiCard: { borderColor: palette.goldBorder, backgroundColor: palette.goldMuted },
  aiTitle: { ...typography.bodySmall, color: palette.gold },
  aiPrice: { ...typography.h2, fontSize: 22, marginVertical: space.xs },
  aiMeta: { ...typography.caption, textTransform: 'none' },
  desc: { ...typography.body, marginTop: space.xs },
  bidCard: { borderColor: palette.brandBorder },
  bidTitle: { ...typography.h2, fontSize: 18 },
  bidSub: { ...typography.caption, textTransform: 'none', marginBottom: space.sm },
});
