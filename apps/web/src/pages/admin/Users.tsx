import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAdminUsers, toggleUserActive } from '../../api/admin'
import { PageError, PageSkeleton } from '../../components/common/PageStates'
import { toast } from '@/components/common/Toast'
import { formatRoleLabel } from '../../utils/displayLabels'
import './AdminPanel.css'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Array<Record<string, unknown>>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [role, setRole] = useState('All')

  const fetchUsers = useCallback(async () => {
    setUsers(await getAdminUsers())
  }, [])

  useEffect(() => {
    fetchUsers()
      .catch((e: { uiMessage?: string }) => setError(e.uiMessage ?? 'Kullanıcı listesi alınamadı.'))
      .finally(() => setLoading(false))
  }, [fetchUsers])

  async function toggleUser(userId: number, currentlyActive: boolean) {
    try {
      await toggleUserActive(userId)
      toast.success(currentlyActive ? 'Hesap askıya alındı.' : 'Hesap aktifleştirildi.')
      await fetchUsers()
    } catch (e) {
      toast.error((e as { uiMessage?: string }).uiMessage ?? 'İşlem başarısız.')
    }
  }

  function detailPath(u: Record<string, unknown>): string | null {
    const r = String(u.role)
    if (r === 'Driver') return `/admin/drivers/${String(u.id)}`
    if (r === 'Customer') return `/admin/customers/${String(u.id)}`
    return null
  }

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
          <option value="All">Tümü</option><option value="Customer">Müşteri</option><option value="Driver">Şoför</option><option value="Admin">Yönetici</option>
        </select>
        <input className="form-input" placeholder="Ad, email, telefon" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Ad</th><th>Rol</th><th>E-posta</th><th>Telefon</th><th>Durum</th><th>Kayıt</th><th>İşlem</th></tr></thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={String(u.id)}>
                <td>{String(u.fullName)}</td>
                <td>{formatRoleLabel(u.role)}</td>
                <td>{String(u.email ?? '-')}</td>
                <td>{String(u.phone ?? '-')}</td>
                <td>{String(u.isActive ? 'Aktif' : 'Askıda')}</td>
                <td>{String(u.createdAt ?? '-')}</td>
                <td>
                  {detailPath(u) ? (
                    <Link to={detailPath(u)!} className="btn btn-ghost btn-sm">Detay</Link>
                  ) : null}{' '}
                  <button className="btn btn-primary btn-sm" onClick={() => void toggleUser(Number(u.id), Boolean(u.isActive))}>
                    {Boolean(u.isActive) ? 'Askıya Al' : 'Aktif Et'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
