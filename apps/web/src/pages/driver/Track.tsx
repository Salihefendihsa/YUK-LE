import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getLoads } from '../../api/loads'
import type { Load, LoadStatus } from '../../api/types'
import LiveMap from '../../components/map/LiveMap'
import type { MapMarker } from '../../components/map/mapTypes'
import { isValidCoordinate } from '../../components/map/mapUtils'
import { PageEmpty, PageError, PageSkeleton } from '../../components/common/PageStates'
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

export default function DriverTrackPage() {
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
      .catch((e: { uiMessage?: string }) => setError(e.uiMessage ?? 'Seferler yüklenemedi.'))
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

  // Şoför kendi canlı konum noktasını mevcut uçlardan okuyamaz
  // (GET /Location/driver/{loadId} yalnız Customer,Admin). Bu yüzden aktif
  // seferin güzergahı (kalkış + varış) gösterilir — müşteri Leaflet bileşeni yeniden kullanılır.
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
    return list
  }, [activeLoad, origin])

  if (loading) return <PageSkeleton rows={5} />

  return (
    <div className="page-wrap">
      <div>
        <h1 className="page-title">Canlı Takip</h1>
        <p className="page-sub">Aktif seferinizin güzergahını harita üzerinde görün.</p>
      </div>

      {error ? <PageError message={error} onRetry={() => void loadAll()} /> : null}

      {!activeLoad ? (
        <PageEmpty
          icon="🗺️"
          title="Aktif sefer yok"
          description="Atanmış, yolda veya varış aşamasındaki bir seferiniz olduğunda güzergah burada görünür."
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
            <Link
              to={`/driver/loads/${activeLoad.id}`}
              className="btn btn-ghost btn-sm"
              style={{ marginTop: 12, display: 'inline-block' }}
            >
              İlan detayına git
            </Link>
          </div>

          {markers.length > 0 ? (
            <LiveMap markers={markers} height={400} />
          ) : (
            <div className="card muted" style={{ padding: 24, textAlign: 'center' }}>
              Güzergah için konum bilgisi bekleniyor.
            </div>
          )}
        </>
      )}
    </div>
  )
}
