import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getLoads } from '../../api/loads'
import type { Load, LoadStatus } from '../../api/types'
import LiveMap from '../../components/map/LiveMap'
import type { MapMarker } from '../../components/map/mapTypes'
import { isValidCoordinate } from '../../components/map/mapUtils'
import { PageEmpty, PageError, PageSkeleton } from '../../components/common/PageStates'
import { useCustomerDriverLocation } from '../../hooks/useCustomerDriverLocation'
import { resolveCoordinates } from '../../data/tr-location'
import { normalizeArray } from '../../utils/format'
import '../shared/Page.css'

const TRACKABLE: LoadStatus[] = ['Assigned', 'OnWay', 'Arrived']
const PICK_ORDER: LoadStatus[] = ['OnWay', 'Arrived', 'Assigned']

const STATUS_LABEL: Record<string, string> = {
  Assigned: 'Şoför atandı',
  OnWay: 'Yolda',
  Arrived: 'Varış',
}

function pickTrackableLoad(loads: Load[]): Load | null {
  for (const status of PICK_ORDER) {
    const found = loads.find((l) => l.status === status && l.driverId != null)
    if (found) return found
  }
  return null
}

export default function CustomerTrackPage() {
  const [loads, setLoads] = useState<Load[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadAll = useCallback(async () => {
    setError('')
    const data = normalizeArray<Load>(await getLoads())
    setLoads(data)
  }, [])

  useEffect(() => {
    loadAll()
      .catch((e: { uiMessage?: string }) => setError(e.uiMessage ?? 'İlanlar yüklenemedi.'))
      .finally(() => setLoading(false))
  }, [loadAll])

  const activeLoad = useMemo(() => {
    const trackable = loads.filter((l) => TRACKABLE.includes(l.status) && l.driverId != null)
    return pickTrackableLoad(trackable)
  }, [loads])

  const origin = useMemo(() => {
    if (!activeLoad) return null
    return resolveCoordinates(activeLoad.fromCity, activeLoad.fromDistrict)
  }, [activeLoad])

  const {
    shouldShow,
    hasCoords,
    driverLatitude,
    driverLongitude,
    driverName,
    summary,
  } = useCustomerDriverLocation({
    loadId: activeLoad?.id ?? '',
    status: activeLoad?.status,
    destinationLat: activeLoad?.destinationLat,
    destinationLng: activeLoad?.destinationLng,
  })

  const markers = useMemo((): MapMarker[] => {
    if (!activeLoad) return []
    const list: MapMarker[] = []
    if (origin && isValidCoordinate(origin.latitude, origin.longitude)) {
      list.push({
        id: 'origin',
        kind: 'origin',
        latitude: origin.latitude,
        longitude: origin.longitude,
        title: `${activeLoad.fromCity} (kalkış)`,
      })
    }
    if (isValidCoordinate(activeLoad.destinationLat, activeLoad.destinationLng)) {
      list.push({
        id: 'destination',
        kind: 'destination',
        latitude: activeLoad.destinationLat,
        longitude: activeLoad.destinationLng,
        title: `${activeLoad.toCity} (varış)`,
      })
    }
    if (hasCoords && driverLatitude != null && driverLongitude != null) {
      list.push({
        id: 'driver',
        kind: 'driver',
        latitude: driverLatitude,
        longitude: driverLongitude,
        title: driverName ? `Şoför: ${driverName}` : 'Şoför',
      })
    }
    return list
  }, [activeLoad, origin, hasCoords, driverLatitude, driverLongitude, driverName])

  if (loading) return <PageSkeleton rows={5} />

  return (
    <div className="page-wrap">
      <div>
        <h1 className="page-title">Canlı Takip</h1>
        <p className="page-sub">Aktif seferinizde şoför konumunu takip edin.</p>
      </div>

      {error ? <PageError message={error} onRetry={() => void loadAll()} /> : null}

      {!activeLoad ? (
        <PageEmpty
          icon="🗺️"
          title="Aktif sefer yok"
          description="Aktif sefer / konum yok. Atanmış, yolda veya varış aşamasındaki ilan gerekir."
          actionLabel="Yenile"
          onAction={() => {
            setLoading(true)
            void loadAll().finally(() => setLoading(false))
          }}
        />
      ) : (
        <>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="item-row">
              <strong>
                {activeLoad.fromCity} → {activeLoad.toCity}
              </strong>
              <span className="badge">{STATUS_LABEL[activeLoad.status] ?? activeLoad.status}</span>
            </div>
            {shouldShow && summary ? (
              <p className="muted" style={{ marginTop: 10 }}>
                {summary}
              </p>
            ) : null}
            <Link
              to={`/customer/loads/${activeLoad.id}`}
              className="btn btn-ghost btn-sm"
              style={{ marginTop: 12, display: 'inline-block' }}
            >
              İlan detayına git
            </Link>
          </div>

          {hasCoords || markers.some((m) => m.kind !== 'driver') ? (
            <LiveMap markers={markers} height={400} />
          ) : (
            <div className="card muted" style={{ padding: 24, textAlign: 'center' }}>
              Harita için şoför konumu bekleniyor. Konum paylaşıldığında burada görünecek.
            </div>
          )}
        </>
      )}
    </div>
  )
}
