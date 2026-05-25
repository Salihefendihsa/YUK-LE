import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { acceptBid, getBidsForLoad } from '../../api/bids'
import { getLoads } from '../../api/loads'
import type { Bid, Load } from '../../api/types'
import { PageEmpty, PageError, PageSkeleton } from '../../components/common/PageStates'
import { formatBidStatusLabel } from '../../utils/displayLabels'
import { formatCurrencyTRY, formatDateTR, normalizeArray } from '../../utils/format'
import '../shared/Page.css'

type LoadBidGroup = {
  load: Load
  bids: Bid[]
}

export default function CustomerBidsPage() {
  const navigate = useNavigate()
  const [groups, setGroups] = useState<LoadBidGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionMsg, setActionMsg] = useState('')
  const [acceptingId, setAcceptingId] = useState<number | null>(null)

  const loadAll = useCallback(async () => {
    setError('')
    const loads = normalizeArray<Load>(await getLoads())
    const activeLoads = loads.filter((l) => l.status === 'Active')
    const withBids = await Promise.all(
      activeLoads.map(async (load) => ({
        load,
        bids: normalizeArray<Bid>(await getBidsForLoad(load.id)),
      }))
    )
    setGroups(withBids.filter((g) => g.bids.length > 0))
  }, [])

  useEffect(() => {
    loadAll()
      .catch((e: { uiMessage?: string }) => setError(e.uiMessage ?? 'Teklifler yüklenemedi.'))
      .finally(() => setLoading(false))
  }, [loadAll])

  const pendingCount = useMemo(
    () => groups.reduce((n, g) => n + g.bids.filter((b) => b.status === 'Pending').length, 0),
    [groups]
  )

  async function onAccept(bid: Bid, load: Load) {
    if (load.status !== 'Active' || bid.status !== 'Pending') return
    if (
      !window.confirm(
        `${formatCurrencyTRY(bid.amount)} tutarlı teklifi kabul etmek istiyor musunuz? Ödeme güvenli havuzda blokede edilir.`
      )
    ) {
      return
    }
    setAcceptingId(bid.id)
    setActionMsg('')
    setError('')
    try {
      await acceptBid(bid.id)
      setActionMsg('Teklif kabul edildi. İlan detayına yönlendirilebilirsiniz.')
      await loadAll()
      navigate(`/customer/loads/${load.id}`)
    } catch (e: unknown) {
      setError((e as { uiMessage?: string }).uiMessage ?? 'Teklif kabul işlemi başarısız.')
    } finally {
      setAcceptingId(null)
    }
  }

  if (loading) return <PageSkeleton rows={6} variant="card" />

  return (
    <div className="page-wrap">
      <div className="page-head">
        <div>
          <h1 className="page-title">Teklifler</h1>
          <p className="page-sub">
            İlanlarınıza gelen teklifler
            {pendingCount > 0 ? ` · ${pendingCount} beklemede` : ''}
          </p>
        </div>
        <Link className="btn btn-ghost" to="/customer/loads">
          İlanlarım
        </Link>
      </div>

      {error ? <PageError message={error} onRetry={() => void loadAll()} /> : null}
      {actionMsg ? (
        <div className="card muted" style={{ padding: 12 }}>
          {actionMsg}
        </div>
      ) : null}

      {groups.length === 0 ? (
        <PageEmpty
          icon="💼"
          title="Henüz teklif yok"
          description="Aktif ilanlarınıza şoför teklifi geldiğinde burada listelenir."
          actionLabel="İlanlarım"
          onAction={() => navigate('/customer/loads')}
        />
      ) : (
        <div className="list-grid" style={{ gap: 20 }}>
          {groups.map(({ load, bids }) => (
            <section key={load.id} className="card" style={{ padding: 16 }}>
              <div className="item-row" style={{ marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <h2 style={{ fontSize: 16, margin: 0 }}>
                    {load.fromCity} → {load.toCity}
                  </h2>
                  <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                    Liste fiyatı: {formatCurrencyTRY(load.price)} · {bids.length} teklif
                  </p>
                </div>
                <Link className="btn btn-ghost btn-sm" to={`/customer/loads/${load.id}`}>
                  İlan detayı
                </Link>
              </div>
              <div className="list-grid" style={{ gap: 10 }}>
                {bids.map((bid) => (
                  <div key={bid.id} className="item-card" style={{ padding: 14 }}>
                    <div className="item-row">
                      <strong>{bid.driverFullName}</strong>
                      <strong>{formatCurrencyTRY(bid.amount)}</strong>
                    </div>
                    <div className="item-row" style={{ marginTop: 8, flexWrap: 'wrap', gap: 8 }}>
                      <span className="muted" style={{ fontSize: 13 }}>
                        {formatDateTR(bid.offerDate)}
                        {bid.note ? ` · ${bid.note}` : ''}
                      </span>
                      <span className={`badge ${bid.status === 'Pending' ? 'badge-warning' : 'badge-muted'}`}>
                        {formatBidStatusLabel(bid.status)}
                      </span>
                    </div>
                    {bid.status === 'Pending' && load.status === 'Active' ? (
                      <div className="item-row" style={{ marginTop: 10 }}>
                        <span className="muted" style={{ fontSize: 12 }}>
                          Puan: —
                        </span>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          disabled={acceptingId === bid.id}
                          onClick={() => void onAccept(bid, load)}
                        >
                          {acceptingId === bid.id ? 'Kabul ediliyor…' : 'Kabul Et'}
                        </button>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
