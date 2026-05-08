import { useEffect, useState } from 'react'
import { getPayments, releasePayment } from '../../api/admin'
import { PageError, PageSkeleton } from '../../components/common/PageStates'
import './AdminPanel.css'

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Array<Record<string, string | number>>>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  async function fetchPayments() {
    const data = await getPayments()
    setPayments(data)
  }

  useEffect(() => {
    fetchPayments()
      .catch((e: { uiMessage?: string }) => setError(e.uiMessage ?? 'Ödeme listesi yüklenemedi.'))
      .finally(() => setLoading(false))
  }, [])

  async function release(id: string) {
    await releasePayment(id)
    await fetchPayments()
  }

  if (loading) return <PageSkeleton rows={8} />
  const totalVolume = payments.reduce((a, b) => a + Number(b.amount ?? 0), 0)
  const failedCount = payments.filter((p) => String(p.status).toLowerCase().includes('fail')).length

  return (
    <div className="admin-page">
      <h1 className="admin-title">Ödeme & Finans</h1>
      {error ? <PageError message={error} /> : null}
      <div className="kpi-grid">
        <div className="admin-card"><div className="kpi-label">Toplam İşlem Hacmi</div><div className="kpi-value">₺{totalVolume.toFixed(2)}</div></div>
        <div className="admin-card"><div className="kpi-label">Escrow Bekleyen</div><div className="kpi-value">₺{(totalVolume * 0.3).toFixed(2)}</div></div>
        <div className="admin-card"><div className="kpi-label">Bu Ay Komisyon</div><div className="kpi-value">₺{(totalVolume * 0.1).toFixed(2)}</div></div>
        <div className="admin-card"><div className="kpi-label">Başarısız İşlem</div><div className="kpi-value danger">{failedCount}</div></div>
      </div>
      <div className="admin-filters">
        <select className="form-input"><option>Tümü</option><option>Escrow</option><option>Tamamlandı</option><option>İade</option><option>Başarısız</option></select>
        <input className="form-input" type="date" />
        <input className="form-input" type="date" />
        <input className="form-input" placeholder="Müşteri/Şoför adı" />
        <input className="form-input" placeholder="Tutar aralığı" />
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>İşlem ID</th><th>Yük ID</th><th>Tutar</th><th>Komisyon</th><th>Net</th><th>Durum</th><th>İşlem</th></tr></thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={String(payment.id)}>
                <td className="mono">{String(payment.transactionId)}</td>
                <td className="mono">{String(payment.loadId)}</td>
                <td>₺{Number(payment.amount).toFixed(2)}</td>
                <td>₺{(Number(payment.amount) * 0.1).toFixed(2)} (%10)</td>
                <td>₺{(Number(payment.amount) * 0.9).toFixed(2)}</td>
                <td>{String(payment.status)}</td>
                <td>
                  <button className="btn btn-primary btn-sm" onClick={() => {
                    if (window.confirm('Manuel serbest bırakma onaylanıyor mu?')) void release(String(payment.id))
                  }}>Serbest Bırak</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {payments.length === 0 ? <div className="admin-card empty-state">💳 Ödeme kaydı yok.</div> : null}
    </div>
  )
}
