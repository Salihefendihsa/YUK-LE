import { useEffect, useRef } from 'react'
import type { LayerGroup, Map as LeafletMap } from 'leaflet'
import type { MapCoordinate, MapMarker } from './mapTypes'
import { computeCenter, filterValidMarkers, isValidCoordinate } from './mapUtils'
import './LiveMap.css'

const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const TILE_ATTRIBUTION = '© OpenStreetMap'

type LeafletModule = typeof import('leaflet')

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

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '"' ? '&quot;' : '&#39;',
  )
}

/**
 * Marker'ları çizer ve görünümü ayarlar. Hem init (ilk mount) hem update
 * effect'inden çağrılır — böylece marker'lar async import yarışına takılmadan
 * ilk render'da çizilir.
 */
function drawMarkers(
  L: LeafletModule,
  map: LeafletMap,
  layer: LayerGroup,
  markers: MapMarker[],
  center: MapCoordinate | undefined,
  focus: MapCoordinate | null | undefined,
) {
  layer.clearLayers()
  const valid = filterValidMarkers(markers)

  for (const m of valid) {
    const cm = L.circleMarker([m.latitude, m.longitude], {
      radius: 9,
      color: '#050608',
      weight: 2,
      fillColor: markerFill(m.kind),
      fillOpacity: 0.95,
    })
    const title = m.title ?? 'Konum'
    if (m.description) {
      cm.bindPopup(`<strong>${esc(title)}</strong><br/>${esc(m.description).replace(/\n/g, '<br/>')}`)
    } else {
      cm.bindTooltip(title, { permanent: false })
    }
    cm.addTo(layer)
  }

  // Odak önceliği: dışarıdan verilen focus → tek marker → tüm marker'lara fit → center.
  if (focus && isValidCoordinate(focus.latitude, focus.longitude)) {
    map.setView([focus.latitude, focus.longitude], 14)
  } else if (valid.length === 1) {
    map.setView([valid[0].latitude, valid[0].longitude], 13)
  } else if (valid.length > 1) {
    const bounds = L.latLngBounds(valid.map((m) => [m.latitude, m.longitude] as [number, number]))
    map.fitBounds(bounds.pad(0.2))
  } else if (center && isValidCoordinate(center.latitude, center.longitude)) {
    map.setView([center.latitude, center.longitude], 11)
  }
}

type LiveMapProps = {
  markers: MapMarker[]
  center?: MapCoordinate
  /** Belirli bir koordinata odakla (örn. listede şoföre tıklanınca). */
  focus?: MapCoordinate | null
  height?: number
  className?: string
}

export default function LiveMap({ markers, center, focus, height = 360, className }: LiveMapProps) {
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
      const map = L.map(containerRef.current, {
        zoomControl: true,
        attributionControl: true,
      }).setView([initial.latitude, initial.longitude], valid.length > 1 ? 10 : 12)

      L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: 19 }).addTo(map)
      const layer = L.layerGroup().addTo(map)
      mapRef.current = map
      layerRef.current = layer

      // İlk marker'ları HEMEN çiz — ayrı update effect'inin async yarışına bağlı kalma.
      drawMarkers(L, map, layer, markers, center, focus)
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
      drawMarkers(L, map, layer, markers, center, focus)
    }

    void update()
  }, [markers, center, focus])

  return (
    <div
      className={`live-map-wrap ${className ?? ''}`}
      style={{ height }}
      ref={containerRef}
      aria-label="Canlı harita"
    />
  )
}
