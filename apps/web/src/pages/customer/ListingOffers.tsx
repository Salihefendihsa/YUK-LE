import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { getMyOffers, withdrawOffer, type MyListingOffer } from '../../api/driverListings'
import { PageEmpty, PageError, PageSkeleton } from '../../components/common/PageStates'
import { toast } from '../../components/common/Toast'
import '../shared/Page.css'

const STATUS_LABEL: Record<string, string> = {
  Pending: 'Beklemede',
  Accepted: 'Kabul edildi',
  Rejected: 'Reddedildi',
  Withdrawn: 'Geri çekildi',
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'Pending':
      return 'badge badge-warning'
    case 'Accepted':
      return 'badge badge-success'
    case 'Rejected':
      return 'badge badge-error'
    default:
      return 'badge badge-muted'
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '-' : d.toLocaleDateString('tr-TR')
}

export default function CustomerListingOffersPage() {
  const navigate = useNavigate()
  const [offers, setOffers] = useState<MyListingOffer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null)

  useEffect(() => {
    getMyOffers()
      .then((data) => setOffers(Array.isArray(data) ? data : []))
      .catch((e: { uiMessage?: string }) => {
        setError(e.uiMessage ?? 'Teklifleriniz yüklenemedi.')
        setOffers([])
      })
      .finally(() => setLoading(false))
  }, [])

  async function handleWithdraw(id: string) {
    if (!window.confirm('Bu teklifi geri çekmek istediğinize emin misiniz?')) return
    setWithdrawingId(id)
    try {
      await withdrawOffer(id)
      // Canlı güncelleme: durumu yerinde güncelle.
      setOffers((prev) => prev.map((o) => (o.id === id ? { ...o, status: 'Withdrawn' } : o)))
      toast.success('Teklif geri çekildi.')
    } catch (e) {
      toast.error((e as { uiMessage?: string }).uiMessage ?? 'Teklif geri çekilemedi.')
    } finally {
      setWithdrawingId(null)
    }
  }

  if (loading) return <PageSkeleton rows={6} variant="card" />

  return (
    <div className="page-wrap">
      <div className="page-head">
        <div>
          <h1 className="page-title">Boş Araç Tekliflerim</h1>
          <p className="page-sub">Şoför boş araç ilanlarına gönderdiğiniz yük teklifleri</p>
        </div>
      </div>

      {error ? <PageError message={error} /> : null}

      <div className="loads-grid-responsive">
        {offers.map((o) => (
          <div key={o.id} className="item-card">
            <div className="item-row">
              <strong>
                {o.fromCity} → {o.toCity}
              </strong>
              <span className={statusBadgeClass(o.status)}>
                {STATUS_LABEL[o.status] ?? o.status}
              </span>
            </div>
            <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
              Şoför güzergâhı: {o.originCity} → {o.destinationCity}
            </div>
            <div className="item-row" style={{ marginTop: 8 }}>
              <span className="muted">Şoför: {o.driverName || '-'}</span>
              <span className="muted">{formatDate(o.createdAt)}</span>
            </div>
            {o.amount != null ? (
              <div className="item-row" style={{ marginTop: 6 }}>
                <span className="muted">Önerilen tutar</span>
                <strong>₺{o.amount.toLocaleString('tr-TR')}</strong>
              </div>
            ) : null}
            {o.note ? (
              <div className="muted" style={{ fontSize: 13, marginTop: 6 }}>
                {o.note}
              </div>
            ) : null}
            {o.status === 'Pending' ? (
              <div style={{ marginTop: 12 }}>
                <button
                  className="btn btn-ghost btn-sm"
                  disabled={withdrawingId === o.id}
                  onClick={() => void handleWithdraw(o.id)}
                >
                  {withdrawingId === o.id ? 'Geri çekiliyor…' : 'Teklifi Geri Çek'}
                </button>
              </div>
            ) : null}
          </div>
        ))}

        {offers.length === 0 ? (
          <PageEmpty
            icon="🚚"
            title="Henüz teklifiniz yok"
            description="Boş araç ilanlarına göz atıp yükünüz için teklif gönderebilirsiniz."
            actionLabel="Boş Araçlar"
            onAction={() => navigate('/customer/driver-listings')}
          />
        ) : null}
      </div>
    </div>
  )
}
