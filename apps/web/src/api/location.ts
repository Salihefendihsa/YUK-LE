import { apiClient } from './client'

export async function updateLocation(payload: { latitude: number; longitude: number; loadId: string }) {
  const res = await apiClient.post('/Location/update', payload)
  return res.data
}

export async function getDriverLocation(loadId: string) {
  const res = await apiClient.get(`/Location/driver/${loadId}`)
  return res.data
}
