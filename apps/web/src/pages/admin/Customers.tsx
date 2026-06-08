import { useEffect, useState } from 'react'
import { getCustomers, toggleUserActive } from '../../api/admin'
import { PageError, PageSkeleton } from '../../components/common/PageStates'
import './AdminPanel.css'
import { Link } from 'react-router-dom'
import { formatCurrencyTRY, normalizeArray } from '../../utils/format'
import { toast } from '@/components/common/Toast'

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Array<Record<string, string | number | boolean>>>([])
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)

  async function fetchCustomers() {
    const data = await getCustomers()
    setCustomers(normalizeArray<Record<string, string | number | boolean>>(data))
  }

  useEffect(() => {
    fetchCustomers()
      .catch((e: { uiMessage?: string }) => setError(e.uiMessage ?? 'Müşteri listesi yüklenemedi.'))
      .finally(() => setLoading(false))
  }, [])

  async function toggleUser(userId: number, currentlyActive: boolean) {
    try {
      await toggleUserActive(userId)
      toast.success(currentlyActive ? 'Hesap askıya alındı.' : 'Hesap aktifleştirildi.')
      await fetchCustomers()
    } catch (e) {
      toast.error((e as { uiMessage?: string }).uiMessage ?? 'İşlem başarısız.')
    }
  }

  if (loading) return <PageSkeleton rows={8} />
  const customerList = Array.isArray(customers) ? customers : []
  const filtered = customerList.filter((c) => JSON.stringify(c).toLowerCase().includes(query.toLowerCase()))

  return (
    <div className="admin-page">
      <h1 className="admin-title">Müşteri Yönetimi</h1>
      {error ? <PageError message={error} /> : null}
      <div className="admin-filters">
        <select className="form-input"><option>Tümü</option><option>Aktif</option><option>Askıda</option></select>
        <input className="form-input" type="date" />
        <input className="form-input" type="date" />
        <input className="form-input" placeholder="Ad, email, telefon, şirket, vergi no" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>ID</th><th>Ad Soyad</th><th>E-posta + Telefon</th><th>Toplam İlan</th><th>Harcama</th><th>Durum</th><th>İşlem</th></tr>
          </thead>
          <tbody>
            {filtered.map((customer) => (
              <tr key={String(customer.id)}>
                <td className="mono">{String(customer.id)}</td>
                <td>{String(customer.fullName)}</td>
                <td>{String(customer.email)} / {String(customer.phone)}</td>
                <td>{String(customer.totalLoadCount)}</td>
                <td>{formatCurrencyTRY(Number(customer.totalSpent ?? 0))}</td>
                <td>{Boolean(customer.isActive) ? 'Aktif' : 'Askıda'}</td>
                <td>
                  <Link to={`/admin/customers/${String(customer.id)}`} className="btn btn-ghost btn-sm">Detay</Link>{' '}
                  <button className="btn btn-primary btn-sm" onClick={() => void toggleUser(Number(customer.id), Boolean(customer.isActive))}>
                    {Boolean(customer.isActive) ? 'Askıya Al' : 'Aktif Et'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 ? <div className="admin-card empty-state">🏭 Müşteri kaydı bulunamadı.</div> : null}
    </div>
  )
}
