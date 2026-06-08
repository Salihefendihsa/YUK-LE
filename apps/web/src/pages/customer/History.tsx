import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCustomerLoadHistory, type HistoryRow } from '../../api/loads'
import { PageEmpty, PageError, PageSkeleton } from '../../components/common/PageStates'
import { formatCurrencyTRY } from '../../utils/format'
import '../shared/Page.css'

export default function CustomerHistoryPage() {
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [items, setItems] = useState<HistoryRow[]>([])
  const [totalSpend, setTotalSpend] = useState(0)

  useEffect(() => {
    void (async () => {
      try {
        const data = await getCustomerLoadHistory(1, 50)
        setItems(data.items ?? [])
        setTotalSpend(data.totalSpend ?? 0)
      } catch (e: unknown) {
        setErr((e as { uiMessage?: string }).uiMessage ?? 'Geçmiş yüklenemedi.')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) return <PageSkeleton rows={5} variant="card" />
  if (err) {
    return (
      <div className="page-wrap">
        <div className="page-head">
          <div>
            <h1 className="page-title">Geçmiş Seferler</h1>
            <p className="page-sub">Tamamlanan teslimatlar</p>
          </div>
        </div>
        <PageError message={err} />
      </div>
    )
  }

  return (
    <div className="page-wrap">
      <div className="page-head">
        <div>
          <h1 className="page-title">Geçmiş Seferler</h1>
          <p className="page-sub">Teslim edilen yükler ve toplam harcama</p>
        </div>
      </div>
      <div className="card" style={{ marginBottom: 16 }}>
        <p className="muted">Toplam harcama</p>
        <p className="stat-value" style={{ fontSize: 22, marginTop: 4 }}>
          {formatCurrencyTRY(totalSpend)}
        </p>
      </div>
      <div className="loads-grid-responsive">
        {items.map((i) => (
          <Link
            key={String(i.id)}
            to={`/customer/loads/${i.id}`}
            className="item-card"
            style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
          >
            <strong>
              {i.fromCity} → {i.toCity}
            </strong>
            <p className="muted">Şoför: {i.driverName ?? '—'}</p>
            <p className="muted">{i.deliveryDate ? new Date(i.deliveryDate).toLocaleDateString('tr-TR') : '—'}</p>
            <p>{formatCurrencyTRY(i.price)}</p>
          </Link>
        ))}
        {items.length === 0 ? (
          <PageEmpty
            icon="🧾"
            title="Geçmiş sefer bulunamadı"
            description="Teslim edilen seferler burada listelenecek."
            actionLabel="İlanlara Git"
            onAction={() => {
              window.location.href = '/customer/loads'
            }}
          />
        ) : null}
      </div>
    </div>
  )
}
