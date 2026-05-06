import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getLoad } from '../../api/loads'
import { acceptBid, getBidsForLoad } from '../../api/bids'
import type { Bid, Load } from '../../api/types'
import { PageError, PageSkeleton } from '../../components/common/PageStates'
import '../shared/Page.css'

export default function CustomerLoadDetailPage() {
  const { id = '' } = useParams()
  const [load, setLoad] = useState<Load | null>(null)
  const [bids, setBids] = useState<Bid[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionMsg, setActionMsg] = useState('')

  useEffect(() => {
    Promise.all([getLoad(id), getBidsForLoad(id)])
      .then(([loadData, bidData]) => {
        setLoad(loadData)
        setBids(bidData)
      })
      .catch((e: { uiMessage?: string }) => setError(e.uiMessage ?? 'Ilan detayi yuklenemedi.'))
      .finally(() => setLoading(false))
  }, [id])

  async function onAccept(bidId: number) {
    setActionMsg('')
    try {
      await acceptBid(bidId)
      setActionMsg('Teklif kabul edildi, yuk durumu guncellendi.')
      const refreshed = await getBidsForLoad(id)
      setBids(refreshed)
    } catch (e: unknown) {
      setError((e as { uiMessage?: string }).uiMessage ?? 'Teklif kabul islemi basarisiz.')
    }
  }

  if (loading) return <PageSkeleton rows={6} />

  return (
    <div className="page-wrap">
      <div>
        <h1 className="page-title">Ilan Detayi</h1>
        <p className="page-sub">
          {load ? `${load.fromCity} → ${load.toCity}` : ''}
        </p>
      </div>
      {error ? <PageError message={error} /> : null}
      {actionMsg ? <div className="card muted">{actionMsg}</div> : null}

      {load ? (
        <div className="card">
          <div className="item-row">
            <strong>Fiyat</strong>
            <span>₺{load.price.toLocaleString('tr-TR')}</span>
          </div>
          <div className="item-row" style={{ marginTop: 8 }}>
            <strong>Agirlik</strong>
            <span>{load.weight} kg</span>
          </div>
          <p className="muted" style={{ marginTop: 8 }}>
            {load.description}
          </p>
        </div>
      ) : null}

      <div className="card">
        <h2 style={{ marginBottom: 12 }}>Gelen Teklifler</h2>
        <div className="list-grid">
          {bids.map((bid) => (
            <div key={bid.id} className="item-card">
              <div className="item-row">
                <strong>{bid.driverFullName}</strong>
                <strong>₺{bid.amount.toLocaleString('tr-TR')}</strong>
              </div>
              <div className="item-row" style={{ marginTop: 8 }}>
                <span className="muted">Puan: -</span>
                <button className="btn btn-primary btn-sm" onClick={() => onAccept(bid.id)}>
                  Teklifi Kabul Et
                </button>
              </div>
            </div>
          ))}
          {bids.length === 0 ? <p className="muted">Henuz teklif yok.</p> : null}
        </div>
      </div>
    </div>
  )
}
