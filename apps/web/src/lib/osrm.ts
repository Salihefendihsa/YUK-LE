import type { MapCoordinate } from '../components/map/mapTypes'

const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving'

/**
 * OSRM (ücretsiz, anahtarsız) ile gerçek karayolu güzergahını çeker.
 * Dönen geometri noktaları {latitude, longitude} dizisi olarak verilir.
 * Hata / erişilemez / boş yanıt → null (çağıran taraf düz çizgi fallback uygular).
 * Canlı trafik KAPSAM DIŞI — yalnız rota geometrisi.
 */
export async function fetchDrivingRoute(
  origin: MapCoordinate,
  destination: MapCoordinate,
  signal?: AbortSignal,
): Promise<MapCoordinate[] | null> {
  try {
    const url =
      `${OSRM_BASE}/${origin.longitude},${origin.latitude};` +
      `${destination.longitude},${destination.latitude}?overview=full&geometries=geojson`
    const res = await fetch(url, { signal })
    if (!res.ok) return null
    const data = (await res.json()) as {
      code?: string
      routes?: Array<{ geometry?: { coordinates?: [number, number][] } }>
    }
    if (data.code !== 'Ok') return null
    const coords = data.routes?.[0]?.geometry?.coordinates
    if (!Array.isArray(coords) || coords.length < 2) return null
    // GeoJSON [lon, lat] → {latitude, longitude}
    return coords.map(([lon, lat]) => ({ latitude: lat, longitude: lon }))
  } catch {
    return null
  }
}
