import { useEffect, useState } from 'react'
import { getPayments, releasePayment } from '../../api/admin'
import { PageError, PageSkeleton } from '../../components/common/PageStates'
import '../shared/Page.css'

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

  if (loading) return <PageSkeleton rows={6} />

  return (
    <div className="page-wrap">
      <h1 className="page-title">Ödeme Takibi</h1>
      {error ? <PageError message={error} /> : null}
      <div className="list-grid">
        {payments.map((payment) => (
          <div key={String(payment.id)} className="item-card">
            <strong>İşlem: {String(payment.transactionId)}</strong>
            <p className="muted">Escrow Durumu: {String(payment.status)}</p>
            <p className="muted">Tutar: {Number(payment.amount).toFixed(2)} ₺</p>
            <button className="btn btn-primary btn-sm" onClick={() => release(String(payment.id))}>Manuel Serbest Bırak</button>
          </div>
        ))}
      </div>
    </div>
  )
}
