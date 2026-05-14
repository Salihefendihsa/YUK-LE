import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createLoad } from '../../api/loads'
import { getLoadPriceSuggestion } from '../../api/matching'
import { createAddress, getMyAddresses } from '../../api/addresses'
import type { CreateLoadRequest, VehicleType, LoadType } from '../../api/types'
import TurkishDateTimePicker from '../../components/common/TurkishDateTimePicker'
import { PageError } from '../../components/common/PageStates'
import { TR_CITIES, getDistrictsByCity, getNeighborhoodsByDistrict } from '../../data/tr-location'
import { formatCurrency } from '../../utils/validators'
import '../shared/Page.css'

const VEHICLES: VehicleType[] = ['Tir', 'Kamyon', 'Frigorifik', 'Lowboy', 'Tanker']
const LOAD_TYPES: LoadType[] = ['General', 'Paletli', 'Dokme', 'SogukZincir', 'TehlikeliMadde', 'Parsiyel']

export default function CustomerLoadCreatePage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [addresses, setAddresses] = useState<Array<Record<string, unknown>>>([])
  const [fromNeighborhood, setFromNeighborhood] = useState('')
  const [toNeighborhood, setToNeighborhood] = useState('')
  const [saveAddress, setSaveAddress] = useState(false)
  const [savedAddressName, setSavedAddressName] = useState('')

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
    requiredVehicleType: 'Tir',
    loadType: 'General',
    weight: 10000,
    volume: 20,
    price: 10000,
    currency: 'TRY',
    description: '',
  })

  useEffect(() => {
    void getMyAddresses().then((x) => setAddresses(x as unknown as Array<Record<string, unknown>>)).catch(() => [])
  }, [])

  function update<K extends keyof CreateLoadRequest>(key: K, value: CreateLoadRequest[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleCreate() {
    setLoading(true)
    setError('')
    try {
      if (form.weight < 1 || form.weight > 40000) {
        setError('Ağırlık 1 ile 40.000 kg arasında olmalıdır')
        return
      }
      if (form.price < 100 || form.price > 9999999) {
        setError('Fiyat 100 ₺ ile 9.999.999 ₺ arasında olmalıdır')
        return
      }
      if (new Date(form.pickupDate) < new Date(new Date().toDateString())) {
        setError('Geçmiş tarih seçilemez')
        return
      }
      if (new Date(form.deliveryDate) < new Date(form.pickupDate)) {
        setError('Teslim tarihi yükleme tarihinden önce olamaz')
        return
      }
      if (saveAddress && savedAddressName.trim()) {
        await createAddress({
          title: savedAddressName.trim(),
          companyName: 'Teslimat Noktası',
          contactPerson: 'Yetkili',
          contactPhone: '-',
          address: `${toNeighborhood || 'Merkez Mahallesi'}, ${form.toDistrict}/${form.toCity}`,
          city: form.toCity,
          district: form.toDistrict,
          latitude: form.toLatitude,
          longitude: form.toLongitude,
          isDefault: false,
        })
      }
      const created = await createLoad(form)
      try {
        await getLoadPriceSuggestion(created.load.id)
      } catch {
        /* AI önerisi isteğe bağlı */
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
            { n: 1, title: 'Güzergah & zaman', sub: 'Konum ve tarihler' },
            { n: 2, title: 'Yük detayı', sub: 'Araç ve ağırlık' },
            { n: 3, title: 'Fiyatlandırma', sub: 'AI önerisi (kayıt sonrası)' },
          ].map((s) => (
            <div
              key={s.n}
              className={`panel-stepper-v-item ${step === s.n ? 'active' : ''} ${step > s.n ? 'done' : ''}`}
            >
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
          {step === 3 ? (
            <div className="panel-ai-price-card">
              <h4>AI ÖNERİLEN FİYAT ARALIĞI</h4>
              <p className="muted" style={{ fontSize: 13, lineHeight: 1.5 }}>
                İlan kaydedildikten sonra sistem, güzergah ve yük profiline göre otomatik fiyat önerisi üretir. Şu an
                girdiğiniz tutar: <strong>{formatCurrency(form.price)}</strong>
              </p>
            </div>
          ) : null}

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
                    setFromNeighborhood('')
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
                    setFromNeighborhood('')
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
                <span className="form-label">Çıkış Mahallesi</span>
                <select className="form-input" value={fromNeighborhood} onChange={(e) => setFromNeighborhood(e.target.value)}>
                  <option value="">Mahalle seçin</option>
                  {getNeighborhoodsByDistrict(form.fromDistrict).map((hood) => (
                    <option key={hood} value={hood}>
                      {hood}
                    </option>
                  ))}
                </select>
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
                    setToNeighborhood('')
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
                    setToNeighborhood('')
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
                <span className="form-label">Varış Mahallesi</span>
                <select className="form-input" value={toNeighborhood} onChange={(e) => setToNeighborhood(e.target.value)}>
                  <option value="">Mahalle seçin</option>
                  {getNeighborhoodsByDistrict(form.toDistrict).map((hood) => (
                    <option key={hood} value={hood}>
                      {hood}
                    </option>
                  ))}
                </select>
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
                    placeholder="Örn: Fabrika Depo 1"
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
                <select className="form-input" value={form.requiredVehicleType} onChange={(e) => update('requiredVehicleType', e.target.value as VehicleType)}>
                  {VEHICLES.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-group">
                <span className="form-label">Yük Turu</span>
                <select className="form-input" value={form.loadType} onChange={(e) => update('loadType', e.target.value as LoadType)}>
                  {LOAD_TYPES.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-group">
                <span className="form-label">Ağırlık (kg)</span>
                <input className="form-input" type="number" min={1} max={40000} value={form.weight} onChange={(e) => update('weight', Number(e.target.value))} />
              </label>
              <label className="form-group">
                <span className="form-label">Hacim (m3)</span>
                <input className="form-input" type="number" value={form.volume} onChange={(e) => update('volume', Number(e.target.value))} />
              </label>
              <label className="form-group" style={{ gridColumn: '1 / -1' }}>
                <span className="form-label">Açıklama</span>
                <textarea className="form-input" value={form.description} onChange={(e) => update('description', e.target.value)} />
              </label>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="card form-grid">
              <label className="form-group">
                <span className="form-label">Fiyat</span>
                <input className="form-input" type="number" min={100} max={9999999} value={form.price} onChange={(e) => update('price', Number(e.target.value))} />
              </label>
              <label className="form-group">
                <span className="form-label">Para Birimi</span>
                <input className="form-input" value="₺ (TRY)" readOnly />
              </label>
              <div className="muted" style={{ gridColumn: '1 / -1' }}>
                Önizleme: {formatCurrency(form.price)}. Kayıt sonrası otomatik AI fiyat önerisi istenir.
              </div>
            </div>
          ) : null}

          <div className="item-row" style={{ marginTop: 16 }}>
            <button className="btn btn-ghost" disabled={step === 1 || loading} onClick={() => setStep((s) => s - 1)}>
              Geri
            </button>
            {step < 3 ? (
              <button className="btn btn-primary" onClick={() => setStep((s) => s + 1)}>
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
