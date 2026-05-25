import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getLoad } from '../../api/loads'
import { acceptBid, getBidsForLoad } from '../../api/bids'
import { getDriverLocation } from '../../api/location'
import { submitRating } from '../../api/ratings'
import type { Bid, Load, LoadStatus } from '../../api/types'
import { PageError, PageSkeleton } from '../../components/common/PageStates'
import LoadChatPanel from '../../components/chat/LoadChatPanel'
import DeliveryQrSection from '../../components/delivery/DeliveryQrSection'
import { formatCurrencyTRY, normalizeArray } from '../../utils/format'
import '../shared/Page.css'

const FLOW: LoadStatus[] = ['Active', 'Assigned', 'OnWay', 'Delivered']

const STATUS_LABEL: Record<string, string> = {
  Active: 'Yayında',
  Assigned: 'Şoför atandı',
  OnWay: 'Yolda',
  Delivered: 'Teslim',
  Cancelled: 'İptal',
}

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

  const timeline = useMemo(() => {
    if (!load) return []
    if (load.status === 'Cancelled') {
      return [{ key: 'cancel', label: 'İptal edildi', state: 'current' as const }]
    }
    const idx = FLOW.indexOf(load.status)
    return FLOW.map((st, i) => ({
      key: st,
      label: STATUS_LABEL[st] ?? st,
      state: (i < idx ? 'done' : i === idx ? 'current' : 'pending') as 'done' | 'current' | 'pending',
    }))
  }, [load])

  async function onAccept(bidId: number) {
    setActionMsg('')
    try {
      await acceptBid(bidId)
      setActionMsg('Teklif kabul edildi, yük durumu güncellendi.')
      const refreshed = await getBidsForLoad(id)
      setBids(refreshed)
    } catch (e: unknown) {
      setError((e as { uiMessage?: string }).uiMessage ?? 'Teklif kabul işlemi başarısız.')
    }
  }

  if (loading) return <PageSkeleton rows={6} />

  return (
    <div className="page-wrap">
      <nav className="panel-breadcrumb">
        <Link to="/customer/dashboard">Panel</Link>
        <span className="sep">/</span>
        <Link to="/customer/loads">İlanlarım</Link>
        <span className="sep">/</span>
        <span>Detay</span>
      </nav>

      <div>
        <h1 className="page-title">İlan Detayı</h1>
        <p className="page-sub">{load ? `${load.fromCity} → ${load.toCity}` : ''}</p>
      </div>
      {error ? <PageError message={error} /> : null}
      {actionMsg ? (
        <div className="card muted" style={{ padding: 12 }}>
          {actionMsg}
        </div>
      ) : null}

      {load ? (
        <div className="panel-detail-grid">
          <div className="card">
            <h2 style={{ fontSize: 16, marginBottom: 12 }}>Yük bilgileri</h2>
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
            {loc ? (
              <p className="muted" style={{ marginTop: 8 }}>
                Canlı konum: {loc.latitude?.toFixed(5)}, {loc.longitude?.toFixed(5)}
              </p>
            ) : null}
            <div className="panel-timeline" style={{ marginTop: 16 }}>
              {timeline.map((t) => (
                <div
                  key={t.key}
                  className={`panel-timeline-step ${t.state === 'done' ? 'done' : ''} ${t.state === 'current' ? 'current' : ''}`}
                >
                  {t.label}
                </div>
              ))}
            </div>
            {load.status === 'Assigned' || load.status === 'OnWay' ? (
              <div className="panel-qr-wrap" style={{ marginTop: 16 }}>
                <h3 style={{ fontSize: 15, marginBottom: 8 }}>Teslimat QR</h3>
                <DeliveryQrSection loadId={id} />
              </div>
            ) : null}
            <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {load.driverId ? (
                <button type="button" className="btn btn-sm btn-chat-glow" onClick={() => setShowChat((v) => !v)}>
                  {showChat ? 'Sohbeti Gizle' : 'Şoförle Sohbet'}
                </button>
              ) : null}
              {load.status === 'Delivered' ? (
                <button type="button" className="btn btn-primary btn-sm" onClick={() => setShowRating(true)}>
                  Teslimatı Puanla
                </button>
              ) : null}
            </div>
          </div>

          <div className="card">
            <h2 style={{ fontSize: 16, marginBottom: 12 }}>Gelen teklifler</h2>
            <div className="list-grid">
              {bids.map((bid) => (
                <div key={bid.id} className="item-card" style={{ padding: 14 }}>
                  <div className="item-row">
                    <strong>{bid.driverFullName}</strong>
                    <strong>{formatCurrencyTRY(bid.amount)}</strong>
                  </div>
                  <div className="item-row" style={{ marginTop: 8 }}>
                    <span className="muted">Puan: —</span>
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => onAccept(bid.id)}>
                      Teklifi Kabul Et
                    </button>
                  </div>
                </div>
              ))}
              {bids.length === 0 ? <p className="muted">Henüz teklif yok.</p> : null}
            </div>
          </div>
        </div>
      ) : null}
      {showChat ? <LoadChatPanel loadId={id} /> : null}

      {showRating ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setShowRating(false)}>
          <div className="modal-card" role="dialog" aria-modal onClick={(e) => e.stopPropagation()}>
            <h3>Teslimat Puanı</h3>
            <input className="form-input" type="number" min={1} max={5} value={score} onChange={(e) => setScore(Number(e.target.value))} />
            <textarea className="form-input" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Yorumunuz" />
            <div className="item-row" style={{ marginTop: 12 }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowRating(false)}>
                Kapat
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={async () => {
                  if (!load?.driverId) return
                  await submitRating({ loadId: id, givenToUserId: load.driverId, score, comment })
                  setShowRating(false)
                  setActionMsg('Puanınız kaydedildi.')
                }}
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
