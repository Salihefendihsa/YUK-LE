import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getLoads } from '../../api/loads'
import type { Load } from '../../api/types'
import { PageEmpty, PageError, PageSkeleton } from '../../components/common/PageStates'
import TurkishDateTimePicker from '../../components/common/TurkishDateTimePicker'
import '../shared/Page.css'

export default function DriverLoadsPage() {
  const [loads, setLoads] = useState<Load[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [city, setCity] = useState('')
  const [vehicle, setVehicle] = useState('')
  const [date, setDate] = useState('')

  useEffect(() => {
    getLoads()
      .then((data) => {
        setLoads(Array.isArray(data) ? data : [])
      })
      .catch((e: { uiMessage?: string }) => {
        setError(e.uiMessage ?? 'Yük panosu yüklenemedi.')
        setLoads([])
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(
    () =>
      (Array.isArray(loads) ? loads : []).filter((l) => {
        const cityOk = !city || l.fromCity.toLowerCase().includes(city.toLowerCase()) || l.toCity.toLowerCase().includes(city.toLowerCase())
        const vehicleOk = !vehicle || (l.requiredVehicleType ?? '').toLowerCase().includes(vehicle.toLowerCase())
        const dateOk = !date || new Date(l.pickupDate).toDateString() === new Date(date).toDateString()
        return cityOk && vehicleOk && dateOk
      }),
    [loads, city, vehicle, date]
  )

  if (loading) return <PageSkeleton rows={7} variant="card" />

  return (
    <div className="page-wrap">
      <div>
        <h1 className="page-title">Yük Panosu</h1>
          <p className="page-sub">Aktif yükleri filtreleyip inceleyin</p>
      </div>
      {error ? <PageError message={error} /> : null}
      <div className="card filters">
        <input className="form-input" placeholder="Şehir" value={city} onChange={(e) => setCity(e.target.value)} />
        <input className="form-input" placeholder="Araç tipi" value={vehicle} onChange={(e) => setVehicle(e.target.value)} />
        <TurkishDateTimePicker value={date || undefined} onChange={(iso) => setDate(iso)} onClear={() => setDate('')} />
        <button className="btn btn-ghost" onClick={() => { setCity(''); setVehicle(''); setDate('') }}>
          Filtreleri Temizle
        </button>
      </div>
      <div className="list-grid">
        {filtered.map((load) => (
          <Link key={load.id} to={`/driver/loads/${load.id}`} className="item-card">
            <div className="item-row">
              <strong>
                {load.fromCity} → {load.toCity}
              </strong>
              <span>₺{load.price.toLocaleString('tr-TR')}</span>
            </div>
            <div className="item-row" style={{ marginTop: 8 }}>
              <span className="muted">{load.requiredVehicleType ?? '-'}</span>
              <span className="badge badge-info">{load.status}</span>
            </div>
          </Link>
        ))}
        {filtered.length === 0 ? (
          <PageEmpty
            icon="🔎"
            title="Uygun yük bulunamadı"
            description="Filtreleri temizleyip tekrar deneyin."
            actionLabel="Filtreleri Temizle"
            onAction={() => { setCity(''); setVehicle(''); setDate('') }}
          />
        ) : null}
      </div>
    </div>
  )
}
