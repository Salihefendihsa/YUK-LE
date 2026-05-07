import { useEffect, useState } from 'react'
import { cancelAdminLoad, getAdminLoads } from '../../api/admin'
import { PageError, PageSkeleton } from '../../components/common/PageStates'
import '../shared/Page.css'

export default function AdminLoadsPage() {
  const [loads, setLoads] = useState<Array<Record<string, string | number>>>([])
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  async function loadData() {
    const data = await getAdminLoads(status || undefined, search || undefined)
    setLoads(data)
  }

  useEffect(() => {
    loadData()
      .catch((e: { uiMessage?: string }) => setError(e.uiMessage ?? 'İlanlar yüklenemedi.'))
      .finally(() => setLoading(false))
  }, [])

  async function cancelLoad(id: string) {
    await cancelAdminLoad(id)
    await loadData()
  }

  if (loading) return <PageSkeleton rows={6} />

  return (
    <div className="page-wrap">
      <h1 className="page-title">İlan Yönetimi</h1>
      {error ? <PageError message={error} /> : null}
      <div className="item-row">
        <input className="form-input" placeholder="Durum (Active/OnWay/Delivered/Cancelled)" value={status} onChange={(e) => setStatus(e.target.value)} />
        <input className="form-input" placeholder="Arama" value={search} onChange={(e) => setSearch(e.target.value)} />
        <button className="btn btn-primary btn-sm" onClick={() => loadData()}>Filtrele</button>
      </div>
      <div className="list-grid">
        {loads.map((load) => (
          <div key={String(load.id)} className="item-card">
            <strong>{String(load.fromCity)} → {String(load.toCity)}</strong>
            <p className="muted">Durum: {String(load.status)}</p>
            <p className="muted">Fiyat: {Number(load.price).toFixed(2)} ₺</p>
            <button className="btn btn-danger btn-sm" onClick={() => cancelLoad(String(load.id))}>Admin Olarak İptal Et</button>
          </div>
        ))}
      </div>
    </div>
  )
}
