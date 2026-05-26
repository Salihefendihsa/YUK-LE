import type { MapCoordinate, MapMarker } from './mapTypes'

const DEFAULT_CENTER: MapCoordinate = { latitude: 39.92, longitude: 32.85 }

export function isValidCoordinate(lat?: number | null, lng?: number | null): boolean {
  if (lat == null || lng == null) return false
  if (Number.isNaN(lat) || Number.isNaN(lng)) return false
  if (lat === 0 && lng === 0) return false
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
}

export function filterValidMarkers(markers: MapMarker[]): MapMarker[] {
  return markers.filter((m) => isValidCoordinate(m.latitude, m.longitude))
}

export function computeCenter(markers: MapMarker[], fallback?: MapCoordinate): MapCoordinate {
  const valid = filterValidMarkers(markers)
  if (valid.length === 0) return fallback ?? DEFAULT_CENTER
  const sum = valid.reduce(
    (acc, m) => ({ lat: acc.lat + m.latitude, lng: acc.lng + m.longitude }),
    { lat: 0, lng: 0 }
  )
  return {
    latitude: sum.lat / valid.length,
    longitude: sum.lng / valid.length,
  }
}
