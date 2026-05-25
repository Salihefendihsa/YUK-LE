import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { DateTimePickerField } from '../../../src/components/datetime/DateTimePickerField';
import { TrLocationFields } from '../../../src/components/location/TrLocationFields';
import { ScreenHeader } from '../../../src/components/ScreenHeader';
import { AlertBanner } from '../../../src/components/ui/AlertBanner';
import { Card } from '../../../src/components/ui/Card';
import { Chip } from '../../../src/components/ui/Chip';
import { FadeInView } from '../../../src/components/ui/FadeInView';
import { LoadingState } from '../../../src/components/ui/LoadingState';
import { PressableScale } from '../../../src/components/ui/PressableScale';
import { PrimaryButton } from '../../../src/components/ui/PrimaryButton';
import { SecondaryButton } from '../../../src/components/ui/SecondaryButton';
import { TextField } from '../../../src/components/ui/TextField';
import { ScreenScroll } from '../../../src/constants/layout';
import { resolveCoordinates } from '../../../src/data/tr-location';
import { getApiErrorMessage } from '../../../src/services/api.client';
import { getMyAddresses } from '../../../src/services/addresses.service';
import {
  createLoad,
  getLoadById,
  getLoadPriceSuggestion,
  previewLoadPriceSuggestion,
  updateLoad,
} from '../../../src/services/loads.service';
import { getBidsForLoad } from '../../../src/services/bids.service';
import type { DeliveryAddress } from '../../../src/types/address';
import type { AiMarketAnalysis, CreateLoadPayload, LoadTypeValue, VehicleTypeValue } from '../../../src/types/create-load';
import { palette } from '../../../src/theme/colors';
import { typography } from '../../../src/theme/typography';
import { radius } from '../../../src/theme/radius';
import { space, spacing } from '../../../src/theme/spacing';
import { formatCurrencyTRY } from '../../../src/utils/format';

const VEHICLE_OPTIONS: { value: VehicleTypeValue; label: string }[] = [
  { value: 0, label: 'TIR' },
  { value: 1, label: 'Kamyon' },
  { value: 2, label: 'Kamyonet' },
  { value: 3, label: 'Panelvan' },
];

const LOAD_TYPE_OPTIONS: { value: LoadTypeValue; label: string }[] = [
  { value: 0, label: 'Paletli' },
  { value: 1, label: 'Dökme' },
  { value: 2, label: 'Soğuk Zincir' },
  { value: 3, label: 'Tehlikeli Madde' },
  { value: 4, label: 'Parsiyel' },
];

function parseNum(v: string): number | null {
  const n = Number(v.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function coordsFromAddress(addr: DeliveryAddress) {
  if (addr.latitude != null && addr.longitude != null) {
    return { latitude: addr.latitude, longitude: addr.longitude };
  }
  return resolveCoordinates(addr.city, addr.district);
}

export default function CustomerCreateLoadScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; editId?: string }>();
  const editId = params.editId ?? params.id;
  const isEdit = Boolean(editId);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [prefillLoading, setPrefillLoading] = useState(isEdit);
  const [openBidCount, setOpenBidCount] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [aiResult, setAiResult] = useState<AiMarketAnalysis | null>(null);
  const [pricePreview, setPricePreview] = useState<AiMarketAnalysis | null>(null);
  const [pricePreviewLoading, setPricePreviewLoading] = useState(false);
  const [pricePreviewError, setPricePreviewError] = useState('');
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  const [addressPickerOpen, setAddressPickerOpen] = useState(false);
  const createAbortRef = useRef<AbortController | null>(null);

  const [fromCoordsOverride, setFromCoordsOverride] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [toCoordsOverride, setToCoordsOverride] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [fromCity, setFromCity] = useState('');
  const [fromDistrict, setFromDistrict] = useState('');
  const [toCity, setToCity] = useState('');
  const [toDistrict, setToDistrict] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleTypeValue>(1);
  const [loadType, setLoadType] = useState<LoadTypeValue>(0);
  const [weight, setWeight] = useState('');
  const [volume, setVolume] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    void getMyAddresses().then(setAddresses).catch(() => setAddresses([]));
  }, []);

  useEffect(() => {
    if (!editId) return;
    let cancelled = false;
    setPrefillLoading(true);
    void Promise.all([getLoadById(editId), getBidsForLoad(editId)])
      .then(([load, bids]) => {
        if (cancelled) return;
        setFromCity(load.fromCity);
        setFromDistrict(load.fromDistrict);
        setToCity(load.toCity);
        setToDistrict(load.toDistrict);
        setWeight(String(load.weight));
        setVolume(load.volume > 0 ? String(load.volume) : '');
        setPrice(String(load.price));
        setDescription(load.description ?? '');
        setPickupDate(new Date(load.pickupDate));
        setDeliveryDate(new Date(load.deliveryDate));
        setOpenBidCount(bids.filter((b) => b.status === 'Pending').length);
        const fromC = resolveCoordinates(load.fromCity, load.fromDistrict);
        const toC = resolveCoordinates(load.toCity, load.toDistrict);
        if (fromC) setFromCoordsOverride(fromC);
        if (toC) setToCoordsOverride(toC);
      })
      .catch((e) => setError(getApiErrorMessage(e)))
      .finally(() => {
        if (!cancelled) setPrefillLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [editId]);

  const fromCoords = useMemo(() => {
    if (fromCoordsOverride) return fromCoordsOverride;
    if (!fromCity.trim() || !fromDistrict.trim()) return null;
    return resolveCoordinates(fromCity, fromDistrict);
  }, [fromCity, fromDistrict, fromCoordsOverride]);

  const toCoords = useMemo(() => {
    if (toCoordsOverride) return toCoordsOverride;
    if (!toCity.trim() || !toDistrict.trim()) return null;
    return resolveCoordinates(toCity, toDistrict);
  }, [toCity, toDistrict, toCoordsOverride]);

  const step1Valid = useMemo(() => {
    return (
      fromCity.trim().length > 0 &&
      fromDistrict.trim().length > 0 &&
      toCity.trim().length > 0 &&
      toDistrict.trim().length > 0 &&
      fromCoords != null &&
      toCoords != null &&
      pickupDate.length > 0 &&
      deliveryDate.length > 0
    );
  }, [fromCity, fromDistrict, toCity, toDistrict, fromCoords, toCoords, pickupDate, deliveryDate]);

  const step2Valid = useMemo(() => {
    const w = parseNum(weight);
    return w != null && w >= 1 && w <= 40000;
  }, [weight]);

  const step3Valid = useMemo(() => {
    const p = parseNum(price);
    if (p == null || p < 100 || p > 9999999) return false;
    const pickup = new Date(pickupDate);
    const delivery = new Date(deliveryDate);
    if (Number.isNaN(pickup.getTime()) || Number.isNaN(delivery.getTime())) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (pickup < today) return false;
    if (delivery < pickup) return false;
    return true;
  }, [price, pickupDate, deliveryDate]);

  const canGoNext = step === 1 ? step1Valid : step === 2 ? step2Valid : step3Valid;
  const canSubmit = step1Valid && step2Valid && step3Valid && !loading;

  const previewInputsReady = step1Valid && step2Valid && fromCoords != null && toCoords != null;

  useEffect(() => {
    if (step !== 3 || !previewInputsReady || isEdit) {
      setPricePreview(null);
      setPricePreviewError('');
      setPricePreviewLoading(false);
      return;
    }
    const w = parseNum(weight);
    if (w == null) return;
    const vol = parseNum(volume);
    const ac = new AbortController();
    const timer = setTimeout(() => {
      setPricePreviewLoading(true);
      setPricePreviewError('');
      void previewLoadPriceSuggestion(
        {
          originLat: fromCoords!.latitude,
          originLng: fromCoords!.longitude,
          destLat: toCoords!.latitude,
          destLng: toCoords!.longitude,
          fromCity: fromCity.trim(),
          toCity: toCity.trim(),
          vehicleType,
          weight: w,
          volume: vol != null && vol > 0 ? vol : undefined,
        },
        { signal: ac.signal }
      )
        .then((result) => {
          if (!ac.signal.aborted) setPricePreview(result);
        })
        .catch((e) => {
          if (!ac.signal.aborted) {
            setPricePreview(null);
            setPricePreviewError(getApiErrorMessage(e));
          }
        })
        .finally(() => {
          if (!ac.signal.aborted) setPricePreviewLoading(false);
        });
    }, 600);
    return () => {
      clearTimeout(timer);
      ac.abort();
    };
  }, [
    step,
    previewInputsReady,
    isEdit,
    fromCoords,
    toCoords,
    fromCity,
    toCity,
    vehicleType,
    weight,
    volume,
  ]);

  const applyAddress = (addr: DeliveryAddress, target: 'from' | 'to') => {
    const coords = coordsFromAddress(addr);
    if (target === 'from') {
      setFromCity(addr.city);
      setFromDistrict(addr.district);
      setFromCoordsOverride(coords);
    } else {
      setToCity(addr.city);
      setToDistrict(addr.district);
      setToCoordsOverride(coords);
    }
  };

  const buildPayload = (): CreateLoadPayload => {
    const vol = parseNum(volume);
    return {
      fromCity: fromCity.trim(),
      fromDistrict: fromDistrict.trim(),
      toCity: toCity.trim(),
      toDistrict: toDistrict.trim(),
      fromLatitude: fromCoords!.latitude,
      fromLongitude: fromCoords!.longitude,
      toLatitude: toCoords!.latitude,
      toLongitude: toCoords!.longitude,
      pickupDate,
      deliveryDate,
      weight: parseNum(weight)!,
      volume: vol != null && vol > 0 ? vol : undefined,
      loadType,
      requiredVehicleType: vehicleType,
      price: parseNum(price)!,
      currency: 'TRY',
      description: description.trim() || undefined,
    };
  };

  const cancelCreate = () => {
    createAbortRef.current?.abort();
    createAbortRef.current = null;
    setLoading(false);
    setError('İlan oluşturma iptal edildi. Form verileriniz korundu.');
  };

  const handleCreate = async () => {
    if (!canSubmit) return;
    createAbortRef.current?.abort();
    const ac = new AbortController();
    createAbortRef.current = ac;
    setLoading(true);
    setError('');
    try {
      if (isEdit && editId) {
        const updated = await updateLoad(editId, buildPayload());
        setAiResult(
          updated.load.aiSuggestedPrice
            ? {
                recommendedPrice: updated.load.aiSuggestedPrice,
                minPrice: updated.load.aiMinPrice ?? 0,
                maxPrice: updated.load.aiMaxPrice ?? 0,
                reasoning: updated.load.aiPriceReasoning ?? '',
                distanceKm: updated.load.distanceKm ?? 0,
              }
            : null
        );
        setSuccess(true);
        return;
      }
      const created = await createLoad(buildPayload(), { signal: ac.signal });
      let ai = created.aiMarketAnalysis ?? null;
      if (created.load?.id) {
        try {
          const extra = await getLoadPriceSuggestion(created.load.id, { signal: ac.signal });
          if (extra) {
            ai = {
              ...extra,
              distanceKm: extra.distanceKm || ai?.distanceKm || 0,
              reasoning: extra.reasoning || ai?.reasoning || '',
            };
          }
        } catch {
          /* POST yanıtındaki aiMarketAnalysis yeterli */
        }
      }
      setAiResult(ai);
      setSuccess(true);
    } catch (e) {
      const err = e as { code?: string; name?: string };
      if (ac.signal.aborted || err.code === 'ERR_CANCELED' || err.name === 'CanceledError') {
        setError('İlan oluşturma iptal edildi veya zaman aşımına uğradı. Tekrar deneyebilirsiniz.');
      } else {
        setError(getApiErrorMessage(e));
      }
    } finally {
      setLoading(false);
      createAbortRef.current = null;
    }
  };

  const goToLoads = () => {
    setSuccess(false);
    if (isEdit && editId) {
      router.replace({ pathname: '/(customer)/load-detail', params: { id: editId } });
      return;
    }
    router.replace('/(customer)/(tabs)/loads');
  };

  const pickupMin = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const deliveryMin = useMemo(() => {
    if (!pickupDate) return pickupMin;
    const d = new Date(pickupDate);
    return Number.isNaN(d.getTime()) ? pickupMin : d;
  }, [pickupDate, pickupMin]);

  if (prefillLoading) {
    return (
      <ScreenScroll contentContainerStyle={styles.scroll}>
        <LoadingState message="İlan yükleniyor…" variant="skeleton" />
      </ScreenScroll>
    );
  }

  return (
    <>
      <ScreenScroll contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <ScreenHeader
          title={isEdit ? 'İlanı Düzenle' : 'İlan Oluştur'}
          subtitle={isEdit ? 'Açık teklifler bilgilendirilecek' : '3 adımlı ilan oluşturma'}
        />

        {isEdit && openBidCount > 0 ? (
          <AlertBanner
            message={`${openBidCount} açık teklif var — güncelleme sonrası teklif verenler bilgilendirilecek.`}
            tone="info"
          />
        ) : null}

        <Text style={styles.stepBadge}>Adım {step} / 3</Text>
        <View style={styles.stepRow}>
          {[1, 2, 3].map((n) => (
            <View
              key={n}
              style={[styles.stepChip, step === n && styles.stepChipOn, step > n && styles.stepChipDone]}
            >
              <Text style={[styles.stepChipText, (step === n || step > n) && styles.stepChipTextOn]}>
                {step > n ? '✓' : n}
              </Text>
            </View>
          ))}
        </View>

        {error ? <AlertBanner message={error} tone="error" /> : null}

        {step === 1 ? (
          <Card variant="default" padding={4}>
            <Text style={styles.sectionTitle}>Güzergah ve zaman</Text>

            {addresses.length > 0 ? (
              <View style={styles.addressBlock}>
                <Text style={styles.addressLabel}>Kayıtlı adreslerimden seç</Text>
                <SecondaryButton
                  title="Adres defterini aç"
                  onPress={() => setAddressPickerOpen(true)}
                />
              </View>
            ) : null}

            <TrLocationFields
              labelPrefix="Çıkış"
              city={fromCity}
              district={fromDistrict}
              onChange={({ city, district }) => {
                setFromCity(city);
                setFromDistrict(district);
                setFromCoordsOverride(null);
              }}
            />
            <TrLocationFields
              labelPrefix="Varış"
              city={toCity}
              district={toDistrict}
              onChange={({ city, district }) => {
                setToCity(city);
                setToDistrict(district);
                setToCoordsOverride(null);
              }}
            />

            <DateTimePickerField
              label="Yükleme tarihi"
              value={pickupDate}
              onChange={setPickupDate}
              minimumDate={pickupMin}
            />
            <DateTimePickerField
              label="Teslim tarihi"
              value={deliveryDate}
              onChange={setDeliveryDate}
              minimumDate={deliveryMin}
            />

            {fromCoords && toCoords ? (
              <Text style={styles.coordHint}>
                Konum otomatik belirlendi ({fromCity}/{fromDistrict} → {toCity}/{toDistrict})
              </Text>
            ) : null}
          </Card>
        ) : null}

        {step === 2 ? (
          <Card variant="default" padding={4}>
            <Text style={styles.sectionTitle}>Yük detayı</Text>
            <Text style={styles.chipGroupLabel}>Araç tipi</Text>
            <View style={styles.chipRow}>
              {VEHICLE_OPTIONS.map((o) => (
                <Chip
                  key={o.value}
                  label={o.label}
                  selected={vehicleType === o.value}
                  onPress={() => setVehicleType(o.value)}
                />
              ))}
            </View>
            <Text style={styles.chipGroupLabel}>Yük tipi</Text>
            <View style={styles.chipRow}>
              {LOAD_TYPE_OPTIONS.map((o) => (
                <Chip
                  key={o.value}
                  label={o.label}
                  selected={loadType === o.value}
                  onPress={() => setLoadType(o.value)}
                />
              ))}
            </View>
            <TextField label="Ağırlık (kg)" value={weight} onChangeText={setWeight} keyboardType="numeric" />
            <TextField label="Hacim (m³)" value={volume} onChangeText={setVolume} keyboardType="numeric" />
            <TextField
              label="Açıklama"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />
          </Card>
        ) : null}

        {step === 3 ? (
          <Card variant="default" padding={4}>
            <Text style={styles.sectionTitle}>Fiyatlandırma</Text>
            <Card variant="elevated" padding={4} style={styles.aiInfoCard}>
              <Text style={styles.aiInfoTitle}>Önerilen fiyat</Text>
              {pricePreviewLoading ? (
                <View style={styles.previewRow}>
                  <ActivityIndicator color={palette.brand} size="small" />
                  <Text style={styles.aiInfoBody}>Fiyat hesaplanıyor…</Text>
                </View>
              ) : pricePreview && pricePreview.recommendedPrice > 0 ? (
                <>
                  <Text style={styles.aiPreviewPrice}>
                    {formatCurrencyTRY(pricePreview.recommendedPrice)}
                  </Text>
                  <Text style={styles.aiInfoBody}>
                    Aralık: {formatCurrencyTRY(pricePreview.minPrice)} –{' '}
                    {formatCurrencyTRY(pricePreview.maxPrice)}
                  </Text>
                  {pricePreview.distanceKm > 0 ? (
                    <Text style={styles.aiInfoBody}>
                      Mesafe: {pricePreview.distanceKm.toFixed(1)} km
                    </Text>
                  ) : null}
                </>
              ) : (
                <Text style={styles.aiInfoBody}>
                  {pricePreviewError ||
                    (previewInputsReady
                      ? 'Önerilen fiyat şu an hesaplanamadı. Liste fiyatınızı girebilir veya kayıt sonrası tekrar deneyebilirsiniz.'
                      : 'Güzergah ve yük bilgilerini tamamladığınızda önerilen fiyat burada görünür.')}
                </Text>
              )}
            </Card>
            <TextField label="Liste fiyatı (TL)" value={price} onChangeText={setPrice} keyboardType="numeric" icon="cash-outline" />
            {parseNum(price) != null ? (
              <Text style={styles.preview}>Önizleme: {formatCurrencyTRY(parseNum(price)!)}</Text>
            ) : null}
          </Card>
        ) : null}

        <View style={styles.navRow}>
          <SecondaryButton
            title="Geri"
            onPress={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1 || loading}
            style={styles.navHalf}
          />
          {step < 3 ? (
            <PrimaryButton
              title="İleri"
              onPress={() => setStep((s) => s + 1)}
              disabled={!canGoNext}
              style={styles.navHalf}
            />
          ) : (
            <PrimaryButton
              title="İlanı Kaydet"
              onPress={handleCreate}
              loading={loading}
              disabled={!canSubmit}
              style={styles.navHalf}
            />
          )}
        </View>
      </ScreenScroll>

      <Modal visible={addressPickerOpen} animationType="slide" onRequestClose={() => setAddressPickerOpen(false)}>
        <View style={styles.addressModal}>
          <View style={styles.addressModalHead}>
            <Text style={styles.addressModalTitle}>Kayıtlı adresler</Text>
            <PressableScale onPress={() => setAddressPickerOpen(false)}>
              <Text style={styles.addressModalClose}>Kapat</Text>
            </PressableScale>
          </View>
          {addresses.map((addr) => (
            <FadeInView key={addr.id}>
            <View style={styles.addressRow}>
              <Text style={styles.addressTitle}>{addr.title}</Text>
              <Text style={styles.addressMeta}>
                {addr.city}/{addr.district}
              </Text>
              <View style={styles.addressActions}>
                <PressableScale
                  style={styles.addressBtn}
                  onPress={() => {
                    applyAddress(addr, 'from');
                    setAddressPickerOpen(false);
                  }}
                >
                  <Text style={styles.addressBtnText}>Çıkış olarak</Text>
                </PressableScale>
                <PressableScale
                  style={[styles.addressBtn, styles.addressBtnAlt]}
                  onPress={() => {
                    applyAddress(addr, 'to');
                    setAddressPickerOpen(false);
                  }}
                >
                  <Text style={styles.addressBtnText}>Varış olarak</Text>
                </PressableScale>
              </View>
            </View>
            </FadeInView>
          ))}
        </View>
      </Modal>

      <Modal visible={loading} transparent animationType="fade">
        <View style={styles.overlay}>
          <ActivityIndicator color={palette.brand} size="large" />
          <Text style={styles.overlayText}>
            {isEdit ? 'İlan güncelleniyor…' : 'İlan oluşturuluyor, rota ve fiyat hesaplanıyor…'}
          </Text>
          <Text style={styles.overlaySub}>Bu işlem bir dakikaya kadar sürebilir.</Text>
          <SecondaryButton title="İptal" onPress={cancelCreate} style={styles.cancelBtn} />
        </View>
      </Modal>

      <Modal visible={success} transparent animationType="fade">
        <View style={styles.overlay}>
          <FadeInView>
          <Card variant="glass" padding={5} style={styles.successCard}>
            <Text style={styles.successTitle}>
              {isEdit ? 'İlanınız güncellendi' : 'İlanınız oluşturuldu'}
            </Text>
            {aiResult && aiResult.recommendedPrice > 0 ? (
              <Card variant="elevated" padding={4} style={styles.aiResultCard}>
                <Text style={styles.aiResultLabel}>Önerilen fiyat</Text>
                <Text style={styles.aiResultPrice}>{formatCurrencyTRY(aiResult.recommendedPrice)}</Text>
                <Text style={styles.aiMeta}>
                  Aralık: {formatCurrencyTRY(aiResult.minPrice)} – {formatCurrencyTRY(aiResult.maxPrice)}
                </Text>
                {aiResult.distanceKm > 0 ? (
                  <Text style={styles.aiMeta}>Mesafe: {aiResult.distanceKm.toFixed(1)} km</Text>
                ) : null}
              </Card>
            ) : (
              <Text style={styles.aiMeta}>
                Önerilen fiyat şu an hesaplanamadı; ilan yine de kaydedildi.
              </Text>
            )}
            <PrimaryButton title="İlanlarım" onPress={goToLoads} />
          </Card>
          </FadeInView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: space.md, paddingBottom: spacing[10] },
  stepBadge: { ...typography.label, color: palette.gold, marginBottom: space.sm },
  stepRow: { flexDirection: 'row', gap: space.sm, marginBottom: space.md },
  stepChip: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: palette.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surface,
  },
  stepChipOn: { borderColor: palette.brandBorder, backgroundColor: palette.brandMuted },
  stepChipDone: { borderColor: palette.successBorder, backgroundColor: palette.successBg },
  stepChipText: { ...typography.bodySmall, fontFamily: typography.bodyMedium.fontFamily, color: palette.textMuted },
  stepChipTextOn: { color: palette.text },
  sectionTitle: { ...typography.h3, color: palette.gold, marginBottom: spacing[3] },
  addressBlock: { marginBottom: space.md, gap: space.sm },
  addressLabel: { ...typography.label },
  coordHint: {
    ...typography.caption,
    textTransform: 'none',
    color: palette.textMuted,
    marginTop: space.sm,
  },
  chipGroupLabel: { ...typography.label, marginBottom: space.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginBottom: space.md },
  aiInfoCard: { borderColor: palette.goldBorder, backgroundColor: palette.goldMuted, marginBottom: spacing[3] },
  aiInfoTitle: { ...typography.bodySmall, color: palette.gold },
  aiInfoBody: { ...typography.caption, textTransform: 'none', marginTop: space.xs },
  aiPreviewPrice: { ...typography.h2, color: palette.gold, marginTop: space.sm },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.sm },
  preview: { ...typography.caption, textTransform: 'none', color: palette.gold },
  navRow: { flexDirection: 'row', gap: spacing[3], marginTop: space.md },
  navHalf: { flex: 1 },
  addressModal: { flex: 1, backgroundColor: palette.bg, paddingTop: space.xl, paddingHorizontal: space.md },
  addressModalHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space.md,
  },
  addressModalTitle: { ...typography.h2, fontSize: 18 },
  addressModalClose: { ...typography.link },
  addressRow: {
    borderWidth: 1,
    borderColor: palette.borderLight,
    borderRadius: radius.md,
    padding: space.md,
    marginBottom: spacing[3],
    gap: space.sm,
  },
  addressTitle: { ...typography.bodyMedium },
  addressMeta: { ...typography.caption, textTransform: 'none' },
  addressActions: { flexDirection: 'row', gap: space.sm, marginTop: space.sm },
  addressBtn: {
    flex: 1,
    paddingVertical: space.sm,
    borderRadius: radius.md,
    backgroundColor: palette.brandMuted,
    alignItems: 'center',
  },
  addressBtnAlt: { backgroundColor: palette.goldMuted },
  addressBtnText: { ...typography.caption, fontSize: 12, color: palette.text },
  overlay: {
    flex: 1,
    backgroundColor: palette.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.lg,
  },
  overlayText: { ...typography.body, marginTop: space.md, textAlign: 'center' },
  overlaySub: {
    ...typography.caption,
    textTransform: 'none',
    color: palette.textMuted,
    textAlign: 'center',
    marginTop: space.sm,
    marginBottom: space.md,
  },
  cancelBtn: { minWidth: 140 },
  successCard: { width: '100%', maxWidth: 360, gap: space.md },
  successTitle: { ...typography.h2, textAlign: 'center' },
  aiResultCard: { borderColor: palette.goldBorder, backgroundColor: palette.goldMuted },
  aiResultLabel: { ...typography.caption, color: palette.gold },
  aiResultPrice: { ...typography.h1, fontSize: 26, marginVertical: space.sm },
  aiMeta: { ...typography.caption, textTransform: 'none' },
});
