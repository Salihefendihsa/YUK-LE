import { useEffect, useState } from 'react'
import { getDrivers, toggleUserActive } from '../../api/admin'
import { PageError, PageSkeleton } from '../../components/common/PageStates'
import './AdminPanel.css'
import { Link } from 'react-router-dom'
import { normalizeArray } from '../../utils/format'

export default function AdminDriversPage() {
  const [drivers, setDrivers] = useState<Array<Record<string, string | number | boolean>>>([])
  const [status, setStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [sortKey, setSortKey] = useState('fullName')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  async function fetchDrivers() {
    const data = await getDrivers(status === 'all' ? undefined : status)
    setDrivers(normalizeArray<Record<string, string | number | boolean>>(data))
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

  if (loading) return <PageSkeleton rows={8} />

  const driverList = Array.isArray(drivers) ? drivers : []
  const filtered = driverList.filter((d) => JSON.stringify(d).toLowerCase().includes(search.toLowerCase()))
  const sorted = [...filtered].sort((a, b) => {
    const av = String(a[sortKey] ?? '')
    const bv = String(b[sortKey] ?? '')
    return sortDir === 'asc' ? av.localeCompare(bv, 'tr') : bv.localeCompare(av, 'tr')
  })
  const pageItems = sorted.slice((page - 1) * 20, page * 20)
  const totalPages = Math.max(1, Math.ceil(sorted.length / 20))

  return (
    <div className="admin-page">
      <h1 className="admin-title">Şoför Yönetimi</h1>
      {error ? <PageError message={error} /> : null}
      <div className="admin-filters">
        <select className="form-input" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">Tümü</option>
          <option value="active">Aktif</option>
          <option value="review">İnceleme</option>
          <option value="rejected">Reddedildi</option>
        </select>
        <input className="form-input" type="date" />
        <input className="form-input" type="date" />
        <input className="form-input" placeholder="Araç tipi" />
        <input className="form-input" placeholder="Ad, telefon, TC no, plaka" value={search} onChange={(e) => setSearch(e.target.value)} />
        <button className="btn btn-primary btn-sm" onClick={() => fetchDrivers()}>Filtrele</button>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              {['id', 'fullName', 'phone', 'vehicle', 'approvalStatus', 'rating'].map((h) => (
                <th key={h} onClick={() => { setSortKey(h); setSortDir(sortDir === 'asc' ? 'desc' : 'asc') }}>{h}</th>
              ))}
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((driver) => (
              <tr key={String(driver.id)}>
                <td className="mono">{String(driver.id)}</td>
                <td>{String(driver.fullName)}</td>
                <td>{String(driver.phone)}</td>
                <td className="mono">{String(driver.vehicle ?? '-')}</td>
                <td>{String(driver.approvalStatus)}</td>
                <td>⭐ {String(driver.rating)}</td>
                <td>
                  <div className="item-row">
                    <Link to={`/admin/drivers/${String(driver.id)}`} className="btn btn-ghost btn-sm">Detay</Link>
                    <button className="btn btn-primary btn-sm" onClick={() => toggleUser(Number(driver.id))}>
                      {Boolean(driver.isActive) ? 'Askıya Al' : 'Aktif Et'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pageItems.length === 0 ? <div className="admin-card empty-state">🚛 Şoför kaydı bulunamadı.</div> : null}
      <div className="admin-pagination">
        <button className="btn btn-ghost btn-sm" onClick={() => setPage((p) => Math.max(1, p - 1))}>Önceki</button>
        <span>{page}/{totalPages}</span>
        <button className="btn btn-ghost btn-sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Sonraki</button>
      </div>
    </div>
  )
}
