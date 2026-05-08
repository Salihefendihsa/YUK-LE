import { useEffect, useState } from 'react'
import { getAdminUsers, toggleUserActive } from '../../api/admin'
import { PageError, PageSkeleton } from '../../components/common/PageStates'
import './AdminPanel.css'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Array<Record<string, unknown>>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [role, setRole] = useState('All')

  useEffect(() => {
    getAdminUsers()
      .then(setUsers)
      .catch((e: { uiMessage?: string }) => setError(e.uiMessage ?? 'Kullanıcı listesi alınamadı.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageSkeleton rows={8} />
  const filtered = users.filter((u) => {
    if (role !== 'All' && String(u.role) !== role) return false
    return JSON.stringify(u).toLowerCase().includes(query.toLowerCase())
  })

  return (
    <div className="admin-page">
      <h1 className="admin-title">Tüm Kullanıcılar</h1>
      {error ? <PageError message={error} /> : null}
      <div className="admin-filters">
        <select className="form-input" value={role} onChange={(e) => setRole(e.target.value)}>
          <option>All</option><option>Customer</option><option>Driver</option><option>Admin</option>
        </select>
        <input className="form-input" placeholder="Ad, email, telefon" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Ad</th><th>Rol</th><th>Durum</th><th>Kayıt</th><th>İşlem</th></tr></thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={String(u.id)}>
                <td>{String(u.fullName)}</td>
                <td>{String(u.role)}</td>
                <td>{String(u.isActive ? 'Aktif' : 'Askıda')}</td>
                <td>{String(u.createdAt ?? '-')}</td>
                <td>
                  <button className="btn btn-primary btn-sm" onClick={() => void toggleUserActive(Number(u.id))}>Aktif Et/Askıya Al</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
