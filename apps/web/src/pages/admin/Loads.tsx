import { useEffect, useState } from 'react'
import { cancelAdminLoad, getAdminLoads } from '../../api/admin'
import { PageError, PageSkeleton } from '../../components/common/PageStates'
import './AdminPanel.css'
import { Link } from 'react-router-dom'

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

  if (loading) return <PageSkeleton rows={8} />

  return (
    <div className="admin-page">
      <h1 className="admin-title">İlan Yönetimi</h1>
      {error ? <PageError message={error} /> : null}
      <div className="admin-filters">
        <input className="form-input" placeholder="Durum" value={status} onChange={(e) => setStatus(e.target.value)} />
        <input className="form-input" type="date" />
        <input className="form-input" type="date" />
        <input className="form-input" placeholder="Şehir filtresi" />
        <input className="form-input" placeholder="İlan ID, müşteri, şoför" value={search} onChange={(e) => setSearch(e.target.value)} />
        <button className="btn btn-primary btn-sm" onClick={() => loadData()}>Filtrele</button>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>İlan ID</th><th>Güzergah</th><th>Durum</th><th>Anlaşılan Fiyat</th><th>AI Önerilen</th><th>İşlemler</th></tr>
          </thead>
          <tbody>
            {loads.map((load) => (
              <tr key={String(load.id)}>
                <td className="mono"><Link to={`/admin/loads/${String(load.id)}`}>{String(load.id).slice(0, 8)}</Link></td>
                <td>{String(load.fromCity)} → {String(load.toCity)}</td>
                <td>{String(load.status)}</td>
                <td>₺{Number(load.price).toFixed(2)}</td>
                <td>₺{Number(load.price).toFixed(2)}</td>
                <td>
                  <button className="btn btn-danger btn-sm" onClick={() => {
                    if (window.confirm('Bu işlem geri alınamaz. İlan iptal edilsin mi?')) void cancelLoad(String(load.id))
                  }}>İptal Et</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {loads.length === 0 ? <div className="admin-card empty-state">📦 İlan bulunamadı.</div> : null}
    </div>
  )
}
