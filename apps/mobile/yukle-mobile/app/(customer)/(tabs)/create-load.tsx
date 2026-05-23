import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ScreenHeader } from '../../../src/components/ScreenHeader';
import { AlertBanner } from '../../../src/components/ui/AlertBanner';
import { Card } from '../../../src/components/ui/Card';
import { PrimaryButton } from '../../../src/components/ui/PrimaryButton';
import { SecondaryButton } from '../../../src/components/ui/SecondaryButton';
import { TextField } from '../../../src/components/ui/TextField';
import { ScreenScroll } from '../../../src/constants/layout';
import { getApiErrorMessage } from '../../../src/services/api.client';
import { createLoad, getLoadPriceSuggestion } from '../../../src/services/loads.service';
import type { AiMarketAnalysis, CreateLoadPayload, LoadTypeValue, VehicleTypeValue } from '../../../src/types/create-load';
import { palette } from '../../../src/theme/colors';
import { fontFamily, typography } from '../../../src/theme/typography';
import { radius } from '../../../src/theme/radius';
import { spacing } from '../../../src/theme/spacing';
import { formatCurrencyTRY } from '../../../src/utils/format';

const DEFAULT_FROM = {
  fromCity: 'Elazig',
  fromDistrict: 'OSB',
  fromLatitude: 38.636,
  fromLongitude: 39.0844,
};

const DEFAULT_TO = {
  toCity: 'Malatya',
  toDistrict: 'Merkez',
  toLatitude: 38.3552,
  toLongitude: 38.3095,
};

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

function defaultPickupIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(8, 0, 0, 0);
  return d.toISOString();
}

function defaultDeliveryIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  d.setHours(18, 0, 0, 0);
  return d.toISOString();
}

function parseNum(v: string): number | null {
  const n = Number(v.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

export default function CustomerCreateLoadScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [aiResult, setAiResult] = useState<AiMarketAnalysis | null>(null);

  const [fromCity, setFromCity] = useState(DEFAULT_FROM.fromCity);
  const [fromDistrict, setFromDistrict] = useState(DEFAULT_FROM.fromDistrict);
  const [fromLat, setFromLat] = useState(String(DEFAULT_FROM.fromLatitude));
  const [fromLng, setFromLng] = useState(String(DEFAULT_FROM.fromLongitude));
  const [toCity, setToCity] = useState(DEFAULT_TO.toCity);
  const [toDistrict, setToDistrict] = useState(DEFAULT_TO.toDistrict);
  const [toLat, setToLat] = useState(String(DEFAULT_TO.toLatitude));
  const [toLng, setToLng] = useState(String(DEFAULT_TO.toLongitude));
  const [pickupDate, setPickupDate] = useState(defaultPickupIso());
  const [deliveryDate, setDeliveryDate] = useState(defaultDeliveryIso());
  const [vehicleType, setVehicleType] = useState<VehicleTypeValue>(1);
  const [loadType, setLoadType] = useState<LoadTypeValue>(0);
  const [weight, setWeight] = useState('12000');
  const [volume, setVolume] = useState('24');
  const [price, setPrice] = useState('18500');
  const [description, setDescription] = useState('');

  const step1Valid = useMemo(() => {
    const fl = parseNum(fromLat);
    const fg = parseNum(fromLng);
    const tl = parseNum(toLat);
    const tg = parseNum(toLng);
    return (
      fromCity.trim().length > 0 &&
      fromDistrict.trim().length > 0 &&
      toCity.trim().length > 0 &&
      toDistrict.trim().length > 0 &&
      fl != null &&
      fg != null &&
      tl != null &&
      tg != null &&
      fl >= -90 &&
      fl <= 90 &&
      fg >= -180 &&
      fg <= 180 &&
      tl >= -90 &&
      tl <= 90 &&
      tg >= -180 &&
      tg <= 180
    );
  }, [fromCity, fromDistrict, toCity, toDistrict, fromLat, fromLng, toLat, toLng]);

  const step2Valid = useMemo(() => {
    const w = parseNum(weight);
    return w != null && w >= 1 && w <= 40000;
  }, [weight]);

  const step3Valid = useMemo(() => {
    const p = parseNum(price);
    if (p == null || p < 100 || p > 9999999) return false;
    const pickup = new Date(pickupDate);
    const delivery = new Date(deliveryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (pickup < today) return false;
    if (delivery < pickup) return false;
    return true;
  }, [price, pickupDate, deliveryDate]);

  const canGoNext = step === 1 ? step1Valid : step === 2 ? step2Valid : step3Valid;
  const canSubmit = step1Valid && step2Valid && step3Valid && !loading;

  const buildPayload = (): CreateLoadPayload => {
    const vol = parseNum(volume);
    return {
      fromCity: fromCity.trim(),
      fromDistrict: fromDistrict.trim(),
      toCity: toCity.trim(),
      toDistrict: toDistrict.trim(),
      fromLatitude: parseNum(fromLat)!,
      fromLongitude: parseNum(fromLng)!,
      toLatitude: parseNum(toLat)!,
      toLongitude: parseNum(toLng)!,
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

  const handleCreate = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError('');
    try {
      const created = await createLoad(buildPayload());
      let ai = created.aiMarketAnalysis ?? null;
      if (created.load?.id) {
        try {
          const extra = await getLoadPriceSuggestion(created.load.id);
          if (extra) {
            ai = {
              ...extra,
              distanceKm: extra.distanceKm || ai?.distanceKm || 0,
              reasoning: extra.reasoning || ai?.reasoning || '',
            };
          }
        } catch {
          /* POST yanitindaki aiMarketAnalysis yeterli */
        }
      }
      setAiResult(ai);
      setSuccess(true);
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const goToLoads = () => {
    setSuccess(false);
    router.replace('/(customer)/(tabs)/loads');
  };

  return (
    <>
      <ScreenScroll
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <ScreenHeader title="İlan Oluştur" subtitle="3 adımlı ilan oluşturma" />

        <Text style={styles.stepBadge}>Adım {step} / 3</Text>
        <View style={styles.stepRow}>
          {[1, 2, 3].map((n) => (
            <View
              key={n}
              style={[styles.stepChip, step === n && styles.stepChipOn, step > n && styles.stepChipDone]}
            >
              <Text style={[styles.stepChipText, (step === n || step > n) && styles.stepChipTextOn]}>
                {step > n ? 'OK' : n}
              </Text>
            </View>
          ))}
        </View>

        {error ? <AlertBanner message={error} tone="error" /> : null}

        {step === 1 ? (
          <Card variant="default" padding={4}>
            <Text style={styles.sectionTitle}>Güzergah ve zaman</Text>
            <TextField label="Çıkış şehir" value={fromCity} onChangeText={setFromCity} />
            <TextField label="Çıkış ilçe" value={fromDistrict} onChangeText={setFromDistrict} />
            <TextField label="Çıkış enlem (lat)" value={fromLat} onChangeText={setFromLat} keyboardType="numeric" />
            <TextField label="Çıkış boylam (lng)" value={fromLng} onChangeText={setFromLng} keyboardType="numeric" />
            <TextField label="Varış şehir" value={toCity} onChangeText={setToCity} />
            <TextField label="Varış ilçe" value={toDistrict} onChangeText={setToDistrict} />
            <TextField label="Varış enlem (lat)" value={toLat} onChangeText={setToLat} keyboardType="numeric" />
            <TextField label="Varış boylam (lng)" value={toLng} onChangeText={setToLng} keyboardType="numeric" />
            <TextField label="Yükleme tarihi (ISO)" value={pickupDate} onChangeText={setPickupDate} />
            <TextField label="Teslim tarihi (ISO)" value={deliveryDate} onChangeText={setDeliveryDate} />
            <View style={styles.mapPlaceholder}>
              <Text style={styles.mapHint}>Harita önizlemesi yakında</Text>
            </View>
          </Card>
        ) : null}

        {step === 2 ? (
          <Card variant="default" padding={4}>
            <Text style={styles.sectionTitle}>Yük detayı</Text>
            <Text style={styles.chipGroupLabel}>Arac tipi</Text>
            <View style={styles.chipRow}>
              {VEHICLE_OPTIONS.map((o) => (
                <Pressable
                  key={o.value}
                  style={[styles.chip, vehicleType === o.value && styles.chipOn]}
                  onPress={() => setVehicleType(o.value)}
                >
                  <Text style={[styles.chipText, vehicleType === o.value && styles.chipTextOn]}>
                    {o.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.chipGroupLabel}>Yük tipi</Text>
            <View style={styles.chipRow}>
              {LOAD_TYPE_OPTIONS.map((o) => (
                <Pressable
                  key={o.value}
                  style={[styles.chip, loadType === o.value && styles.chipOn]}
                  onPress={() => setLoadType(o.value)}
                >
                  <Text style={[styles.chipText, loadType === o.value && styles.chipTextOn]}>
                    {o.label}
                  </Text>
                </Pressable>
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
              <Text style={styles.aiInfoBody}>
                İlan kaydedildikten sonra önerilen fiyat hesaplanır ve sonuç ekranda gösterilir.
              </Text>
            </Card>
            <TextField label="Liste fiyatı (TL)" value={price} onChangeText={setPrice} keyboardType="numeric" icon="cash-outline" />
            <Text style={styles.preview}>
              Önizleme: {formatCurrencyTRY(parseNum(price) ?? 0)}
            </Text>
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

      <Modal visible={loading} transparent animationType="fade">
        <View style={styles.overlay}>
          <ActivityIndicator color={palette.brand} size="large" />
          <Text style={styles.overlayText}>İlan oluşturuluyor, fiyat hesaplanıyor...</Text>
        </View>
      </Modal>

      <Modal visible={success} transparent animationType="fade">
        <View style={styles.overlay}>
          <Card variant="glass" padding={5} style={styles.successCard}>
            <Text style={styles.successTitle}>İlanınız oluşturuldu</Text>
            {aiResult && aiResult.recommendedPrice > 0 ? (
              <Card variant="elevated" padding={4} style={styles.aiResultCard}>
                <Text style={styles.aiResultLabel}>Önerilen Adil Fiyat</Text>
                <Text style={styles.aiResultPrice}>{formatCurrencyTRY(aiResult.recommendedPrice)}</Text>
                <Text style={styles.aiMeta}>
                  Aralık: {formatCurrencyTRY(aiResult.minPrice)} – {formatCurrencyTRY(aiResult.maxPrice)}
                </Text>
                <Text style={styles.aiMeta}>Mesafe: {aiResult.distanceKm.toFixed(1)} km</Text>
                {aiResult.reasoning ? (
                  <Text style={styles.aiReason} numberOfLines={4}>
                    {aiResult.reasoning}
                  </Text>
                ) : null}
              </Card>
            ) : (
              <Text style={styles.aiMeta}>
                Önerilen fiyat şu an hesaplanamadı; ilan yine de kaydedildi.
              </Text>
            )}
            <PrimaryButton title="İlanlarım" onPress={goToLoads} />
          </Card>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing[4], paddingBottom: spacing[10] },
  title: { ...typography.h1 },
  sub: { ...typography.caption, textTransform: 'none', marginBottom: spacing[3] },
  stepBadge: { ...typography.label, color: palette.gold, marginBottom: spacing[2] },
  stepRow: { flexDirection: 'row', gap: spacing[2], marginBottom: spacing[4] },
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
  stepChipText: { fontFamily: fontFamily.bold, color: palette.textMuted },
  stepChipTextOn: { color: palette.text },
  sectionTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: 15,
    color: palette.gold,
    marginBottom: spacing[3],
  },
  chipGroupLabel: { ...typography.label, marginBottom: spacing[2] },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2], marginBottom: spacing[4] },
  chip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.borderLight,
    backgroundColor: palette.input,
    flexShrink: 1,
    maxWidth: '100%',
  },
  chipOn: { borderColor: palette.brandBorder, backgroundColor: palette.brandMuted },
  chipText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
    color: palette.textSecondary,
    flexShrink: 1,
  },
  chipTextOn: { color: palette.brand },
  mapPlaceholder: {
    borderWidth: 1,
    borderColor: palette.borderLight,
    borderStyle: 'dashed',
    borderRadius: radius.md,
    padding: spacing[5],
    alignItems: 'center',
    marginTop: spacing[2],
  },
  mapHint: { ...typography.caption, textTransform: 'none' },
  aiInfoCard: { borderColor: palette.goldBorder, backgroundColor: palette.goldMuted, marginBottom: spacing[3] },
  aiInfoTitle: { fontFamily: fontFamily.semiBold, fontSize: 14, color: palette.gold },
  aiInfoBody: { ...typography.caption, textTransform: 'none', marginTop: spacing[1] },
  preview: { ...typography.caption, textTransform: 'none', color: palette.gold },
  navRow: { flexDirection: 'row', gap: spacing[3], marginTop: spacing[4] },
  navHalf: { flex: 1 },
  overlay: {
    flex: 1,
    backgroundColor: palette.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
  },
  overlayText: {
    ...typography.body,
    marginTop: spacing[4],
    textAlign: 'center',
  },
  successCard: { width: '100%', maxWidth: 360, gap: spacing[4] },
  successTitle: { ...typography.h2, textAlign: 'center' },
  aiResultCard: { borderColor: palette.goldBorder, backgroundColor: palette.goldMuted },
  aiResultLabel: { fontFamily: fontFamily.semiBold, fontSize: 12, color: palette.gold },
  aiResultPrice: { fontFamily: fontFamily.bold, fontSize: 26, color: palette.text, marginVertical: spacing[2] },
  aiMeta: { ...typography.caption, textTransform: 'none' },
  aiReason: { ...typography.caption, textTransform: 'none', marginTop: spacing[2] },
});
