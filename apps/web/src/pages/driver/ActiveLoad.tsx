import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { updateLocation } from '../../api/location'
import { deliverLoad, getActiveLoads, pickupLoad } from '../../api/loads'
import type { Load } from '../../api/types'
import { PageSkeleton } from '../../components/common/PageStates'
import { formatDateTR, formatTimeTR, normalizeArray } from '../../utils/format'
import '../shared/Page.css'

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

  if (loading) return <PageSkeleton rows={3} variant="card" />
  const hasActiveLoad = Boolean(activeLoad)
  const statusBadge = useMemo(() => (sharing ? 'Paylaşılıyor' : 'Kapalı'), [sharing])

  return (
    <div className="page-wrap">
      <h1 className="page-title">Aktif Seferim</h1>
      <p className="page-sub">Aktif seferde iken konum her 10 saniyede bir gönderilir.</p>
      {!hasActiveLoad ? (
        <div className="card">
          <p>Şu an aktif seferiniz yok. Yük Panosu'ndan iş bulabilirsiniz.</p>
          <Link to="/driver/loads" className="btn btn-primary" style={{ marginTop: 12 }}>
            Yük Panosu
          </Link>
        </div>
      ) : (
        <>
          <div className="card">
            <div className="item-row">
              <strong>Yük Bilgileri</strong>
              <span className={`badge ${sharing ? 'badge-success' : 'badge-muted'}`}>{statusBadge}</span>
            </div>
            <p className="muted">{activeLoad?.fromCity} → {activeLoad?.toCity}</p>
            <p className="muted">Müşteri: {activeLoad?.ownerFullName}</p>
            <p className="muted">Ağırlık: {activeLoad?.weight} kg</p>
            <div className="item-row" style={{ marginTop: 12 }}>
              <button className="btn btn-primary" onClick={() => setSharing((s) => !s)}>
                {sharing ? 'Paylaşımı Durdur' : 'Paylaşımı Başlat'}
              </button>
              <button className="btn btn-ghost" onClick={async () => { if (activeLoad) await pickupLoad(activeLoad.id) }}>
                Yükü Teslim Aldım
              </button>
              <button className="btn btn-secondary" onClick={async () => {
                if (!activeLoad) return
                await deliverLoad(activeLoad.id, { qrToken: 'manual-delivery', targetLat: activeLoad.destinationLat, targetLng: activeLoad.destinationLng })
              }}>
                Teslim Ettim
              </button>
            </div>
            <p className="muted" style={{ marginTop: 10 }}>{message}</p>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <h3>Canlı Konum</h3>
            <p style={{ fontSize: 28, fontWeight: 700, marginTop: 10 }}>
              {coords ? `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}` : 'Konum bekleniyor'}
            </p>
            {coords ? <span className="badge badge-info" style={{ marginTop: 8 }}>🔵 Mavi Nokta (sürücü konumu)</span> : null}
          </div>
        </>
      )}
    </div>
  )
}
