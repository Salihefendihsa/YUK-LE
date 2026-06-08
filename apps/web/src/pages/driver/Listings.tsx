import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  cancelDriverListing,
  getMyDriverListings,
  type DriverListing,
} from '../../api/driverListings'
import { PageEmpty, PageError, PageSkeleton } from '../../components/common/PageStates'
import { toast } from '../../components/common/Toast'
import '../shared/Page.css'

const STATUS_LABEL: Record<string, string> = {
  Active: 'Yayında',
  Matched: 'Eşleşti',
  Cancelled: 'İptal',
  Expired: 'Süresi doldu',
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'Active':
      return 'badge badge-info'
    case 'Matched':
      return 'badge badge-success'
    default:
      return 'badge badge-muted'
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '-' : d.toLocaleDateString('tr-TR')
}

export default function DriverListingsPage() {
  const navigate = useNavigate()
  const [listings, setListings] = useState<DriverListing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  useEffect(() => {
    getMyDriverListings()
      .then((data) => setListings(Array.isArray(data) ? data : []))
      .catch((e: { uiMessage?: string }) => {
        setError(e.uiMessage ?? 'İlanlarınız yüklenemedi.')
        setListings([])
      })
      .finally(() => setLoading(false))
  }, [])

  async function handleCancel(id: string) {
    if (!window.confirm('Bu ilanı iptal etmek istediğinize emin misiniz?')) return
    setCancellingId(id)
    try {
      await cancelDriverListing(id)
      // Canlı güncelleme: kartı yeniden çekmeden durumu yerinde güncelle.
      setListings((prev) => prev.map((l) => (l.id === id ? { ...l, status: 'Cancelled' } : l)))
      toast.success('İlan iptal edildi.')
    } catch (e) {
      toast.error((e as { uiMessage?: string }).uiMessage ?? 'İlan iptal edilemedi.')
    } finally {
      setCancellingId(null)
    }
  }

  if (loading) return <PageSkeleton rows={6} variant="card" />

  return (
    <div className="page-wrap">
      <div className="page-head">
        <div>
          <h1 className="page-title">Boş Araç İlanlarım</h1>
          <p className="page-sub">Yayınladığınız güzergâh ve müsaitlik ilanları</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/driver/listings/create')}>
          + Yeni İlan
        </button>
      </div>

      {error ? <PageError message={error} /> : null}

      <div className="loads-grid-responsive">
        {listings.map((l) => (
          <div key={l.id} className="item-card">
            <div className="item-row">
              <strong>
                {l.originCity} → {l.destinationCity}
              </strong>
              <span className={statusBadgeClass(l.status)}>{STATUS_LABEL[l.status] ?? l.status}</span>
            </div>
            <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
              {l.originDistrict} / {l.destinationDistrict}
            </div>
            <div className="item-row" style={{ marginTop: 8 }}>
              <span className="muted">{l.vehicleType}</span>
              <span className="muted">Müsait: {formatDate(l.availableFrom)}</span>
            </div>
            {l.capacityNote ? (
              <div className="muted" style={{ fontSize: 13, marginTop: 6 }}>
                {l.capacityNote}
              </div>
            ) : null}
            {l.status === 'Active' ? (
              <div style={{ marginTop: 12 }}>
                <button
                  className="btn btn-ghost btn-sm"
                  disabled={cancellingId === l.id}
                  onClick={() => handleCancel(l.id)}
                >
                  {cancellingId === l.id ? 'İptal ediliyor...' : 'İlanı İptal Et'}
                </button>
              </div>
            ) : null}
          </div>
        ))}

        {listings.length === 0 ? (
          <PageEmpty
            icon="🚚"
            title="Henüz ilanınız yok"
            description="Boş aracınız için güzergâh ve müsaitlik ilanı yayınlayın."
            actionLabel="Boş Araç İlanı Ver"
            onAction={() => navigate('/driver/listings/create')}
          />
        ) : null}
      </div>
    </div>
  )
}
