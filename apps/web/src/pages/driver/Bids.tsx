import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getDriverBids } from '../../api/bids'
import type { DriverBid } from '../../api/types'
import { PageEmpty, PageError, PageSkeleton } from '../../components/common/PageStates'
import { formatBidStatusLabel } from '../../utils/displayLabels'
import { formatCurrencyTRY, formatDateTR, normalizeArray } from '../../utils/format'
import '../shared/Page.css'

function badgeClass(status: string): string {
  const s = String(status).toLowerCase()
  if (s.includes('accept') || s.includes('kabul')) return 'badge badge-success'
  if (s.includes('reject') || s.includes('red')) return 'badge badge-error'
  if (s.includes('cancel') || s.includes('iptal')) return 'badge badge-muted'
  return 'badge badge-warning'
}

export default function DriverBidsPage() {
  const navigate = useNavigate()
  const [bids, setBids] = useState<DriverBid[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadAll = useCallback(async () => {
    setError('')
    const data = normalizeArray<DriverBid>(await getDriverBids())
    setBids(data)
  }, [])

  useEffect(() => {
    loadAll()
      .catch((e: { uiMessage?: string }) => setError(e.uiMessage ?? 'Teklifler yüklenemedi.'))
      .finally(() => setLoading(false))
  }, [loadAll])

  const pendingCount = useMemo(
    () => bids.filter((b) => String(b.status).toLowerCase().includes('pending')).length,
    [bids]
  )

  if (loading) return <PageSkeleton rows={6} variant="card" />

  return (
    <div className="page-wrap">
      <div className="page-head">
        <div>
          <h1 className="page-title">Tekliflerim</h1>
          <p className="page-sub">
            Verdiğiniz teklifler{pendingCount > 0 ? ` · ${pendingCount} beklemede` : ''}
          </p>
        </div>
        <Link className="btn btn-ghost" to="/driver/loads">
          Yük Panosu
        </Link>
      </div>

      {error ? <PageError message={error} onRetry={() => void loadAll()} /> : null}

      {bids.length === 0 ? (
        <PageEmpty
          icon="💼"
          title="Henüz teklif vermediniz"
          description="Yük Panosu'ndan ilanlara teklif verdiğinizde burada listelenir."
          actionLabel="Yük Panosu"
          onAction={() => navigate('/driver/loads')}
        />
      ) : (
        <div className="list-grid" style={{ gap: 12 }}>
          {bids.map((bid) => (
            <Link
              key={bid.id}
              to={`/driver/loads/${bid.loadId}`}
              className="item-card"
              style={{ padding: 16, textDecoration: 'none' }}
            >
              <div className="item-row" style={{ flexWrap: 'wrap', gap: 8 }}>
                <strong style={{ fontSize: 16 }}>
                  {bid.fromCity} → {bid.toCity}
                </strong>
                <strong>{formatCurrencyTRY(bid.amount)}</strong>
              </div>
              <div className="item-row" style={{ marginTop: 8, flexWrap: 'wrap', gap: 8 }}>
                <span className="muted" style={{ fontSize: 13 }}>
                  {formatDateTR(bid.offerDate)}
                  {bid.note ? ` · ${bid.note}` : ''}
                </span>
                <span className={badgeClass(bid.status)}>{formatBidStatusLabel(bid.status)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
