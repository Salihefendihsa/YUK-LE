import type { MapCoordinate, MapMarker } from './LiveMap.types';

const DEFAULT_CENTER: MapCoordinate = { latitude: 39.92, longitude: 32.85 };

export function isValidCoordinate(lat?: number | null, lng?: number | null): boolean {
  if (lat == null || lng == null) return false;
  if (Number.isNaN(lat) || Number.isNaN(lng)) return false;
  if (lat === 0 && lng === 0) return false;
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

export function filterValidMarkers(markers: MapMarker[]): MapMarker[] {
  return markers.filter((m) => isValidCoordinate(m.latitude, m.longitude));
}

export type MapRegion = MapCoordinate & {
  latitudeDelta: number;
  longitudeDelta: number;
};

/** react-native-maps bölgesi */
export function computeMapRegion(
  markers: MapMarker[],
  center?: MapCoordinate
): MapRegion {
  const valid = filterValidMarkers(markers);
  if (valid.length === 0) {
    const c = center ?? DEFAULT_CENTER;
    return { ...c, latitudeDelta: 0.35, longitudeDelta: 0.35 };
  }

  let minLat = valid[0].latitude;
  let maxLat = valid[0].latitude;
  let minLng = valid[0].longitude;
  let maxLng = valid[0].longitude;

  for (const m of valid) {
    minLat = Math.min(minLat, m.latitude);
    maxLat = Math.max(maxLat, m.latitude);
    minLng = Math.min(minLng, m.longitude);
    maxLng = Math.max(maxLng, m.longitude);
  }

  const latDelta = Math.max((maxLat - minLat) * 1.6, 0.02);
  const lngDelta = Math.max((maxLng - minLng) * 1.6, 0.02);

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: latDelta,
    longitudeDelta: lngDelta,
  };
}

export function computeCenter(markers: MapMarker[], fallback?: MapCoordinate): MapCoordinate {
  const valid = filterValidMarkers(markers);
  if (valid.length === 0) return fallback ?? DEFAULT_CENTER;
  const sum = valid.reduce(
    (acc, m) => ({ lat: acc.lat + m.latitude, lng: acc.lng + m.longitude }),
    { lat: 0, lng: 0 }
  );
  return {
    latitude: sum.lat / valid.length,
    longitude: sum.lng / valid.length,
  };
}
