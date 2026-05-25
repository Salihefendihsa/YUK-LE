import { useEffect, useMemo, useState } from 'react'

import { useNavigate } from 'react-router-dom'

import { previewLoadPriceSuggestion, type PriceSuggestionPreview } from '../../api/ai'

import { createLoad } from '../../api/loads'

import { getLoadPriceSuggestion } from '../../api/matching'

import { createAddress, getMyAddresses } from '../../api/addresses'

import type { CreateLoadRequest, VehicleType, LoadType } from '../../api/types'

import TurkishDateTimePicker from '../../components/common/TurkishDateTimePicker'

import { PageError } from '../../components/common/PageStates'

import { TR_CITIES, getDistrictsByCity, getNeighborhoodsByDistrict, resolveCoordinates } from '../../data/tr-location'

import { formatCurrencyTRY } from '../../utils/format'

import { formatCurrency } from '../../utils/validators'

import '../shared/Page.css'



const VEHICLES: VehicleType[] = ['Tir', 'Kamyon', 'Frigorifik', 'Lowboy', 'Tanker']

const LOAD_TYPES: LoadType[] = ['General', 'Paletli', 'Dokme', 'SogukZincir', 'TehlikeliMadde', 'Parsiyel']



const LOAD_TYPE_LABELS: Record<LoadType, string> = {

  General: 'Genel',

  Paletli: 'Paletli',

  Dokme: 'Dökme',

  SogukZincir: 'Soğuk Zincir',

  TehlikeliMadde: 'Tehlikeli Madde',

  Parsiyel: 'Parsiyel',

}



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

    requiredVehicleType: 'Tir',

    loadType: 'General',

    weight: 10000,

    volume: 20,

    price: 10000,

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

    setForm((prev) => ({

      ...prev,

      fromLatitude: fromCoords.latitude,

      fromLongitude: fromCoords.longitude,

    }))

  }, [fromCoords?.latitude, fromCoords?.longitude])



  useEffect(() => {

    if (!toCoords) return

    setForm((prev) => ({

      ...prev,

      toLatitude: toCoords.latitude,

      toLongitude: toCoords.longitude,

    }))

  }, [toCoords?.latitude, toCoords?.longitude])



  const step1Valid = useMemo(() => {

    const pickup = new Date(form.pickupDate)

    const delivery = new Date(form.deliveryDate)

    if (Number.isNaN(pickup.getTime()) || Number.isNaN(delivery.getTime())) return false

    const today = new Date()

    today.setHours(0, 0, 0, 0)

    return (

      Boolean(form.fromCity.trim() && form.fromDistrict.trim() && form.toCity.trim() && form.toDistrict.trim()) &&

      fromCoords != null &&

      toCoords != null &&

      pickup >= today &&

      delivery >= pickup

    )

  }, [form, fromCoords, toCoords])



  const step2Valid = useMemo(() => form.weight >= 1 && form.weight <= 40000, [form.weight])



  const previewInputsReady = step1Valid && step2Valid && fromCoords != null && toCoords != null



  useEffect(() => {

    void getMyAddresses().then((x) => setAddresses(x as unknown as Array<Record<string, unknown>>)).catch(() => [])

  }, [])



  useEffect(() => {

    if (step !== 3 || !previewInputsReady) {

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

          vehicleType: form.requiredVehicleType,

          weight: form.weight,

          volume: (form.volume ?? 0) > 0 ? form.volume : undefined,

        },

        { signal: ac.signal }

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

    form.requiredVehicleType,

    form.weight,

    form.volume,

  ])



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

            { n: 1, title: 'Güzergah & zaman', sub: 'Konum ve tarihler' },

            { n: 2, title: 'Yük detayı', sub: 'Araç ve ağırlık' },

            { n: 3, title: 'Fiyatlandırma', sub: 'Önerilen fiyat ve liste fiyatı' },

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

                      {LOAD_TYPE_LABELS[v]}

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

                <span className="form-label">Liste fiyatı</span>

                <input className="form-input" type="number" min={100} max={9999999} value={form.price} onChange={(e) => update('price', Number(e.target.value))} />

              </label>

              <label className="form-group">

                <span className="form-label">Para Birimi</span>

                <input className="form-input" value="₺ (TRY)" readOnly />

              </label>

              <div className="muted" style={{ gridColumn: '1 / -1' }}>

                Liste fiyatı önizlemesi: {formatCurrency(form.price)}

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


