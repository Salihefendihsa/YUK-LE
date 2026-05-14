import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getLoad } from '../../api/loads'
import { acceptBid, getBidsForLoad } from '../../api/bids'
import { getDriverLocation } from '../../api/location'
import { submitRating } from '../../api/ratings'
import type { Bid, Load } from '../../api/types'
import { PageError, PageSkeleton } from '../../components/common/PageStates'
import LoadChatPanel from '../../components/chat/LoadChatPanel'
import DeliveryQrSection from '../../components/delivery/DeliveryQrSection'
import { formatCurrencyTRY, normalizeArray } from '../../utils/format'
import '../shared/Page.css'

export default function CustomerLoadDetailPage() {
  const { id = '' } = useParams()
  const [load, setLoad] = useState<Load | null>(null)
  const [bids, setBids] = useState<Bid[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionMsg, setActionMsg] = useState('')
  const [loc, setLoc] = useState<{ latitude?: number; longitude?: number } | null>(null)
  const [showRating, setShowRating] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [score, setScore] = useState(5)
  const [comment, setComment] = useState('')

  useEffect(() => {
    Promise.all([getLoad(id), getBidsForLoad(id)])
      .then(([loadData, bidData]) => {
        setLoad(loadData)
        setBids(normalizeArray<Bid>(bidData))
      })
      .catch((e: { uiMessage?: string }) => setError(e.uiMessage ?? 'İlan detayı yüklenemedi.'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!load || (load.status !== 'OnWay' && load.status !== 'Assigned')) return
    const timer = setInterval(() => {
      void getDriverLocation(id).then((x) => setLoc(x)).catch(() => null)
    }, 10000)
    return () => clearInterval(timer)
  }, [id, load])

  async function onAccept(bidId: number) {
    setActionMsg('')
    try {
      await acceptBid(bidId)
      setActionMsg('Teklif kabul edildi, yük durumu güncellendi.')
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
        <h1 className="page-title">İlan Detayı</h1>
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
            <span>{formatCurrencyTRY(load.price)}</span>
          </div>
          <div className="item-row" style={{ marginTop: 8 }}>
            <strong>Ağırlık</strong>
            <span>{load.weight} kg</span>
          </div>
          <p className="muted" style={{ marginTop: 8 }}>
            {load.description}
          </p>
          {loc ? <p className="muted">Canlı konum: {loc.latitude?.toFixed(5)}, {loc.longitude?.toFixed(5)}</p> : null}
          {(load.status === 'Assigned' || load.status === 'OnWay') ? (
            <div className="card" style={{ marginTop: 12, borderColor: '#f97316' }}>
              <h3>Teslimat QR</h3>
              <DeliveryQrSection loadId={id} />
            </div>
          ) : null}
          {load.driverId ? <button className="btn btn-secondary btn-sm" onClick={() => setShowChat((v) => !v)}>Şoförle Yaz</button> : null}
          {load.status === 'Delivered' ? <button className="btn btn-primary btn-sm" onClick={() => setShowRating(true)}>Teslimatı Puanla</button> : null}
        </div>
      ) : null}
      {showChat ? <LoadChatPanel loadId={id} /> : null}

      <div className="card">
        <h2 style={{ marginBottom: 12 }}>Gelen Teklifler</h2>
        <div className="list-grid">
          {bids.map((bid) => (
            <div key={bid.id} className="item-card">
              <div className="item-row">
                <strong>{bid.driverFullName}</strong>
                <strong>{formatCurrencyTRY(bid.amount)}</strong>
              </div>
              <div className="item-row" style={{ marginTop: 8 }}>
                <span className="muted">Puan: -</span>
                <button className="btn btn-primary btn-sm" onClick={() => onAccept(bid.id)}>
                  Teklifi Kabul Et
                </button>
              </div>
            </div>
          ))}
          {bids.length === 0 ? <p className="muted">Henüz teklif yok.</p> : null}
        </div>
      </div>
      {showRating ? (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h3>Teslimat Puanı</h3>
            <input className="form-input" type="number" min={1} max={5} value={score} onChange={(e) => setScore(Number(e.target.value))} />
            <textarea className="form-input" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Yorumunuz" />
            <div className="item-row">
              <button className="btn btn-ghost btn-sm" onClick={() => setShowRating(false)}>Kapat</button>
              <button className="btn btn-primary btn-sm" onClick={async () => {
                if (!load?.driverId) return
                await submitRating({ loadId: id, givenToUserId: load.driverId, score, comment })
                setShowRating(false)
                setActionMsg('Puanınız kaydedildi.')
              }}>Kaydet</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
