import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { updateLocation } from '../../api/location'
import { deliverLoad, getActiveLoads, getLoad, pickupLoad } from '../../api/loads'
import type { Load, LoadStatus } from '../../api/types'
import LiveMap from '../../components/map/LiveMap'
import type { MapMarker } from '../../components/map/mapTypes'
import { isValidCoordinate } from '../../components/map/mapUtils'
import { PageSkeleton } from '../../components/common/PageStates'
import { resolveCoordinates } from '../../data/tr-location'
import { formatDateTR, formatTimeTR, normalizeArray } from '../../utils/format'
import '../shared/Page.css'

const STEP_LABELS = ['Yola çık', 'Yükle', 'Yolda', 'Teslim'] as const

const STATUS_STEP: Record<LoadStatus, number> = {
  Active: 0,
  Assigned: 1,
  OnWay: 2,
  Arrived: 3,
  Delivered: 4,
  Cancelled: -1,
}

const DRIVER_TRIP_STATUSES: LoadStatus[] = ['Assigned', 'OnWay', 'Arrived']

function isDriverTripStatus(status: LoadStatus): boolean {
  return DRIVER_TRIP_STATUSES.includes(status)
}

export default function DriverActiveLoadPage() {
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('Konum paylaşımı kapalı.')
  const [sharing, setSharing] = useState(false)
  const [activeLoad, setActiveLoad] = useState<Load | null>(null)
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null)
  const [qrToken, setQrToken] = useState('')
  const [deliverMsg, setDeliverMsg] = useState('')
  const watchTimerRef = useRef<number | null>(null)

  const fetchActiveLoad = useCallback(async () => {
    const rows = normalizeArray<Load>(await getActiveLoads())
    const current = rows.find((row) => isDriverTripStatus(row.status)) ?? null
    setActiveLoad(current)
    return current
  }, [])

  const refreshTrip = useCallback(async (loadId: string) => {
    const updated = await getLoad(loadId)
    if (isDriverTripStatus(updated.status) || updated.status === 'Delivered') {
      setActiveLoad(updated)
      if (updated.status === 'Delivered') setSharing(false)
    } else {
      setActiveLoad(null)
    }
    return updated
  }, [])

  useEffect(() => {
    fetchActiveLoad().finally(() => setLoading(false))
  }, [fetchActiveLoad])

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

  const canPickup = activeLoad?.status === 'Assigned'
  const canDeliver = activeLoad?.status === 'OnWay' || activeLoad?.status === 'Arrived'
  const isDelivered = activeLoad?.status === 'Delivered'

  const origin = useMemo(() => {
    if (!activeLoad) return null
    return resolveCoordinates(activeLoad.fromCity, activeLoad.fromDistrict)
  }, [activeLoad])

  const mapMarkers = useMemo((): MapMarker[] => {
    if (!activeLoad) return []
    const list: MapMarker[] = []
    if (origin && isValidCoordinate(origin.latitude, origin.longitude)) {
      list.push({
        id: 'origin',
        kind: 'origin',
        latitude: origin.latitude,
        longitude: origin.longitude,
        title: `Kalkış · ${activeLoad.fromCity}`,
      })
    }
    if (isValidCoordinate(activeLoad.destinationLat, activeLoad.destinationLng)) {
      list.push({
        id: 'destination',
        kind: 'destination',
        latitude: activeLoad.destinationLat,
        longitude: activeLoad.destinationLng,
        title: `Varış · ${activeLoad.toCity}`,
      })
    }
    if (coords && isValidCoordinate(coords.latitude, coords.longitude)) {
      list.push({
        id: 'driver',
        kind: 'driver',
        latitude: coords.latitude,
        longitude: coords.longitude,
        title: 'Konumunuz',
      })
    }
    return list
  }, [activeLoad, origin, coords])

  const canShowMap = mapMarkers.length > 0

  if (loading) return <PageSkeleton rows={3} variant="card" />
  const hasTrip = Boolean(activeLoad)

  return (
    <div className="page-wrap">
      <div className="page-head">
        <div>
          <h1 className="page-title">Aktif Seferim</h1>
          <p className="page-sub">Aktif seferde iken konum her 10 saniyede bir gönderilir.</p>
        </div>
      </div>
      {!hasTrip ? (
        <div className="card">
          <p>Şu an aktif seferiniz yok. Yük Panosu&apos;ndan iş bulabilirsiniz.</p>
          <Link to="/driver/loads" className="btn btn-primary" style={{ marginTop: 12 }}>
            Yük Panosu
          </Link>
        </div>
      ) : isDelivered ? (
        <div className="card" style={{ textAlign: 'center', padding: 24 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>Sefer tamamlandı</h2>
          <p className="muted">
            {activeLoad?.fromCity} → {activeLoad?.toCity} teslim edildi.
          </p>
          {deliverMsg ? <p className="muted" style={{ marginTop: 10 }}>{deliverMsg}</p> : null}
          <Link to="/driver/loads" className="btn btn-primary" style={{ marginTop: 16 }}>
            Yük Panosu
          </Link>
        </div>
      ) : (
        <>
          {canShowMap ? (
            <LiveMap markers={mapMarkers} height={280} />
          ) : (
            <div className="card muted" style={{ padding: 20, textAlign: 'center' }}>
              <p>
                Harita için güzergah bilgisi henüz hazır değil. Konum paylaşımını açınca konumunuz haritada
                görünür.
              </p>
            </div>
          )}

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

            <div style={{ marginTop: 12 }}>
              <label className="muted" style={{ display: 'block', marginBottom: 6, fontSize: 12 }}>
                Müşterinin teslimat QR kodunu girin (mobil uygulamadan)
              </label>
              <input
                className="form-input"
                type="text"
                placeholder="QR token"
                value={qrToken}
                onChange={(e) => setQrToken(e.target.value)}
                autoComplete="off"
              />
            </div>

            <div className="item-row" style={{ marginTop: 12, flexWrap: 'wrap', gap: 10 }}>
              <button
                type="button"
                className="btn btn-pickup-load"
                disabled={!canPickup || busy}
                onClick={async () => {
                  if (!activeLoad || !canPickup) return
                  setBusy(true)
                  setDeliverMsg('')
                  try {
                    await pickupLoad(activeLoad.id)
                    await refreshTrip(activeLoad.id)
                    setDeliverMsg('Yük alındı. Yola çıkabilirsiniz.')
                  } catch (e: unknown) {
                    setDeliverMsg(
                      (e as { uiMessage?: string }).uiMessage ?? 'Yükleme kaydı başarısız. Lütfen tekrar deneyin.'
                    )
                  } finally {
                    setBusy(false)
                  }
                }}
              >
                {busy && canPickup ? 'Kaydediliyor…' : 'Yükü Aldım'}
              </button>
              <button
                type="button"
                className="btn btn-deliver-load"
                disabled={!canDeliver || busy}
                onClick={async () => {
                  if (!activeLoad || !canDeliver) return
                  const token = qrToken.trim()
                  if (!token) {
                    setDeliverMsg('Geçerli müşteri QR kodu zorunludur.')
                    return
                  }
                  setBusy(true)
                  setDeliverMsg('')
                  try {
                    await deliverLoad(activeLoad.id, {
                      qrToken: token,
                      targetLat: activeLoad.destinationLat,
                      targetLng: activeLoad.destinationLng,
                    })
                    await refreshTrip(activeLoad.id)
                    setDeliverMsg('Yük teslim edildi.')
                    setQrToken('')
                    setSharing(false)
                  } catch (e: unknown) {
                    setDeliverMsg(
                      (e as { uiMessage?: string }).uiMessage ??
                        'Teslim başarısız. QR kodunu ve sefer durumunu kontrol edin.'
                    )
                  } finally {
                    setBusy(false)
                  }
                }}
              >
                {busy && canDeliver ? 'Kaydediliyor…' : 'Teslim Ettim'}
              </button>
            </div>
            {deliverMsg ? (
              <p className="muted" style={{ marginTop: 8 }}>
                {deliverMsg}
              </p>
            ) : null}
            <p className="muted" style={{ marginTop: 10 }}>
              {message}
            </p>
            {sharing && coords ? (
              <span className="badge badge-info" style={{ marginTop: 8, display: 'inline-block' }}>
                Konum haritada güncelleniyor
              </span>
            ) : null}
          </div>
        </>
      )}
    </div>
  )
}
