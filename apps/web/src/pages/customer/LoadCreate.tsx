import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { previewLoadPriceSuggestion, type PriceSuggestionPreview } from '../../api/ai'
import { createLoad } from '../../api/loads'
import { getLoadPriceSuggestion } from '../../api/matching'
import { createAddress, getMyAddresses } from '../../api/addresses'
import type { CreateLoadRequest, VehicleTypeValue, LoadTypeValue } from '../../api/types'
import TurkishDateTimePicker from '../../components/common/TurkishDateTimePicker'
import { PageError } from '../../components/common/PageStates'
import { TR_CITIES, getDistrictsByCity, resolveCoordinates } from '../../data/tr-location'
import { formatCurrencyTRY } from '../../utils/format'
import { formatCurrency } from '../../utils/validators'
import '../shared/Page.css'

// Backend enum index'leriyle birebir hizalı (Yukle.Api/Models/Enums.cs).
const VEHICLES: { value: VehicleTypeValue; name: string; label: string }[] = [
  { value: 0, name: 'TIR', label: 'TIR' },
  { value: 1, name: 'Kamyon', label: 'Kamyon' },
  { value: 2, name: 'Kamyonet', label: 'Kamyonet' },
  { value: 3, name: 'Panelvan', label: 'Panelvan' },
  { value: 4, name: 'Frigorifik', label: 'Frigorifik' },
  { value: 5, name: 'Tenteli', label: 'Tenteli' },
  { value: 6, name: 'AcikKasa', label: 'Açık Kasa (Platform)' },
  { value: 7, name: 'Lowboy', label: 'Lowboy' },
  { value: 8, name: 'Tanker', label: 'Tanker' },
  { value: 9, name: 'Damperli', label: 'Damperli' },
  { value: 10, name: 'KonteynerTasiyici', label: 'Konteyner Taşıyıcı' },
  { value: 11, name: 'Silobas', label: 'Silobas' },
]

const LOAD_TYPES: { value: LoadTypeValue; label: string }[] = [
  { value: 0, label: 'Paletli' },
  { value: 1, label: 'Dökme Yük' },
  { value: 2, label: 'Soğuk Zincir' },
  { value: 3, label: 'Tehlikeli Madde (ADR)' },
  { value: 4, label: 'Parsiyel' },
  { value: 5, label: 'Genel Kargo' },
  { value: 6, label: 'Konteyner' },
  { value: 7, label: 'Proje / Ağır Yük' },
  { value: 8, label: 'Canlı Hayvan' },
  { value: 9, label: 'Gıda' },
  { value: 10, label: 'İnşaat Malzemesi' },
  { value: 11, label: 'Akaryakıt / Sıvı' },
  { value: 12, label: 'Tahıl / Hububat' },
  { value: 13, label: 'Otomotiv (Araç Taşıma)' },
  { value: 14, label: 'Mobilya / Beyaz Eşya' },
  { value: 15, label: 'Kimyasal' },
]

/** Baştaki sıfırları temizler, virgülü noktaya çevirir, tek ondalık bırakır; boşsa boş kalır. */
function sanitizeNumericInput(raw: string): string {
  let s = raw.replace(/[^\d.,]/g, '').replace(/,/g, '.')
  const firstDot = s.indexOf('.')
  if (firstDot !== -1) {
    s = s.slice(0, firstDot + 1) + s.slice(firstDot + 1).replace(/\./g, '')
  }
  // "060" → "60", "027000" → "27000"; ama "0.5" ve "0" korunur.
  s = s.replace(/^0+(?=\d)/, '')
  return s
}

function toNum(s: string): number | null {
  if (s.trim() === '') return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

// Açık adres anlamlı olmalı ("dsa" gibi kısa girişler reddedilir).
const MIN_ADDRESS_LEN = 10

/**
 * İlçe + açık adresi backend'e tek string olarak birleştirir (migration yok).
 * Backend FromDistrict/ToDistrict StringLength(100) olduğundan sonuç 100 ile sınırlanır.
 */
function mergeDistrictAddress(district: string, addressLine: string): string {
  const d = district.trim()
  const a = addressLine.trim()
  if (!a) return d
  const combined = `${d} — ${a}`
  return combined.length <= 100 ? combined : combined.slice(0, 100)
}

export default function CustomerLoadCreatePage() {
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [addresses, setAddresses] = useState<Array<Record<string, unknown>>>([])

  const [fromAddressLine, setFromAddressLine] = useState('')
  const [toAddressLine, setToAddressLine] = useState('')

  const [saveAddress, setSaveAddress] = useState(false)
  const [savedAddressName, setSavedAddressName] = useState('')

  // Sayısal alanlar string olarak tutulur: boş kalabilir, baştaki sıfır temizlenir.
  const [weightStr, setWeightStr] = useState('')
  const [volumeStr, setVolumeStr] = useState('')
  const [priceStr, setPriceStr] = useState('')

  const [pricePreview, setPricePreview] = useState<PriceSuggestionPreview | null>(null)
  const [pricePreviewLoading, setPricePreviewLoading] = useState(false)
  const [pricePreviewError, setPricePreviewError] = useState('')

  const [form, setForm] = useState<CreateLoadRequest>({
    fromCity: '',
    fromDistrict: '',
    toCity: '',
    toDistrict: '',
    fromLatitude: 39.9208,
    fromLongitude: 32.8541,
    toLatitude: 41.0082,
    toLongitude: 28.9784,
    pickupDate: new Date().toISOString(),
    deliveryDate: new Date(Date.now() + 86400000).toISOString(),
    requiredVehicleType: 0,
    loadType: 0,
    weight: 0,
    volume: undefined,
    price: 0,
    currency: 'TRY',
    description: '',
  })

  const fromCoords = useMemo(() => {
    if (!form.fromCity.trim() || !form.fromDistrict.trim()) return null
    return resolveCoordinates(form.fromCity, form.fromDistrict)
  }, [form.fromCity, form.fromDistrict])

  const toCoords = useMemo(() => {
    if (!form.toCity.trim() || !form.toDistrict.trim()) return null
    return resolveCoordinates(form.toCity, form.toDistrict)
  }, [form.toCity, form.toDistrict])

  useEffect(() => {
    if (!fromCoords) return
    setForm((prev) => ({ ...prev, fromLatitude: fromCoords.latitude, fromLongitude: fromCoords.longitude }))
  }, [fromCoords?.latitude, fromCoords?.longitude])

  useEffect(() => {
    if (!toCoords) return
    setForm((prev) => ({ ...prev, toLatitude: toCoords.latitude, toLongitude: toCoords.longitude }))
  }, [toCoords?.latitude, toCoords?.longitude])

  const weightNum = useMemo(() => toNum(weightStr), [weightStr])
  const volumeNum = useMemo(() => toNum(volumeStr), [volumeStr])
  const priceNum = useMemo(() => toNum(priceStr), [priceStr])

  const step1Valid = useMemo(() => {
    const pickup = new Date(form.pickupDate)
    const delivery = new Date(form.deliveryDate)
    if (Number.isNaN(pickup.getTime()) || Number.isNaN(delivery.getTime())) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return (
      Boolean(
        form.fromCity.trim() &&
          form.fromDistrict.trim() &&
          form.toCity.trim() &&
          form.toDistrict.trim() &&
          fromAddressLine.trim().length >= MIN_ADDRESS_LEN &&
          toAddressLine.trim().length >= MIN_ADDRESS_LEN,
      ) &&
      fromCoords != null &&
      toCoords != null &&
      pickup >= today &&
      delivery >= pickup
    )
  }, [form, fromCoords, toCoords, fromAddressLine, toAddressLine])

  const step2Valid = useMemo(() => {
    if (weightNum == null || weightNum < 1 || weightNum > 40000) return false
    if (volumeStr.trim() !== '' && (volumeNum == null || volumeNum <= 0 || volumeNum > 10000)) return false
    if (!form.description?.trim()) return false
    return true
  }, [weightNum, volumeNum, volumeStr, form.description])

  const previewInputsReady = step1Valid && step2Valid && fromCoords != null && toCoords != null

  const selectedVehicleName = useMemo(
    () => VEHICLES.find((v) => v.value === form.requiredVehicleType)?.name ?? 'Kamyon',
    [form.requiredVehicleType],
  )

  useEffect(() => {
    void getMyAddresses()
      .then((x) => setAddresses(x as unknown as Array<Record<string, unknown>>))
      .catch(() => [])
  }, [])

  useEffect(() => {
    if (step !== 3 || !previewInputsReady || weightNum == null) {
      setPricePreview(null)
      setPricePreviewError('')
      setPricePreviewLoading(false)
      return
    }

    const ac = new AbortController()
    const timer = setTimeout(() => {
      setPricePreviewLoading(true)
      setPricePreviewError('')
      void previewLoadPriceSuggestion(
        {
          originLat: fromCoords!.latitude,
          originLng: fromCoords!.longitude,
          destLat: toCoords!.latitude,
          destLng: toCoords!.longitude,
          fromCity: form.fromCity.trim(),
          toCity: form.toCity.trim(),
          vehicleType: selectedVehicleName,
          weight: weightNum,
          volume: volumeNum != null && volumeNum > 0 ? volumeNum : undefined,
        },
        { signal: ac.signal },
      )
        .then((result) => {
          if (!ac.signal.aborted) setPricePreview(result)
        })
        .catch((e) => {
          if (!ac.signal.aborted) {
            setPricePreview(null)
            setPricePreviewError((e as { uiMessage?: string }).uiMessage ?? 'Önerilen fiyat şu an hesaplanamadı.')
          }
        })
        .finally(() => {
          if (!ac.signal.aborted) setPricePreviewLoading(false)
        })
    }, 600)

    return () => {
      clearTimeout(timer)
      ac.abort()
    }
  }, [
    step,
    previewInputsReady,
    fromCoords,
    toCoords,
    form.fromCity,
    form.toCity,
    selectedVehicleName,
    weightNum,
    volumeNum,
  ])

  function update<K extends keyof CreateLoadRequest>(key: K, value: CreateLoadRequest[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleCreate() {
    setLoading(true)
    setError('')
    try {
      if (fromAddressLine.trim().length < MIN_ADDRESS_LEN || toAddressLine.trim().length < MIN_ADDRESS_LEN) {
        setError(`Çıkış ve varış açık adresleri en az ${MIN_ADDRESS_LEN} karakter olmalıdır (mahalle, sokak, no).`)
        setStep(1)
        return
      }
      if (!step1Valid) {
        setError('Lütfen güzergah, açık adresler ve tarihleri eksiksiz doldurun.')
        setStep(1)
        return
      }
      if (weightNum == null || weightNum < 1 || weightNum > 40000) {
        setError('Ağırlık 1 ile 40.000 kg arasında olmalıdır.')
        setStep(2)
        return
      }
      if (volumeStr.trim() !== '' && (volumeNum == null || volumeNum <= 0 || volumeNum > 10000)) {
        setError('Hacim 0 olamaz; 0,01 ile 10.000 m³ arasında olmalı veya boş bırakılmalıdır.')
        setStep(2)
        return
      }
      if (!form.description?.trim()) {
        setError('Açıklama zorunludur.')
        setStep(2)
        return
      }
      if (priceNum == null || priceNum < 100 || priceNum > 9999999) {
        setError('Liste fiyatı 100 ₺ ile 9.999.999 ₺ arasında olmalıdır.')
        setStep(3)
        return
      }
      if (new Date(form.pickupDate) < new Date(new Date().toDateString())) {
        setError('Geçmiş tarih seçilemez.')
        setStep(1)
        return
      }
      if (new Date(form.deliveryDate) < new Date(form.pickupDate)) {
        setError('Teslim tarihi yükleme tarihinden önce olamaz.')
        setStep(1)
        return
      }

      if (saveAddress && savedAddressName.trim()) {
        await createAddress({
          title: savedAddressName.trim(),
          companyName: 'Teslimat Noktası',
          contactPerson: 'Yetkili',
          contactPhone: '-',
          address: `${toAddressLine.trim()}, ${form.toDistrict}/${form.toCity}`,
          city: form.toCity,
          district: form.toDistrict,
          latitude: form.toLatitude,
          longitude: form.toLongitude,
          isDefault: false,
        })
      }

      // İlçe + açık adres birleştirilir; koordinatlar saf ilçeden zaten çözüldü.
      const payload: CreateLoadRequest = {
        ...form,
        fromDistrict: mergeDistrictAddress(form.fromDistrict, fromAddressLine),
        toDistrict: mergeDistrictAddress(form.toDistrict, toAddressLine),
        weight: weightNum,
        volume: volumeNum != null && volumeNum > 0 ? volumeNum : undefined,
        price: priceNum,
        description: form.description?.trim() ?? '',
      }

      const created = await createLoad(payload)
      try {
        await getLoadPriceSuggestion(created.load.id)
      } catch {
        /* Kayıt sonrası fiyat önerisi isteğe bağlı */
      }
      navigate(`/customer/loads/${created.load.id}`)
    } catch (e: unknown) {
      setError((e as { uiMessage?: string }).uiMessage ?? 'İlan oluşturulamadı.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-wrap">
      <div className="page-head">
        <div>
          <h1 className="page-title">İlan Oluştur</h1>
          <p className="page-sub">3 adımlı ilan oluşturma sihirbazı</p>
        </div>
      </div>
      {error ? <PageError message={error} /> : null}

      <div className="panel-create-shell">
        <aside className="panel-stepper-v" aria-label="Adımlar">
          {[
            { n: 1, title: 'Güzergah & Zaman', sub: 'Konum, adres ve tarihler' },
            { n: 2, title: 'Yük Detayı', sub: 'Araç, ağırlık ve açıklama' },
            { n: 3, title: 'Fiyatlandırma', sub: 'Önerilen ve liste fiyatı' },
          ].map((s) => (
            <div key={s.n} className={`panel-stepper-v-item ${step === s.n ? 'active' : ''} ${step > s.n ? 'done' : ''}`}>
              <span className="panel-stepper-v-num">{step > s.n ? '✓' : s.n}</span>
              <div>
                <div>{s.title}</div>
                <div className="muted" style={{ fontSize: 11, fontWeight: 500, marginTop: 4 }}>
                  {s.sub}
                </div>
              </div>
            </div>
          ))}
        </aside>

        <div>
          {step === 1 ? (
            <div className="card form-grid">
              <label className="form-group" style={{ gridColumn: '1 / -1' }}>
                <span className="form-label">Kayıtlı Teslimat Adresi</span>
                <select
                  className="form-input"
                  onChange={(e) => {
                    const a = addresses.find((x) => String(x.id) === e.target.value)
                    if (!a) return
                    update('toCity', String(a.city ?? ''))
                    update('toDistrict', String(a.district ?? ''))
                  }}
                >
                  <option value="">Adres seçin</option>
                  {addresses.map((a) => (
                    <option key={String(a.id)} value={String(a.id)}>
                      {String(a.title)} - {String(a.city)}/{String(a.district)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="form-group">
                <span className="form-label">Çıkış Şehri</span>
                <input
                  className="form-input"
                  list="city-list"
                  value={form.fromCity}
                  onChange={(e) => {
                    update('fromCity', e.target.value)
                    update('fromDistrict', '')
                  }}
                />
              </label>
              <label className="form-group">
                <span className="form-label">Çıkış İlçesi</span>
                <select
                  className="form-input"
                  value={form.fromDistrict}
                  onChange={(e) => {
                    update('fromDistrict', e.target.value)
                  }}
                >
                  <option value="">İlçe seçin</option>
                  {getDistrictsByCity(form.fromCity).map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-group">
                <span className="form-label">Çıkış Açık Adresi (mahalle, sokak, no)</span>
                <input
                  className="form-input"
                  value={fromAddressLine}
                  onChange={(e) => setFromAddressLine(e.target.value)}
                  placeholder="Örn: Cumhuriyet Mah. Atatürk Cad. No:12"
                  maxLength={80}
                />
              </label>

              <label className="form-group">
                <span className="form-label">Varış Şehri</span>
                <input
                  className="form-input"
                  list="city-list"
                  value={form.toCity}
                  onChange={(e) => {
                    update('toCity', e.target.value)
                    update('toDistrict', '')
                  }}
                />
              </label>
              <label className="form-group">
                <span className="form-label">Varış İlçesi</span>
                <select
                  className="form-input"
                  value={form.toDistrict}
                  onChange={(e) => {
                    update('toDistrict', e.target.value)
                  }}
                >
                  <option value="">İlçe seçin</option>
                  {getDistrictsByCity(form.toCity).map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-group">
                <span className="form-label">Varış Açık Adresi (mahalle, sokak, no)</span>
                <input
                  className="form-input"
                  value={toAddressLine}
                  onChange={(e) => setToAddressLine(e.target.value)}
                  placeholder="Örn: Barbaros Mah. 1. Sok. No:5 Daire 3"
                  maxLength={80}
                />
              </label>

              <label className="form-group">
                <span className="form-label">Alım Tarihi</span>
                <TurkishDateTimePicker
                  value={form.pickupDate}
                  onChange={(iso) => update('pickupDate', iso)}
                  onClear={() => update('pickupDate', new Date().toISOString())}
                />
              </label>
              <label className="form-group">
                <span className="form-label">Teslim Tarihi</span>
                <TurkishDateTimePicker
                  value={form.deliveryDate}
                  onChange={(iso) => update('deliveryDate', iso)}
                  onClear={() => update('deliveryDate', new Date().toISOString())}
                />
              </label>

              <label className="form-group" style={{ gridColumn: '1 / -1' }}>
                <span className="item-row">
                  <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} />
                  <span className="form-label">Bu adresi kaydet</span>
                </span>
              </label>
              {saveAddress ? (
                <label className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <span className="form-label">Adres adı</span>
                  <input
                    className="form-input"
                    value={savedAddressName}
                    onChange={(e) => setSavedAddressName(e.target.value)}
                    placeholder="Örn: Merkez depo 1"
                  />
                </label>
              ) : null}

              <div className="panel-map-placeholder" style={{ gridColumn: '1 / -1' }}>
                Harita önizlemesi — kayıtlı / seçilen konumlar
              </div>
              <datalist id="city-list">
                {TR_CITIES.map((city) => (
                  <option key={city} value={city} />
                ))}
              </datalist>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="card form-grid">
              <label className="form-group">
                <span className="form-label">Araç Tipi</span>
                <select
                  className="form-input"
                  value={form.requiredVehicleType}
                  onChange={(e) => update('requiredVehicleType', Number(e.target.value) as VehicleTypeValue)}
                >
                  {VEHICLES.map((v) => (
                    <option key={v.value} value={v.value}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-group">
                <span className="form-label">Yük Türü</span>
                <select
                  className="form-input"
                  value={form.loadType}
                  onChange={(e) => update('loadType', Number(e.target.value) as LoadTypeValue)}
                >
                  {LOAD_TYPES.map((v) => (
                    <option key={v.value} value={v.value}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-group">
                <span className="form-label">Ağırlık (kg)</span>
                <input
                  className="form-input"
                  type="text"
                  inputMode="decimal"
                  value={weightStr}
                  onChange={(e) => setWeightStr(sanitizeNumericInput(e.target.value))}
                  placeholder="Örn: 12000"
                />
              </label>
              <label className="form-group">
                <span className="form-label">Hacim (m³) — opsiyonel</span>
                <input
                  className="form-input"
                  type="text"
                  inputMode="decimal"
                  value={volumeStr}
                  onChange={(e) => setVolumeStr(sanitizeNumericInput(e.target.value))}
                  placeholder="Örn: 20"
                />
              </label>
              <label className="form-group" style={{ gridColumn: '1 / -1' }}>
                <span className="form-label">Açıklama</span>
                <textarea
                  className="form-input"
                  value={form.description}
                  onChange={(e) => update('description', e.target.value)}
                  placeholder="Yük hakkında kısa açıklama (zorunlu)"
                  maxLength={500}
                />
              </label>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="card form-grid">
              <div className="panel-ai-price-card" style={{ gridColumn: '1 / -1' }}>
                <h4>Önerilen fiyat</h4>
                {pricePreviewLoading ? (
                  <p className="muted" style={{ fontSize: 13, margin: '8px 0 0' }}>
                    Öneri hesaplanıyor…
                  </p>
                ) : pricePreview && pricePreview.recommendedPrice > 0 ? (
                  <>
                    <p style={{ fontSize: 28, fontWeight: 800, margin: '8px 0 4px', color: 'var(--color-brand)' }}>
                      {formatCurrencyTRY(pricePreview.recommendedPrice)}
                    </p>
                    <p className="muted" style={{ fontSize: 13, lineHeight: 1.5 }}>
                      Önerilen fiyat aralığı: {formatCurrencyTRY(pricePreview.minPrice)} –{' '}
                      {formatCurrencyTRY(pricePreview.maxPrice)}
                    </p>
                    {pricePreview.distanceKm > 0 ? (
                      <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                        Mesafe: {pricePreview.distanceKm.toFixed(1)} km
                      </p>
                    ) : null}
                  </>
                ) : (
                  <p className="muted" style={{ fontSize: 13, lineHeight: 1.5, marginTop: 8 }}>
                    {pricePreviewError ||
                      (previewInputsReady
                        ? 'Önerilen fiyat şu an hesaplanamadı. Liste fiyatınızı girebilir veya kayıt sonrası tekrar deneyebilirsiniz.'
                        : 'Güzergah ve yük bilgilerini tamamladığınızda önerilen fiyat burada görünür.')}
                  </p>
                )}
              </div>
              <label className="form-group">
                <span className="form-label">Liste fiyatı (₺)</span>
                <input
                  className="form-input"
                  type="text"
                  inputMode="decimal"
                  value={priceStr}
                  onChange={(e) => setPriceStr(sanitizeNumericInput(e.target.value))}
                  placeholder="Örn: 18000"
                />
              </label>
              <label className="form-group">
                <span className="form-label">Para Birimi</span>
                <input className="form-input" value="₺ (TRY)" readOnly />
              </label>
              <div className="muted" style={{ gridColumn: '1 / -1' }}>
                Liste fiyatı önizlemesi: {priceNum != null ? formatCurrency(priceNum) : '—'}
              </div>
            </div>
          ) : null}

          <div className="item-row" style={{ marginTop: 16 }}>
            <button className="btn btn-ghost" disabled={step === 1 || loading} onClick={() => setStep((s) => s - 1)}>
              Geri
            </button>
            {step < 3 ? (
              <button
                className="btn btn-primary"
                disabled={(step === 1 && !step1Valid) || (step === 2 && !step2Valid)}
                onClick={() => setStep((s) => s + 1)}
              >
                İleri
              </button>
            ) : (
              <button className="btn btn-primary" disabled={loading} onClick={handleCreate}>
                {loading ? 'Kaydediliyor...' : 'İlanı Kaydet'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
