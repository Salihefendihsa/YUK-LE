import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getLoads } from '../../api/loads'
import type { Load } from '../../api/types'
import { PageEmpty, PageError, PageSkeleton } from '../../components/common/PageStates'
import '../shared/Page.css'

const STATUS: Record<string, string> = {
  Active: 'Aktif',
  OnWay: 'Yolda',
  Delivered: 'Teslim',
  Cancelled: 'İptal',
  Assigned: 'Atandı',
}

const STATUS_CLASS: Record<string, string> = {
  Active: 'badge-success',
  OnWay: 'badge-warning',
  Delivered: 'badge-muted',
  Cancelled: 'badge-error',
  Assigned: 'badge-info',
}

function isNewLoad(createdAt: string) {
  const t = new Date(createdAt).getTime()
  return Date.now() - t < 48 * 3600 * 1000
}

export default function CustomerLoadsPage() {
  const [loads, setLoads] = useState<Load[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getLoads()
      .then((data) => {
        setLoads(Array.isArray(data) ? data : [])
      })
      .catch((e: { uiMessage?: string }) => {
        setError(e.uiMessage ?? 'İlanlar yüklenemedi.')
        setLoads([])
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageSkeleton rows={6} variant="card" />
  const loadList = Array.isArray(loads) ? loads : []

  return (
    <div className="page-wrap">
      <div className="page-head">
        <div>
          <h1 className="page-title">İlanlarım</h1>
          <p className="page-sub">Aktif ilanlar ve durumları</p>
        </div>
        <Link className="btn btn-primary" to="/customer/loads/create">
          + Yeni İlan
        </Link>
      </div>
      {error ? <PageError message={error} /> : null}
      <div className="loads-grid-responsive">
        {loadList.map((load) => (
          <div key={load.id} className="item-card">
            <div className="item-row">
              <span className="item-route">
                {load.fromCity} → {load.toCity}
              </span>
              <span className={`badge ${STATUS_CLASS[load.status] ?? 'badge-muted'}`}>{STATUS[load.status] ?? load.status}</span>
            </div>
            {isNewLoad(load.createdAt) ? (
              <div style={{ marginTop: 8 }}>
                <span className="badge-new-glow">YENİ</span>
              </div>
            ) : null}
            <div className="item-row" style={{ marginTop: 10 }}>
              <span className="muted">{load.type}</span>
              <strong>₺{load.price.toLocaleString('tr-TR')}</strong>
            </div>
            <div className="item-row" style={{ marginTop: 6 }}>
              <span className="muted">Teklif: {load.bidCount ?? 0}</span>
            </div>
            <Link to={`/customer/loads/${load.id}`} className="btn btn-sm btn-detail-orange">
              Detay
            </Link>
          </div>
        ))}
        {loadList.length === 0 ? (
          <PageEmpty
            icon="📦"
            title="Henüz ilan yok"
            description="Yeni bir ilan oluşturarak teklif toplamaya başlayabilirsiniz."
            actionLabel="İlan Oluştur"
            onAction={() => {
              window.location.href = '/customer/loads/create'
            }}
          />
        ) : null}
      </div>
    </div>
  )
}
