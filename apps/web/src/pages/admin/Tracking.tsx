import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getAdminActiveDrivers, type AdminActiveDriverRow } from '../../api/admin'
import LiveMap from '../../components/map/LiveMap'
import type { MapMarker } from '../../components/map/mapTypes'
import { isValidCoordinate } from '../../components/map/mapUtils'
import { PageEmpty, PageError, PageSkeleton } from '../../components/common/PageStates'
import { formatDateTime } from '../../utils/formatters'
import './AdminPanel.css'

const POLL_MS = 20_000

function hasDriverLocation(row: AdminActiveDriverRow): boolean {
  return isValidCoordinate(row.lastKnownLat, row.lastKnownLng)
}

export default function AdminTrackingPage() {
  const [rows, setRows] = useState<AdminActiveDriverRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const mounted = useRef(true)

  const fetchData = useCallback(async () => {
    try {
      setError('')
      setRows(await getAdminActiveDrivers())
    } catch (e: unknown) {
      setError((e as { uiMessage?: string }).uiMessage ?? 'Aktif şoförler yüklenemedi.')
      setRows([])
    }
  }, [])

  useEffect(() => {
    mounted.current = true
    fetchData().finally(() => {
      if (mounted.current) setLoading(false)
    })
    const timer = window.setInterval(() => {
      void fetchData()
    }, POLL_MS)
    return () => {
      mounted.current = false
      window.clearInterval(timer)
    }
  }, [fetchData])

  const mapMarkers = useMemo((): MapMarker[] => {
    return rows
      .filter((r) => hasDriverLocation(r))
      .map((r) => ({
        id: `${r.loadId}-${r.driverId}`,
        latitude: r.lastKnownLat!,
        longitude: r.lastKnownLng!,
        title: r.driverName,
        kind: 'driver' as const,
      }))
  }, [rows])

  if (loading) return <PageSkeleton rows={5} variant="card" />

  return (
    <div className="admin-page">
      <div className="admin-head">
        <div>
          <h1 className="admin-title">Canlı Şoför Konum Takibi</h1>
          <p className="admin-sub">Aktif seferler harita ve listede periyodik güncellenir (yaklaşık 20 sn).</p>
        </div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => void fetchData()}>
          Yenile
        </button>
      </div>

      {error ? <PageError message={error} onRetry={() => void fetchData()} /> : null}

      {rows.length === 0 && !error ? (
        <PageEmpty
          icon="📍"
          title="Aktif sefer / konum yok"
          description="Atanmış, yolda veya varış aşamasındaki ilan gerekir."
          actionLabel="Yenile"
          onAction={() => void fetchData()}
        />
      ) : (
        <div className="admin-grid-2">
          <div className="admin-card">
            <h3 style={{ marginBottom: 12 }}>Harita</h3>
            {mapMarkers.length > 0 ? (
              <LiveMap markers={mapMarkers} height={320} />
            ) : (
              <p className="muted" style={{ padding: '12px 0' }}>
                Aktif sefer var ancak haritada gösterilecek konum henüz yok. Şoför konum paylaşımı
                başladığında burada görünür.
              </p>
            )}
          </div>

          <div className="admin-card">
            <h3 style={{ marginBottom: 12 }}>Aktif seferler ({rows.length})</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 400, overflowY: 'auto' }}>
              {rows.map((item) => {
                const hasLoc = hasDriverLocation(item)
                return (
                  <div
                    key={`${item.loadId}-${item.driverId}`}
                    style={{
                      padding: 12,
                      borderRadius: 10,
                      border: '1px solid var(--color-border-light)',
                      background: 'var(--color-surface-elevated, rgba(255,255,255,0.03))',
                    }}
                  >
                    <div className="item-row" style={{ marginBottom: 6 }}>
                      <strong>{item.driverName}</strong>
                      <span className={`badge ${hasLoc ? 'badge-success' : 'badge-muted'}`}>
                        {hasLoc ? 'Konum var' : 'Konum yok'}
                      </span>
                    </div>
                    <p className="muted" style={{ fontSize: 13, margin: 0 }}>
                      {item.route}
                    </p>
                    <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                      Plaka: {item.plate || '—'}
                    </p>
                    <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                      Son güncelleme:{' '}
                      {item.lastLocationUpdate ? formatDateTime(item.lastLocationUpdate) : '—'}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
