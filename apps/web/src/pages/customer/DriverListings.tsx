import { useCallback, useEffect, useState } from 'react'

import { getDriverListings, type DriverListing } from '../../api/driverListings'
import { PageEmpty, PageError, PageSkeleton } from '../../components/common/PageStates'
import { TR_CITIES } from '../../data/tr-location'
import '../shared/Page.css'

function formatDate(iso: string): string {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '-' : d.toLocaleDateString('tr-TR')
}

export default function CustomerDriverListingsPage() {
  const [listings, setListings] = useState<DriverListing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [fromCity, setFromCity] = useState('')
  const [toCity, setToCity] = useState('')
  const [selected, setSelected] = useState<DriverListing | null>(null)

  const load = useCallback(async (filters?: { fromCity?: string; toCity?: string }) => {
    setError('')
    const data = await getDriverListings(filters)
    setListings(Array.isArray(data) ? data : [])
  }, [])

  useEffect(() => {
    load()
      .catch((e: { uiMessage?: string }) => setError(e.uiMessage ?? 'Boş araç ilanları yüklenemedi.'))
      .finally(() => setLoading(false))
  }, [load])

  const applyFilter = () => {
    setLoading(true)
    void load({ fromCity, toCity })
      .catch((e: { uiMessage?: string }) => setError(e.uiMessage ?? 'Boş araç ilanları yüklenemedi.'))
      .finally(() => setLoading(false))
  }

  const clearFilter = () => {
    setFromCity('')
    setToCity('')
    setLoading(true)
    void load()
      .catch((e: { uiMessage?: string }) => setError(e.uiMessage ?? 'Boş araç ilanları yüklenemedi.'))
      .finally(() => setLoading(false))
  }

  return (
    <div className="page-wrap">
      <div className="page-head">
        <div>
          <h1 className="page-title">Boş Araçlar</h1>
          <p className="page-sub">Yayında olan şoför boş araç ilanlarını inceleyin</p>
        </div>
      </div>

      {error ? <PageError message={error} onRetry={applyFilter} /> : null}

      <div className="card filters panel-table-card">
        <input
          className="form-input"
          list="dl-customer-city-list"
          placeholder="Kalkış şehri"
          value={fromCity}
          onChange={(e) => setFromCity(e.target.value)}
        />
        <input
          className="form-input"
          list="dl-customer-city-list"
          placeholder="Varış şehri"
          value={toCity}
          onChange={(e) => setToCity(e.target.value)}
        />
        <button className="btn btn-primary" onClick={applyFilter}>
          Filtrele
        </button>
        <button className="btn btn-ghost" onClick={clearFilter}>
          Filtreleri Temizle
        </button>
        <datalist id="dl-customer-city-list">
          {TR_CITIES.map((city) => (
            <option key={city} value={city} />
          ))}
        </datalist>
      </div>

      {loading ? (
        <PageSkeleton rows={6} variant="card" />
      ) : (
        <div className="loads-grid-responsive">
          {listings.map((l) => (
            <button key={l.id} type="button" className="item-card" onClick={() => setSelected(l)}>
              <div className="item-row">
                <strong>
                  {l.originCity} → {l.destinationCity}
                </strong>
                <span className="badge badge-info">{l.vehicleType}</span>
              </div>
              <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                {l.originDistrict} / {l.destinationDistrict}
              </div>
              <div className="item-row" style={{ marginTop: 8 }}>
                <span className="muted">Şoför: {l.driverName || '-'}</span>
                <span className="muted">Müsait: {formatDate(l.availableFrom)}</span>
              </div>
              {l.capacityNote ? (
                <div className="muted" style={{ fontSize: 13, marginTop: 6 }}>
                  {l.capacityNote}
                </div>
              ) : null}
            </button>
          ))}

          {listings.length === 0 ? (
            <PageEmpty
              icon="🚚"
              title="Boş araç ilanı bulunamadı"
              description="Filtreleri temizleyip tekrar deneyin veya daha sonra tekrar bakın."
              actionLabel="Filtreleri Temizle"
              onAction={clearFilter}
            />
          ) : null}
        </div>
      )}

      {selected ? (
        <div className="confirm-backdrop" role="presentation" onClick={() => setSelected(null)}>
          <div
            className="confirm-card glass-card"
            role="dialog"
            aria-modal
            aria-labelledby="dl-detail-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="dl-detail-title" className="confirm-title">
              {selected.originCity} → {selected.destinationCity}
            </h2>
            <div style={{ textAlign: 'left', display: 'grid', gap: 8, marginTop: 8 }}>
              <div className="item-row">
                <span className="muted">Kalkış</span>
                <strong>
                  {selected.originCity} / {selected.originDistrict}
                </strong>
              </div>
              <div className="item-row">
                <span className="muted">Varış</span>
                <strong>
                  {selected.destinationCity} / {selected.destinationDistrict}
                </strong>
              </div>
              <div className="item-row">
                <span className="muted">Araç tipi</span>
                <span>{selected.vehicleType}</span>
              </div>
              <div className="item-row">
                <span className="muted">Müsaitlik</span>
                <span>{formatDate(selected.availableFrom)}</span>
              </div>
              <div className="item-row">
                <span className="muted">Şoför</span>
                <span>{selected.driverName || '-'}</span>
              </div>
              {selected.capacityNote ? (
                <div className="item-row">
                  <span className="muted">Kapasite</span>
                  <span>{selected.capacityNote}</span>
                </div>
              ) : null}
              {selected.notes ? (
                <div>
                  <span className="muted">Not</span>
                  <p style={{ marginTop: 4 }}>{selected.notes}</p>
                </div>
              ) : null}
            </div>

            <div className="confirm-actions" style={{ marginTop: 16 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setSelected(null)}>
                Kapat
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled
                title="Teklif verme yakında eklenecek"
              >
                Teklif Ver (yakında)
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
