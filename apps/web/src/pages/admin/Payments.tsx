import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getPayments, releasePayment } from '../../api/admin'
import { PageError, PageSkeleton } from '../../components/common/PageStates'
import {
  estimatePlatformCommissionFromCustomerTotal,
  formatPaymentStatusLabel,
  formatPaymentTransactionId,
} from '../../utils/displayLabels'
import './AdminPanel.css'
import { formatCurrencyTRY, formatDateTR, normalizeArray } from '../../utils/format'

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Array<Record<string, string | number>>>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  async function fetchPayments() {
    const data = await getPayments()
    setPayments(normalizeArray<Record<string, string | number>>(data))
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

  const paymentList = Array.isArray(payments) ? payments : []

  const summary = useMemo(() => {
    const totalVolume = paymentList.reduce((a, b) => a + Number(b.amount ?? 0), 0)
    const blockedAmount = paymentList
      .filter((p) => String(p.status) === 'Blocked')
      .reduce((a, p) => a + Number(p.amount ?? 0), 0)
    const platformCommission = paymentList
      .filter((p) => String(p.status) === 'Released')
      .reduce((a, p) => a + estimatePlatformCommissionFromCustomerTotal(Number(p.amount ?? 0)), 0)
    const failedCount = paymentList.filter((p) => String(p.status).toLowerCase().includes('fail')).length
    const blockedCount = paymentList.filter((p) => String(p.status) === 'Blocked').length
    return { totalVolume, blockedAmount, platformCommission, failedCount, blockedCount, count: paymentList.length }
  }, [paymentList])

  if (loading) return <PageSkeleton rows={8} />

  return (
    <div className="admin-page">
      <h1 className="admin-title">Ödeme & Finans</h1>
      {error ? <PageError message={error} /> : null}
      <div className="kpi-grid">
        <div className="admin-card">
          <div className="kpi-label">Toplam İşlem Hacmi</div>
          <div className="kpi-value">{formatCurrencyTRY(summary.totalVolume)}</div>
        </div>
        <div className="admin-card">
          <div className="kpi-label">Blokede / Bekleyen</div>
          <div className="kpi-value">{formatCurrencyTRY(summary.blockedAmount)}</div>
          <p className="muted" style={{ fontSize: 11, marginTop: 4 }}>
            {summary.blockedCount} kayıt
          </p>
        </div>
        <div className="admin-card">
          <div className="kpi-label">Platform payı (%2+%2)</div>
          <div className="kpi-value">{formatCurrencyTRY(summary.platformCommission)}</div>
          <p className="muted" style={{ fontSize: 11, marginTop: 4 }}>
            Serbest bırakılan işlemlerden
          </p>
        </div>
        <div className="admin-card">
          <div className="kpi-label">Başarısız İşlem</div>
          <div className="kpi-value danger">{summary.failedCount}</div>
        </div>
      </div>
      <div className="admin-filters">
        <select className="form-input">
          <option>Tümü</option>
          <option>Bloke</option>
          <option>Serbest bırakıldı</option>
          <option>İade edildi</option>
          <option>Bekleyen</option>
          <option>Başarısız</option>
        </select>
        <input className="form-input" type="date" />
        <input className="form-input" type="date" />
        <input className="form-input" placeholder="Müşteri/Şoför adı" />
        <input className="form-input" placeholder="Tutar aralığı" />
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>İşlem No</th>
              <th>Yük ID</th>
              <th>Tutar</th>
              <th>Durum</th>
              <th>Tarih</th>
              <th>İşlem</th>
            </tr>
          </thead>
          <tbody>
            {paymentList.map((payment) => (
              <tr key={String(payment.id)}>
                <td>{formatPaymentTransactionId(String(payment.transactionId ?? ''))}</td>
                <td className="mono">
                  <Link to={`/admin/loads/${payment.loadId}`} title="İlan detayı">
                    {String(payment.loadId).slice(0, 8)}…
                  </Link>
                </td>
                <td>{formatCurrencyTRY(payment.amount)}</td>
                <td>{formatPaymentStatusLabel(payment.status)}</td>
                <td>{formatDateTR(String(payment.createdAt ?? ''))}</td>
                <td>
                  {String(payment.status) === 'Blocked' ? (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        if (window.confirm('Manuel serbest bırakma onaylanıyor mu?')) void release(String(payment.id))
                      }}
                    >
                      Serbest Bırak
                    </button>
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {paymentList.length === 0 ? <div className="admin-card empty-state">💳 Ödeme kaydı yok.</div> : null}
    </div>
  )
}
