import { useEffect, useState } from 'react'
import { getDriverLoadHistory, type HistoryRow } from '../../api/loads'
import { PageEmpty, PageError, PageSkeleton } from '../../components/common/PageStates'
import { formatCurrencyTRY } from '../../utils/format'
import '../shared/Page.css'

export default function DriverHistoryPage() {
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [items, setItems] = useState<HistoryRow[]>([])
  const [totalEarn, setTotalEarn] = useState(0)
  const [tripCount, setTripCount] = useState(0)

  useEffect(() => {
    void (async () => {
      try {
        const data = await getDriverLoadHistory(1, 50)
        setItems(data.items ?? [])
        setTotalEarn(data.totalEarn ?? 0)
        setTripCount(data.tripCount ?? 0)
      } catch (e: unknown) {
        setErr((e as { uiMessage?: string }).uiMessage ?? 'Geçmiş yüklenemedi.')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) return <PageSkeleton rows={5} variant="card" />
  if (err) return <PageError message={err} />

  return (
    <div className="page-wrap">
      <h1 className="page-title">Geçmiş Seferlerim</h1>
      <div className="card" style={{ marginBottom: 16 }}>
        <p className="muted">Toplam kazanç · Sefer sayısı</p>
        <p style={{ fontSize: 22, fontWeight: 700 }}>
          {formatCurrencyTRY(totalEarn)} · {tripCount} sefer
        </p>
      </div>
      <div className="list-grid">
        {items.map((i) => (
          <div key={String(i.id)} className="item-card">
            <strong>
              {i.fromCity} → {i.toCity}
            </strong>
            <p className="muted">Müşteri: {i.customerName ?? '—'}</p>
            <p className="muted">{i.deliveryDate ? new Date(i.deliveryDate).toLocaleDateString('tr-TR') : '—'}</p>
            <p>{formatCurrencyTRY(i.price)}</p>
          </div>
        ))}
        {items.length === 0 ? (
          <PageEmpty
            icon="🚚"
            title="Geçmiş sefer bulunamadı"
            description="Tamamlanan seferler burada listelenecek."
            actionLabel="Yükleri İncele"
            onAction={() => {
              window.location.href = '/driver/loads'
            }}
          />
        ) : null}
      </div>
    </div>
  )
}
