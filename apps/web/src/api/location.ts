import { apiClient } from './client'

export type DriverLocationInfo = {
  id: number
  fullName: string
  lastKnownLatitude: number | null
  lastKnownLongitude: number | null
  lastLocationUpdate: string | null
}

function mapDriverLocation(data: Record<string, unknown>): DriverLocationInfo {
  return {
    id: Number(data.id ?? data.Id ?? 0),
    fullName: String(data.fullName ?? data.FullName ?? ''),
    lastKnownLatitude:
      data.lastKnownLatitude != null
        ? Number(data.lastKnownLatitude)
        : data.LastKnownLatitude != null
          ? Number(data.LastKnownLatitude)
          : null,
    lastKnownLongitude:
      data.lastKnownLongitude != null
        ? Number(data.lastKnownLongitude)
        : data.LastKnownLongitude != null
          ? Number(data.LastKnownLongitude)
          : null,
    lastLocationUpdate:
      data.lastLocationUpdate != null
        ? String(data.lastLocationUpdate)
        : data.LastLocationUpdate != null
          ? String(data.LastLocationUpdate)
          : null,
  }
}

export async function updateLocation(payload: { latitude: number; longitude: number; loadId: string }) {
  const res = await apiClient.post('/Location/update', payload)
  return res.data
}

export async function getDriverLocation(loadId: string): Promise<DriverLocationInfo> {
  const res = await apiClient.get(`/Location/driver/${loadId}`)
  return mapDriverLocation(res.data as Record<string, unknown>)
}
