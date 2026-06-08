import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { createDriverListing, type CreateDriverListingRequest } from '../../api/driverListings'
import TurkishDateTimePicker from '../../components/common/TurkishDateTimePicker'
import { PageError } from '../../components/common/PageStates'
import { toast } from '../../components/common/Toast'
import MapPicker from '../../components/map/MapPicker'
import { TR_CITIES, getDistrictsByCity, resolveCoordinates } from '../../data/tr-location'
import '../shared/Page.css'

// Backend VehicleType enum index'leriyle birebir hizalı (Yukle.Api/Models/Enums.cs).
const VEHICLES: { value: number; label: string }[] = [
  { value: 0, label: 'TIR' },
  { value: 1, label: 'Kamyon' },
  { value: 2, label: 'Kamyonet' },
  { value: 3, label: 'Panelvan' },
  { value: 4, label: 'Frigorifik' },
  { value: 5, label: 'Tenteli' },
  { value: 6, label: 'Açık Kasa (Platform)' },
  { value: 7, label: 'Lowboy' },
  { value: 8, label: 'Tanker' },
  { value: 9, label: 'Damperli' },
  { value: 10, label: 'Konteyner Taşıyıcı' },
  { value: 11, label: 'Silobas' },
]

type FormState = {
  originCity: string
  originDistrict: string
  originLatitude: number
  originLongitude: number
  destinationCity: string
  destinationDistrict: string
  destinationLatitude: number
  destinationLongitude: number
  availableFrom: string
  vehicleType: number
  capacityNote: string
  notes: string
}

export default function DriverListingCreatePage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState<FormState>({
    originCity: '',
    originDistrict: '',
    originLatitude: 39.9208,
    originLongitude: 32.8541,
    destinationCity: '',
    destinationDistrict: '',
    destinationLatitude: 41.0082,
    destinationLongitude: 28.9784,
    availableFrom: new Date().toISOString(),
    vehicleType: 1,
    capacityNote: '',
    notes: '',
  })

  // Saf şehir merkezi (fallback + harita ortalama hedefi).
  const fromCenter = useMemo(
    () =>
      form.originCity.trim() && form.originDistrict.trim()
        ? resolveCoordinates(form.originCity, form.originDistrict)
        : null,
    [form.originCity, form.originDistrict],
  )
  const toCenter = useMemo(
    () =>
      form.destinationCity.trim() && form.destinationDistrict.trim()
        ? resolveCoordinates(form.destinationCity, form.destinationDistrict)
        : null,
    [form.destinationCity, form.destinationDistrict],
  )

  // Şehir/ilçe değişince koordinatı merkeze çek (pin de oraya gider — LoadCreate deseni).
  useEffect(() => {
    if (!fromCenter) return
    setForm((p) => ({ ...p, originLatitude: fromCenter.latitude, originLongitude: fromCenter.longitude }))
  }, [fromCenter?.latitude, fromCenter?.longitude])

  useEffect(() => {
    if (!toCenter) return
    setForm((p) => ({ ...p, destinationLatitude: toCenter.latitude, destinationLongitude: toCenter.longitude }))
  }, [toCenter?.latitude, toCenter?.longitude])

  const valid =
    form.originCity.trim() !== '' &&
    form.originDistrict.trim() !== '' &&
    form.destinationCity.trim() !== '' &&
    form.destinationDistrict.trim() !== '' &&
    form.availableFrom.trim() !== ''

  async function handleSubmit() {
    if (!valid) {
      setError('Lütfen kalkış/varış şehir-ilçe ve müsaitlik tarihini doldurun.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const payload: CreateDriverListingRequest = {
        originCity: form.originCity.trim(),
        originDistrict: form.originDistrict.trim(),
        originLatitude: form.originLatitude,
        originLongitude: form.originLongitude,
        destinationCity: form.destinationCity.trim(),
        destinationDistrict: form.destinationDistrict.trim(),
        destinationLatitude: form.destinationLatitude,
        destinationLongitude: form.destinationLongitude,
        availableFrom: form.availableFrom,
        vehicleType: form.vehicleType,
        capacityNote: form.capacityNote.trim() || undefined,
        notes: form.notes.trim() || undefined,
      }
      await createDriverListing(payload)
      toast.success('Boş araç ilanınız yayınlandı.')
      navigate('/driver/listings')
    } catch (e) {
      setError((e as { uiMessage?: string }).uiMessage ?? 'İlan oluşturulamadı.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-wrap">
      <div className="page-head">
        <div>
          <h1 className="page-title">Boş Araç İlanı Ver</h1>
          <p className="page-sub">Güzergâhınızı, müsaitliğinizi ve aracınızı yayınlayın</p>
        </div>
      </div>
      {error ? <PageError message={error} /> : null}

      <div className="card form-grid">
        <label className="form-group">
          <span className="form-label">Kalkış Şehri</span>
          <input
            className="form-input"
            list="dl-city-list"
            value={form.originCity}
            onChange={(e) => setForm((p) => ({ ...p, originCity: e.target.value, originDistrict: '' }))}
          />
        </label>
        <label className="form-group">
          <span className="form-label">Kalkış İlçesi</span>
          <select
            className="form-input"
            value={form.originDistrict}
            onChange={(e) => setForm((p) => ({ ...p, originDistrict: e.target.value }))}
          >
            <option value="">İlçe seçin</option>
            {getDistrictsByCity(form.originCity).map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>

        <label className="form-group">
          <span className="form-label">Varış Şehri</span>
          <input
            className="form-input"
            list="dl-city-list"
            value={form.destinationCity}
            onChange={(e) =>
              setForm((p) => ({ ...p, destinationCity: e.target.value, destinationDistrict: '' }))
            }
          />
        </label>
        <label className="form-group">
          <span className="form-label">Varış İlçesi</span>
          <select
            className="form-input"
            value={form.destinationDistrict}
            onChange={(e) => setForm((p) => ({ ...p, destinationDistrict: e.target.value }))}
          >
            <option value="">İlçe seçin</option>
            {getDistrictsByCity(form.destinationCity).map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>

        <label className="form-group">
          <span className="form-label">Müsaitlik tarihi</span>
          <TurkishDateTimePicker
            value={form.availableFrom}
            onChange={(iso) => setForm((p) => ({ ...p, availableFrom: iso }))}
            onClear={() => setForm((p) => ({ ...p, availableFrom: new Date().toISOString() }))}
          />
        </label>
        <label className="form-group">
          <span className="form-label">Araç Tipi</span>
          <select
            className="form-input"
            value={form.vehicleType}
            onChange={(e) => setForm((p) => ({ ...p, vehicleType: Number(e.target.value) }))}
          >
            {VEHICLES.map((v) => (
              <option key={v.value} value={v.value}>
                {v.label}
              </option>
            ))}
          </select>
        </label>

        <label className="form-group">
          <span className="form-label">Kapasite notu (opsiyonel)</span>
          <input
            className="form-input"
            value={form.capacityNote}
            onChange={(e) => setForm((p) => ({ ...p, capacityNote: e.target.value }))}
            placeholder="Örn: 10 ton / 20 m³ boş"
            maxLength={200}
          />
        </label>
        <label className="form-group">
          <span className="form-label">Not (opsiyonel)</span>
          <input
            className="form-input"
            value={form.notes}
            onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
            placeholder="Eklemek istedikleriniz"
            maxLength={1000}
          />
        </label>

        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <span className="form-label">Haritadan tam konum seçin</span>
          <p className="muted" style={{ fontSize: 12, margin: '0 0 8px' }}>
            Şehir/ilçe seçtiğinizde harita oraya ortalanır. Pin'e tıklayarak veya sürükleyerek tam
            kalkış ve varış noktasını işaretleyin. İşaretlemezseniz şehir merkezi kullanılır.
          </p>
          <div className="map-picker-grid">
            <div>
              <span className="form-label" style={{ display: 'block', marginBottom: 6 }}>
                Kalkış noktası
              </span>
              <MapPicker
                kind="origin"
                ariaLabel="Kalkış noktası seçici"
                value={{ latitude: form.originLatitude, longitude: form.originLongitude }}
                center={fromCenter ?? { latitude: form.originLatitude, longitude: form.originLongitude }}
                onChange={(c) =>
                  setForm((p) => ({ ...p, originLatitude: c.latitude, originLongitude: c.longitude }))
                }
              />
            </div>
            <div>
              <span className="form-label" style={{ display: 'block', marginBottom: 6 }}>
                Varış noktası
              </span>
              <MapPicker
                kind="destination"
                ariaLabel="Varış noktası seçici"
                value={{ latitude: form.destinationLatitude, longitude: form.destinationLongitude }}
                center={toCenter ?? { latitude: form.destinationLatitude, longitude: form.destinationLongitude }}
                onChange={(c) =>
                  setForm((p) => ({ ...p, destinationLatitude: c.latitude, destinationLongitude: c.longitude }))
                }
              />
            </div>
          </div>
        </div>

        <datalist id="dl-city-list">
          {TR_CITIES.map((city) => (
            <option key={city} value={city} />
          ))}
        </datalist>
      </div>

      <div className="item-row" style={{ marginTop: 16 }}>
        <button className="btn btn-ghost" disabled={loading} onClick={() => navigate('/driver/listings')}>
          Vazgeç
        </button>
        <button className="btn btn-primary" disabled={!valid || loading} onClick={handleSubmit}>
          {loading ? 'Yayınlanıyor...' : 'İlanı Yayınla'}
        </button>
      </div>
    </div>
  )
}
