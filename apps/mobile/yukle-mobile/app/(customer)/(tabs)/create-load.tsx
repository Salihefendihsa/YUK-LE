import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Colors } from '../../../src/constants/colors';
import { screenRootStyle } from '../../../src/constants/layout';
import { getApiErrorMessage } from '../../../src/services/api.client';
import { createLoad, getLoadPriceSuggestion } from '../../../src/services/loads.service';
import type { AiMarketAnalysis, CreateLoadPayload, LoadTypeValue, VehicleTypeValue } from '../../../src/types/create-load';
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
  { value: 1, label: 'Dokme' },
  { value: 2, label: 'SogukZincir' },
  { value: 3, label: 'TehlikeliMadde' },
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
    <View style={screenRootStyle}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Ilan Olustur</Text>
        <Text style={styles.sub}>3 adimli ilan olusturma (harita sonraki faz)</Text>

        <View style={styles.stepRow}>
          {[1, 2, 3].map((n) => (
            <View key={n} style={[styles.stepChip, step === n && styles.stepChipOn, step > n && styles.stepChipDone]}>
              <Text style={[styles.stepChipText, (step === n || step > n) && styles.stepChipTextOn]}>
                {step > n ? 'OK' : n}
              </Text>
            </View>
          ))}
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {step === 1 ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Guzergah ve zaman</Text>
            <Field label="Cikis sehir" value={fromCity} onChangeText={setFromCity} />
            <Field label="Cikis ilce" value={fromDistrict} onChangeText={setFromDistrict} />
            <Field label="Cikis enlem (lat)" value={fromLat} onChangeText={setFromLat} keyboard="numeric" />
            <Field label="Cikis boylam (lng)" value={fromLng} onChangeText={setFromLng} keyboard="numeric" />
            <Field label="Varis sehir" value={toCity} onChangeText={setToCity} />
            <Field label="Varis ilce" value={toDistrict} onChangeText={setToDistrict} />
            <Field label="Varis enlem (lat)" value={toLat} onChangeText={setToLat} keyboard="numeric" />
            <Field label="Varis boylam (lng)" value={toLng} onChangeText={setToLng} keyboard="numeric" />
            <Field
              label="Yukleme tarihi (ISO)"
              value={pickupDate}
              onChangeText={setPickupDate}
              hint="Ornek: 2026-05-21T08:00:00.000Z"
            />
            <Field
              label="Teslim tarihi (ISO)"
              value={deliveryDate}
              onChangeText={setDeliveryDate}
              hint="Alim tarihinden sonra olmali"
            />
            <View style={styles.mapPlaceholder}>
              <Text style={styles.muted}>Harita onizleme — sonraki faz</Text>
            </View>
          </View>
        ) : null}

        {step === 2 ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Yuk detayi</Text>
            <Text style={styles.fieldLabel}>Arac tipi</Text>
            <View style={styles.chipRow}>
              {VEHICLE_OPTIONS.map((o) => (
                <Pressable
                  key={o.value}
                  style={[styles.chip, vehicleType === o.value && styles.chipOn]}
                  onPress={() => setVehicleType(o.value)}
                >
                  <Text style={[styles.chipText, vehicleType === o.value && styles.chipTextOn]}>{o.label}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.fieldLabel}>Yuk tipi</Text>
            <View style={styles.chipRow}>
              {LOAD_TYPE_OPTIONS.map((o) => (
                <Pressable
                  key={o.value}
                  style={[styles.chip, loadType === o.value && styles.chipOn]}
                  onPress={() => setLoadType(o.value)}
                >
                  <Text style={[styles.chipText, loadType === o.value && styles.chipTextOn]}>{o.label}</Text>
                </Pressable>
              ))}
            </View>
            <Field label="Agirlik (kg)" value={weight} onChangeText={setWeight} keyboard="numeric" />
            <Field label="Hacim (m3)" value={volume} onChangeText={setVolume} keyboard="numeric" />
            <Field label="Aciklama" value={description} onChangeText={setDescription} multiline />
          </View>
        ) : null}

        {step === 3 ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Fiyatlandirma</Text>
            <View style={styles.aiInfoCard}>
              <Text style={styles.aiInfoTitle}>AI onerilen fiyat</Text>
              <Text style={styles.muted}>
                Web ile ayni: ilan kaydedildikten sonra Gemini / OSRM analizi calisir. Sonuc asagida
                gosterilir.
              </Text>
            </View>
            <Field label="Liste fiyati (TL)" value={price} onChangeText={setPrice} keyboard="numeric" />
            <Text style={styles.muted}>Onizleme: {formatCurrencyTRY(parseNum(price) ?? 0)}</Text>
          </View>
        ) : null}

        <View style={styles.navRow}>
          <Pressable
            style={[styles.ghostBtn, step === 1 && styles.btnDisabled]}
            onPress={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1 || loading}
          >
            <Text style={styles.ghostBtnText}>Geri</Text>
          </Pressable>
          {step < 3 ? (
            <Pressable
              style={[styles.primaryBtn, !canGoNext && styles.btnDisabled]}
              onPress={() => setStep((s) => s + 1)}
              disabled={!canGoNext}
            >
              <Text style={styles.primaryBtnText}>Ileri</Text>
            </Pressable>
          ) : (
            <Pressable
              style={[styles.primaryBtn, !canSubmit && styles.btnDisabled]}
              onPress={handleCreate}
              disabled={!canSubmit}
            >
              <Text style={styles.primaryBtnText}>Ilani Kaydet</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>

      <Modal visible={loading} transparent animationType="fade">
        <View style={styles.overlay}>
          <ActivityIndicator color={Colors.primary} size="large" />
          <Text style={styles.overlayText}>Ilan olusturuluyor, AI analizi bekleniyor...</Text>
        </View>
      </Modal>

      <Modal visible={success} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.successCard}>
            <Text style={styles.successTitle}>Ilaniniz olusturuldu</Text>
            {aiResult && aiResult.recommendedPrice > 0 ? (
              <View style={styles.aiResultCard}>
                <Text style={styles.aiResultLabel}>Onerilen Adil Fiyat (GERCEK API)</Text>
                <Text style={styles.aiResultPrice}>{formatCurrencyTRY(aiResult.recommendedPrice)}</Text>
                <Text style={styles.muted}>
                  Aralik: {formatCurrencyTRY(aiResult.minPrice)} – {formatCurrencyTRY(aiResult.maxPrice)}
                </Text>
                <Text style={styles.muted}>Mesafe: {aiResult.distanceKm.toFixed(1)} km</Text>
                {aiResult.reasoning ? (
                  <Text style={styles.aiReason} numberOfLines={4}>
                    {aiResult.reasoning}
                  </Text>
                ) : null}
              </View>
            ) : (
              <Text style={styles.muted}>
                AI fiyat onerisi su an alinamadi; ilan yine de kaydedildi (POST yaniti veya
                /Ai/load/... endpoint).
              </Text>
            )}
            <Pressable style={styles.primaryBtn} onPress={goToLoads}>
              <Text style={styles.primaryBtnText}>Ilanlarim</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  keyboard,
  multiline,
  hint,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboard?: 'default' | 'numeric';
  multiline?: boolean;
  hint?: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMulti]}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboard ?? 'default'}
        multiline={multiline}
        placeholderTextColor={Colors.textMuted}
      />
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40 },
  title: { color: Colors.textPrimary, fontSize: 22, fontWeight: '700' },
  sub: { color: Colors.textSecondary, fontSize: 14, marginBottom: 12 },
  stepRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  stepChip: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgCard,
  },
  stepChipOn: { borderColor: Colors.primary, backgroundColor: 'rgba(255,107,0,0.15)' },
  stepChipDone: { borderColor: Colors.success, backgroundColor: 'rgba(16,185,129,0.12)' },
  stepChipText: { color: Colors.textMuted, fontWeight: '700' },
  stepChipTextOn: { color: Colors.textPrimary },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    gap: 10,
    marginBottom: 12,
  },
  sectionTitle: { color: Colors.primaryGold, fontSize: 15, fontWeight: '700', marginBottom: 4 },
  field: { gap: 4 },
  fieldLabel: { color: Colors.textMuted, fontSize: 12, fontWeight: '600' },
  input: {
    backgroundColor: Colors.bgInput,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  inputMulti: { minHeight: 72, textAlignVertical: 'top' },
  hint: { color: Colors.textMuted, fontSize: 11 },
  mapPlaceholder: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    marginTop: 4,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgInput,
  },
  chipOn: { borderColor: Colors.primary, backgroundColor: 'rgba(255,107,0,0.12)' },
  chipText: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600' },
  chipTextOn: { color: Colors.primary },
  aiInfoCard: {
    backgroundColor: 'rgba(255,182,39,0.08)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primaryGold,
    padding: 12,
    gap: 6,
  },
  aiInfoTitle: { color: Colors.primaryGold, fontWeight: '700', fontSize: 14 },
  muted: { color: Colors.textSecondary, fontSize: 13 },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 8 },
  primaryBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ghostBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ghostBtnText: { color: Colors.textSecondary, fontWeight: '600' },
  primaryBtnText: { color: Colors.bgDark, fontWeight: '700', fontSize: 15 },
  btnDisabled: { opacity: 0.4 },
  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  errorText: { color: Colors.error, fontSize: 13 },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5,6,8,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  overlayText: { color: Colors.textPrimary, marginTop: 16, textAlign: 'center', fontSize: 14 },
  successCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
    padding: 20,
    width: '100%',
    maxWidth: 360,
    gap: 14,
  },
  successTitle: { color: Colors.textPrimary, fontSize: 20, fontWeight: '700', textAlign: 'center' },
  aiResultCard: {
    backgroundColor: 'rgba(255,182,39,0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.primaryGold,
    padding: 14,
    gap: 6,
  },
  aiResultLabel: { color: Colors.primaryGold, fontSize: 12, fontWeight: '700' },
  aiResultPrice: { color: Colors.textPrimary, fontSize: 24, fontWeight: '800' },
  aiReason: { color: Colors.textMuted, fontSize: 11, lineHeight: 16 },
});
