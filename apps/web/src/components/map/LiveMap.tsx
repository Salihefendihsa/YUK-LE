import { useEffect, useRef } from 'react'
import type { LayerGroup, Map as LeafletMap } from 'leaflet'
import type { MapCoordinate, MapMarker } from './mapTypes'
import { computeCenter, filterValidMarkers, isValidCoordinate } from './mapUtils'
import './LiveMap.css'

const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const TILE_ATTRIBUTION = '© OpenStreetMap'

function markerFill(kind: MapMarker['kind']): string {
  switch (kind) {
    case 'driver':
      return 'var(--color-brand, #c9a227)'
    case 'destination':
      return '#22c55e'
    case 'origin':
      return '#3b82f6'
    default:
      return '#94a3b8'
  }
}

type LiveMapProps = {
  markers: MapMarker[]
  center?: MapCoordinate
  height?: number
  className?: string
}

export default function LiveMap({ markers, center, height = 360, className }: LiveMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const layerRef = useRef<LayerGroup | null>(null)

  useEffect(() => {
    let disposed = false

    const init = async () => {
      const L = await import('leaflet')
      await import('leaflet/dist/leaflet.css')

      if (disposed || !containerRef.current || mapRef.current) return

      const valid = filterValidMarkers(markers)
      const initial = computeCenter(valid, center)
      mapRef.current = L.map(containerRef.current, {
        zoomControl: true,
        attributionControl: true,
      }).setView([initial.latitude, initial.longitude], valid.length > 1 ? 10 : 12)

      L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: 19 }).addTo(mapRef.current)
      layerRef.current = L.layerGroup().addTo(mapRef.current)
    }

    void init()

    return () => {
      disposed = true
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        layerRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount only
  }, [])

  useEffect(() => {
    const update = async () => {
      const L = await import('leaflet')
      const map = mapRef.current
      const layer = layerRef.current
      if (!map || !layer) return

      layer.clearLayers()
      const valid = filterValidMarkers(markers)

      for (const m of valid) {
        L.circleMarker([m.latitude, m.longitude], {
          radius: 9,
          color: '#050608',
          weight: 2,
          fillColor: markerFill(m.kind),
          fillOpacity: 0.95,
        })
          .bindTooltip(m.title ?? 'Konum', { permanent: false })
          .addTo(layer)
      }

      if (valid.length === 1) {
        map.setView([valid[0].latitude, valid[0].longitude], 13)
      } else if (valid.length > 1) {
        const bounds = L.latLngBounds(valid.map((m) => [m.latitude, m.longitude] as [number, number]))
        map.fitBounds(bounds.pad(0.2))
      } else if (center && isValidCoordinate(center.latitude, center.longitude)) {
        map.setView([center.latitude, center.longitude], 11)
      }
    }

    void update()
  }, [markers, center])

  return (
    <div
      className={`live-map-wrap ${className ?? ''}`}
      style={{ height }}
      ref={containerRef}
      aria-label="Canlı harita"
    />
  )
}
