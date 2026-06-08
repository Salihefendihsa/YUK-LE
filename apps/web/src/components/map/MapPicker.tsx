import { useEffect, useRef } from 'react'
import type { Map as LeafletMap, Marker, LeafletMouseEvent } from 'leaflet'
import type { MapCoordinate } from './mapTypes'
import './MapPicker.css'

const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const TILE_ATTRIBUTION = '© OpenStreetMap'

type LeafletModule = typeof import('leaflet')

type MapPickerProps = {
  /** Seçili nokta (pin). Her zaman tanımlı — başlangıçta şehir merkezi fallback. */
  value: MapCoordinate
  /** Şehir merkezi; değişince (şehir/ilçe seçimi) harita buraya yeniden ortalanır. */
  center: MapCoordinate
  onChange: (c: MapCoordinate) => void
  kind?: 'origin' | 'destination'
  height?: number
  ariaLabel?: string
}

const round6 = (n: number) => Math.round(n * 1e6) / 1e6
const centerKey = (c: MapCoordinate) => `${c.latitude},${c.longitude}`

function pinColor(kind?: 'origin' | 'destination'): string {
  return kind === 'destination' ? '#22c55e' : '#3b82f6'
}

function makeIcon(L: LeafletModule, kind?: 'origin' | 'destination') {
  return L.divIcon({
    className: 'map-pin-icon',
    html: `<span class="map-pin" style="background:${pinColor(kind)}"></span>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })
}

/**
 * Leaflet/OSM tabanlı konum seçici: kullanıcı haritaya tıklayarak veya pin'i
 * sürükleyerek tam koordinatı belirler. Salt-gösterim `LiveMap`'ten ayrıdır —
 * orası her değişimde otomatik ortalanır (seçici için uygun değil).
 */
export default function MapPicker({
  value,
  center,
  onChange,
  kind,
  height = 240,
  ariaLabel,
}: MapPickerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const markerRef = useRef<Marker | null>(null)
  const onChangeRef = useRef(onChange)
  const prevCenterRef = useRef<string>('')
  onChangeRef.current = onChange

  useEffect(() => {
    let disposed = false

    const init = async () => {
      const L = await import('leaflet')
      await import('leaflet/dist/leaflet.css')
      if (disposed || !containerRef.current || mapRef.current) return

      const map = L.map(containerRef.current, {
        zoomControl: true,
        attributionControl: true,
      }).setView([value.latitude, value.longitude], 13)

      L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: 19 }).addTo(map)

      const marker = L.marker([value.latitude, value.longitude], {
        draggable: true,
        icon: makeIcon(L, kind),
      }).addTo(map)

      marker.on('dragend', () => {
        const ll = marker.getLatLng()
        onChangeRef.current({ latitude: round6(ll.lat), longitude: round6(ll.lng) })
      })
      map.on('click', (e: LeafletMouseEvent) => {
        marker.setLatLng(e.latlng)
        onChangeRef.current({ latitude: round6(e.latlng.lat), longitude: round6(e.latlng.lng) })
      })

      mapRef.current = map
      markerRef.current = marker
      prevCenterRef.current = centerKey(center)
    }

    void init()

    return () => {
      disposed = true
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        markerRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount only
  }, [])

  // Dışarıdan gelen value değişince marker'ı senkronla (şehir değişimi / programatik güncelleme).
  useEffect(() => {
    const marker = markerRef.current
    if (!marker) return
    const cur = marker.getLatLng()
    if (cur.lat !== value.latitude || cur.lng !== value.longitude) {
      marker.setLatLng([value.latitude, value.longitude])
    }
  }, [value.latitude, value.longitude])

  // Şehir merkezi değişince haritayı yeniden ortala (pin sürüklemesinde DEĞİL).
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const k = centerKey(center)
    if (k !== prevCenterRef.current) {
      prevCenterRef.current = k
      map.setView([center.latitude, center.longitude], 13)
    }
  }, [center.latitude, center.longitude])

  return (
    <div
      ref={containerRef}
      className="map-picker"
      style={{ height }}
      aria-label={ariaLabel ?? 'Konum seçici harita'}
    />
  )
}
