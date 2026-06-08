import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { cancelLoad, getLoad } from '../../api/loads'
import { acceptBid, getBidsForLoad } from '../../api/bids'
import { getDriverLocation, type DriverLocationInfo } from '../../api/location'
import { submitRating } from '../../api/ratings'
import type { Bid, Load, LoadStatus } from '../../api/types'
import { PageError, PageSkeleton } from '../../components/common/PageStates'
import LoadChatPanel from '../../components/chat/LoadChatPanel'
import DeliveryQrSection from '../../components/delivery/DeliveryQrSection'
import EscrowCard from '../../components/payment/EscrowCard'
import { formatCurrencyTRY, normalizeArray } from '../../utils/format'
import '../shared/Page.css'

const FLOW: LoadStatus[] = ['Active', 'Assigned', 'OnWay', 'Arrived', 'Delivered']

const STATUS_LABEL: Record<string, string> = {
  Active: 'Yayında',
  Assigned: 'Şoför Atandı',
  OnWay: 'Yolda',
  Arrived: 'Varıldı',
  Delivered: 'Teslim Edildi',
  Cancelled: 'İptal edildi',
}

export default function CustomerLoadDetailPage() {
  const { id = '' } = useParams()
  const [load, setLoad] = useState<Load | null>(null)
  const [bids, setBids] = useState<Bid[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionMsg, setActionMsg] = useState('')
  const [loc, setLoc] = useState<DriverLocationInfo | null>(null)
  const [showRating, setShowRating] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [score, setScore] = useState(5)
  const [comment, setComment] = useState('')
  const [cancelling, setCancelling] = useState(false)

  const refreshDetail = useCallback(async () => {
    const [loadData, bidData] = await Promise.all([getLoad(id), getBidsForLoad(id)])
    setLoad(loadData)
    setBids(normalizeArray<Bid>(bidData))
  }, [id])

  useEffect(() => {
    refreshDetail()
      .catch((e: { uiMessage?: string }) => setError(e.uiMessage ?? 'İlan detayı yüklenemedi.'))
      .finally(() => setLoading(false))
  }, [refreshDetail])

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

  const canCancel = useMemo(
    () => load?.status === 'Active' && !bids.some((b) => b.status === 'Accepted'),
    [load, bids]
  )

  async function onAccept(bidId: number) {
    setActionMsg('')
    setError('')
    try {
      await acceptBid(bidId)
      setActionMsg('Teklif kabul edildi, yük durumu güncellendi.')
      await refreshDetail()
    } catch (e: unknown) {
      setError((e as { uiMessage?: string }).uiMessage ?? 'Teklif kabul işlemi başarısız.')
    }
  }

  async function onCancelLoad() {
    if (!load || !canCancel) return
    if (!window.confirm('İlanı iptal etmek istediğinize emin misiniz?')) return
    setCancelling(true)
    setError('')
    setActionMsg('')
    try {
      const res = await cancelLoad(load.id)
      setActionMsg(res.message || 'İlan iptal edildi.')
      await refreshDetail()
    } catch (e: unknown) {
      setError((e as { uiMessage?: string }).uiMessage ?? 'İlan iptal edilemedi.')
    } finally {
      setCancelling(false)
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
            {loc?.lastKnownLatitude != null && loc.lastKnownLongitude != null ? (
              <p className="muted" style={{ marginTop: 8 }}>
                Şoför konumu paylaşıldı
                {loc.lastLocationUpdate ? ` · son güncelleme ${new Date(loc.lastLocationUpdate).toLocaleString('tr-TR')}` : ''}
              </p>
            ) : null}
            <div className="panel-timeline" style={{ marginTop: 16 }} aria-label="Kargo takip adımları">
              {timeline.map((t, i) => (
                <Fragment key={t.key}>
                  <div className={`panel-timeline-step ${t.state}`}>
                    <div className="panel-timeline-icon" aria-hidden="true">
                      {t.state === 'done' ? (
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path
                            d="M16.5 5.5L8.5 13.5L3.5 8.5"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      ) : null}
                    </div>
                    <div className="panel-timeline-label">{t.label}</div>
                  </div>
                  {i < timeline.length - 1 ? (
                    <div
                      className={`panel-timeline-connector ${t.state === 'done' ? 'done' : ''}`}
                      aria-hidden="true"
                    />
                  ) : null}
                </Fragment>
              ))}
            </div>
            {load.status === 'Assigned' || load.status === 'OnWay' ? (
              <div className="panel-qr-wrap" style={{ marginTop: 16 }}>
                <h3 style={{ fontSize: 15, marginBottom: 8 }}>Teslimat QR</h3>
                <DeliveryQrSection loadId={id} />
              </div>
            ) : null}
            <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {canCancel ? (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={cancelling}
                  onClick={() => void onCancelLoad()}
                >
                  {cancelling ? 'İptal ediliyor…' : 'İlanı İptal Et'}
                </button>
              ) : null}
              {load.driverId ? (
                <button type="button" className="btn btn-sm btn-chat-glow" onClick={() => setShowChat((v) => !v)}>
                  {showChat ? 'Sohbeti Gizle' : 'Şoförle Sohbet'}
                </button>
              ) : null}
              {load.status === 'Delivered' ? (
                <button type="button" className="btn btn-primary btn-sm" onClick={() => { setError(''); setShowRating(true) }}>
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
                    {load.status === 'Active' && bid.status === 'Pending' ? (
                      <button type="button" className="btn btn-primary btn-sm" onClick={() => void onAccept(bid.id)}>
                        Teklifi Kabul Et
                      </button>
                    ) : (
                      <span className="muted" style={{ fontSize: 12 }}>
                        {bid.status === 'Accepted' ? 'Kabul edildi' : '—'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {bids.length === 0 ? <p className="muted">Henüz teklif yok.</p> : null}
            </div>
          </div>
        </div>
      ) : null}

      {load && load.status !== 'Cancelled' ? (
        <EscrowCard loadId={id} loadStatus={load.status} view="customer" />
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
                  setError('')
                  try {
                    await submitRating({ loadId: id, givenToUserId: load.driverId, score, comment })
                    setShowRating(false)
                    setActionMsg('Puanınız kaydedildi.')
                  } catch (e: unknown) {
                    setError((e as { uiMessage?: string }).uiMessage ?? 'Puan kaydedilemedi.')
                  }
                }}
              >
                Kaydet
              </button>
            </div>
            {error ? <p className="danger" style={{ marginTop: 8, fontSize: 13 }}>{error}</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
