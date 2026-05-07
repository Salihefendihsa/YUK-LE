import { useEffect, useState } from 'react'
import { getCustomers, toggleUserActive } from '../../api/admin'
import { PageError, PageSkeleton } from '../../components/common/PageStates'
import '../shared/Page.css'

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Array<Record<string, string | number | boolean>>>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  async function fetchCustomers() {
    const data = await getCustomers()
    setCustomers(data)
  }

  useEffect(() => {
    fetchCustomers()
      .catch((e: { uiMessage?: string }) => setError(e.uiMessage ?? 'Müşteri listesi yüklenemedi.'))
      .finally(() => setLoading(false))
  }, [])

  async function toggleUser(userId: number) {
    await toggleUserActive(userId)
    await fetchCustomers()
  }

  if (loading) return <PageSkeleton rows={6} />

  return (
    <div className="page-wrap">
      <h1 className="page-title">Müşteri Yönetimi</h1>
      {error ? <PageError message={error} /> : null}
      <div className="list-grid">
        {customers.map((customer) => (
          <div key={String(customer.id)} className="item-card">
            <strong>{String(customer.fullName)}</strong>
            <p className="muted">{String(customer.email)} | {String(customer.phone)}</p>
            <p className="muted">Toplam İlan: {String(customer.totalLoadCount)} | Harcama: {Number(customer.totalSpent).toFixed(2)} ₺</p>
            <button className="btn btn-primary btn-sm" onClick={() => toggleUser(Number(customer.id))}>
              {Boolean(customer.isActive) ? 'Askıya Al' : 'Aktif Et'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
