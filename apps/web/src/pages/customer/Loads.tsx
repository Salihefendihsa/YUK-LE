import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getActiveLoads } from '../../api/loads'
import type { Load } from '../../api/types'
import { PageError, PageSkeleton } from '../../components/common/PageStates'
import '../shared/Page.css'

const STATUS: Record<string, string> = {
  Active: 'Aktif',
  OnWay: 'Yolda',
  Delivered: 'Teslim',
  Cancelled: 'Iptal',
  Assigned: 'Atandi',
}

export default function CustomerLoadsPage() {
  const [loads, setLoads] = useState<Load[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getActiveLoads()
      .then((data) => setLoads(data))
      .catch((e: { uiMessage?: string }) => setError(e.uiMessage ?? 'Ilanlar yuklenemedi.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageSkeleton rows={6} />

  return (
    <div className="page-wrap">
      <div className="page-head">
        <div>
          <h1 className="page-title">Ilanlarim</h1>
          <p className="page-sub">Aktif ilanlar ve durumlari</p>
        </div>
        <Link className="btn btn-primary" to="/customer/loads/create">
          + Yeni Ilan
        </Link>
      </div>
      {error ? <PageError message={error} /> : null}
      <div className="list-grid">
        {loads.map((load) => (
          <Link key={load.id} className="item-card" to={`/customer/loads/${load.id}`}>
            <div className="item-row">
              <span className="item-route">
                {load.fromCity} → {load.toCity}
              </span>
              <span className="badge badge-info">{STATUS[load.status] ?? load.status}</span>
            </div>
            <div className="item-row" style={{ marginTop: 8 }}>
              <span className="muted">{load.type}</span>
              <strong>₺{load.price.toLocaleString('tr-TR')}</strong>
            </div>
          </Link>
        ))}
        {loads.length === 0 ? <div className="card muted">Gosterilecek ilan yok.</div> : null}
      </div>
    </div>
  )
}
