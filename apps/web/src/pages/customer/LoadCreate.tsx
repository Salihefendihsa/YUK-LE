import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createLoad } from '../../api/loads'
import { getLoadPriceSuggestion } from '../../api/matching'
import type { CreateLoadRequest, VehicleType, LoadType } from '../../api/types'
import { PageError } from '../../components/common/PageStates'
import '../shared/Page.css'

const VEHICLES: VehicleType[] = ['Tir', 'Kamyon', 'Frigorifik', 'Lowboy', 'Tanker']
const LOAD_TYPES: LoadType[] = ['General', 'Paletli', 'Dokme', 'SogukZincir', 'TehlikeliMadde', 'Parsiyel']

export default function CustomerLoadCreatePage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [aiText, setAiText] = useState('')

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

  function update<K extends keyof CreateLoadRequest>(key: K, value: CreateLoadRequest[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleCreate() {
    setLoading(true)
    setError('')
    try {
      const created = await createLoad(form)
      try {
        const ai = await getLoadPriceSuggestion(created.load.id)
        setAiText(ai?.suggestion?.reasoning ?? '')
      } catch {
        setAiText('AI fiyat onerisi su an alinamadi.')
      }
      navigate(`/customer/loads/${created.load.id}`)
    } catch (e: unknown) {
      setError((e as { uiMessage?: string }).uiMessage ?? 'Ilan olusturulamadi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-wrap">
      <div>
        <h1 className="page-title">Ilan Olustur</h1>
        <p className="page-sub">3 adimli ilan olusturma sihirbazi</p>
      </div>
      {error ? <PageError message={error} /> : null}
      {aiText ? <div className="card muted">AI: {aiText}</div> : null}

      {step === 1 ? (
        <div className="card form-grid">
          <label className="form-group">
            <span className="form-label">Cikis Sehri</span>
            <input className="form-input" value={form.fromCity} onChange={(e) => update('fromCity', e.target.value)} />
          </label>
          <label className="form-group">
            <span className="form-label">Cikis Ilcesi</span>
            <input className="form-input" value={form.fromDistrict} onChange={(e) => update('fromDistrict', e.target.value)} />
          </label>
          <label className="form-group">
            <span className="form-label">Varis Sehri</span>
            <input className="form-input" value={form.toCity} onChange={(e) => update('toCity', e.target.value)} />
          </label>
          <label className="form-group">
            <span className="form-label">Varis Ilcesi</span>
            <input className="form-input" value={form.toDistrict} onChange={(e) => update('toDistrict', e.target.value)} />
          </label>
          <label className="form-group">
            <span className="form-label">Alim Tarihi</span>
            <input className="form-input" type="datetime-local" onChange={(e) => update('pickupDate', new Date(e.target.value).toISOString())} />
          </label>
          <label className="form-group">
            <span className="form-label">Teslim Tarihi</span>
            <input className="form-input" type="datetime-local" onChange={(e) => update('deliveryDate', new Date(e.target.value).toISOString())} />
          </label>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="card form-grid">
          <label className="form-group">
            <span className="form-label">Arac Tipi</span>
            <select className="form-input" value={form.requiredVehicleType} onChange={(e) => update('requiredVehicleType', e.target.value as VehicleType)}>
              {VEHICLES.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label className="form-group">
            <span className="form-label">Yuk Turu</span>
            <select className="form-input" value={form.loadType} onChange={(e) => update('loadType', e.target.value as LoadType)}>
              {LOAD_TYPES.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label className="form-group">
            <span className="form-label">Agirlik (kg)</span>
            <input className="form-input" type="number" value={form.weight} onChange={(e) => update('weight', Number(e.target.value))} />
          </label>
          <label className="form-group">
            <span className="form-label">Hacim (m3)</span>
            <input className="form-input" type="number" value={form.volume} onChange={(e) => update('volume', Number(e.target.value))} />
          </label>
          <label className="form-group" style={{ gridColumn: '1 / -1' }}>
            <span className="form-label">Aciklama</span>
            <textarea className="form-input" value={form.description} onChange={(e) => update('description', e.target.value)} />
          </label>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="card form-grid">
          <label className="form-group">
            <span className="form-label">Fiyat</span>
            <input className="form-input" type="number" value={form.price} onChange={(e) => update('price', Number(e.target.value))} />
          </label>
          <label className="form-group">
            <span className="form-label">Para Birimi</span>
            <input className="form-input" value={form.currency} onChange={(e) => update('currency', e.target.value)} />
          </label>
          <div className="muted" style={{ gridColumn: '1 / -1' }}>
            Kayit sonrasi otomatik AI fiyat onerisi istenir.
          </div>
        </div>
      ) : null}

      <div className="item-row">
        <button className="btn btn-ghost" disabled={step === 1 || loading} onClick={() => setStep((s) => s - 1)}>
          Geri
        </button>
        {step < 3 ? (
          <button className="btn btn-primary" onClick={() => setStep((s) => s + 1)}>
            Ileri
          </button>
        ) : (
          <button className="btn btn-primary" disabled={loading} onClick={handleCreate}>
            {loading ? 'Kaydediliyor...' : 'Ilani Kaydet'}
          </button>
        )}
      </div>
    </div>
  )
}
