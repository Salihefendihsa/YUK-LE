import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { updateLocation } from '../../api/location'
import { deliverLoad, getActiveLoads, pickupLoad } from '../../api/loads'
import type { Load, LoadStatus } from '../../api/types'
import { PageSkeleton } from '../../components/common/PageStates'
import { formatDateTR, formatTimeTR, normalizeArray } from '../../utils/format'
import '../shared/Page.css'

const STEP_LABELS = ['Yola çık', 'Yükle', 'Yolda', 'Teslim'] as const

const STATUS_STEP: Record<LoadStatus, number> = {
  Active: 0,
  Assigned: 1,
  OnWay: 2,
  Delivered: 4,
  Cancelled: -1,
}

export default function DriverActiveLoadPage() {
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('Konum paylaşımı kapalı.')
  const [sharing, setSharing] = useState(false)
  const [activeLoad, setActiveLoad] = useState<Load | null>(null)
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null)
  const watchTimerRef = useRef<number | null>(null)

  useEffect(() => {
    const load = async () => {
      const rows = normalizeArray<Load>(await getActiveLoads())
      const current = rows.find((row) => row.status === 'Assigned' || row.status === 'OnWay') ?? null
      setActiveLoad(current)
    }
    load().finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!sharing || !activeLoad) return
    if (!navigator.geolocation) {
      setMessage('Tarayıcı konum özelliğini desteklemiyor.')
      setSharing(false)
      return
    }

    const pushLocation = () => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const latitude = pos.coords.latitude
          const longitude = pos.coords.longitude
          setCoords({ latitude, longitude })
          await updateLocation({ latitude, longitude, loadId: activeLoad.id })
          setMessage(`Son konum: ${formatDateTR(new Date())} ${formatTimeTR(new Date())}`)
        },
        () => {
          setMessage('Konum izni verilmedi. Paylaşım durduruldu.')
          setSharing(false)
        },
        { enableHighAccuracy: true }
      )
    }

    pushLocation()
    const interval = window.setInterval(pushLocation, 10000)
    watchTimerRef.current = interval
    return () => {
      if (watchTimerRef.current) window.clearInterval(watchTimerRef.current)
      watchTimerRef.current = null
    }
  }, [sharing, activeLoad])

  const stepIdx = useMemo(() => {
    if (!activeLoad) return 0
    return STATUS_STEP[activeLoad.status] ?? 0
  }, [activeLoad])

  if (loading) return <PageSkeleton rows={3} variant="card" />
  const hasActiveLoad = Boolean(activeLoad)

  return (
    <div className="page-wrap">
      <div className="page-head">
        <div>
          <h1 className="page-title">Aktif Seferim</h1>
          <p className="page-sub">Aktif seferde iken konum her 10 saniyede bir gönderilir.</p>
        </div>
      </div>
      {!hasActiveLoad ? (
        <div className="card">
          <p>Şu an aktif seferiniz yok. Yük Panosu&apos;ndan iş bulabilirsiniz.</p>
          <Link to="/driver/loads" className="btn btn-primary" style={{ marginTop: 12 }}>
            Yük Panosu
          </Link>
        </div>
      ) : (
        <>
          <div className="card panel-map-placeholder" style={{ height: 160 }}>
            Güzergah haritası — {activeLoad?.fromCity} → {activeLoad?.toCity}
          </div>

          <div className="panel-trip-progress">
            {STEP_LABELS.map((label, i) => {
              const done = stepIdx > i
              const on = stepIdx === i
              return (
                <div key={label} className={`panel-trip-step ${done ? 'done' : ''} ${on ? 'on' : ''}`}>
                  {label}
                </div>
              )
            })}
          </div>

          <div className="card">
            <div className="item-row">
              <strong>Yük bilgileri</strong>
              <span className={`badge ${sharing ? 'badge-success' : 'badge-muted'}`}>
                {sharing ? 'Konum paylaşılıyor' : 'Konum kapalı'}
              </span>
            </div>
            <p className="muted">
              {activeLoad?.fromCity} → {activeLoad?.toCity}
            </p>
            <p className="muted">Müşteri: {activeLoad?.ownerFullName}</p>
            <p className="muted">Ağırlık: {activeLoad?.weight} kg</p>

            <div className="panel-location-toggle">
              <div>
                <strong>Konum paylaşımı</strong>
                <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                  Açıkken her 10 sn konum güncellenir
                </p>
              </div>
              <button type="button" className={`btn ${sharing ? 'btn-secondary' : 'btn-primary'}`} onClick={() => setSharing((s) => !s)}>
                {sharing ? 'Durdur' : 'Başlat'}
              </button>
            </div>

            <div className="item-row" style={{ marginTop: 12, flexWrap: 'wrap', gap: 10 }}>
              <button type="button" className="btn btn-pickup-load" onClick={async () => activeLoad && (await pickupLoad(activeLoad.id))}>
                Yükü Aldım
              </button>
              <button
                type="button"
                className="btn btn-deliver-load"
                onClick={async () => {
                  if (!activeLoad) return
                  await deliverLoad(activeLoad.id, {
                    qrToken: 'manual-delivery',
                    targetLat: activeLoad.destinationLat,
                    targetLng: activeLoad.destinationLng,
                  })
                }}
              >
                Teslim Ettim
              </button>
            </div>
            <p className="muted" style={{ marginTop: 10 }}>
              {message}
            </p>
          </div>

          <div className="card" style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: 15 }}>Canlı konum</h3>
            <p style={{ fontSize: 22, fontWeight: 700, marginTop: 10, fontFamily: 'var(--font-mono)' }}>
              {coords ? `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}` : 'Konum bekleniyor'}
            </p>
            {coords ? (
              <span className="badge badge-info" style={{ marginTop: 8 }}>
                🔵 Son gönderim
              </span>
            ) : null}
          </div>
        </>
      )}
    </div>
  )
}
