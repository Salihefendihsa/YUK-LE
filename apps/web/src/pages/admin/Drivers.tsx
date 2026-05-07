import { useEffect, useState } from 'react'
import { getDrivers, toggleUserActive } from '../../api/admin'
import { PageError, PageSkeleton } from '../../components/common/PageStates'
import '../shared/Page.css'

export default function AdminDriversPage() {
  const [drivers, setDrivers] = useState<Array<Record<string, string | number | boolean>>>([])
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  async function fetchDrivers() {
    const data = await getDrivers(status || undefined)
    setDrivers(data)
  }

  useEffect(() => {
    fetchDrivers()
      .catch((e: { uiMessage?: string }) => setError(e.uiMessage ?? 'Şoför listesi yüklenemedi.'))
      .finally(() => setLoading(false))
  }, [])

  async function toggleUser(userId: number) {
    await toggleUserActive(userId)
    await fetchDrivers()
  }

  if (loading) return <PageSkeleton rows={6} />

  return (
    <div className="page-wrap">
      <h1 className="page-title">Şoför Yönetimi</h1>
      {error ? <PageError message={error} /> : null}
      <div className="item-row">
        <input className="form-input" placeholder="Filtre (active/review/rejected)" value={status} onChange={(e) => setStatus(e.target.value)} />
        <button className="btn btn-primary btn-sm" onClick={() => fetchDrivers()}>Filtrele</button>
      </div>
      <div className="list-grid">
        {drivers.map((driver) => (
          <div key={String(driver.id)} className="item-card">
            <strong>{String(driver.fullName)}</strong>
            <p className="muted">{String(driver.phone)} | {String(driver.vehicle ?? '-')}</p>
            <p className="muted">Belge Durumu: {String(driver.approvalStatus)} | Puan: {String(driver.rating)}</p>
            <button className="btn btn-primary btn-sm" onClick={() => toggleUser(Number(driver.id))}>
              {Boolean(driver.isActive) ? 'Askıya Al' : 'Aktif Et'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
