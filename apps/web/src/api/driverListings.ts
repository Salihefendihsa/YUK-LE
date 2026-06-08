import { apiClient } from './client'

/** Backend DriverListingStatus enum string karşılığı. */
export type DriverListingStatus = 'Active' | 'Matched' | 'Cancelled' | 'Expired'

/** Backend DriverListingDto karşılığı. */
export interface DriverListing {
  id: string
  driverId: number
  driverName: string
  originCity: string
  originDistrict: string
  originLat: number
  originLng: number
  destinationCity: string
  destinationDistrict: string
  destinationLat: number
  destinationLng: number
  availableFrom: string
  vehicleType: string
  capacityNote?: string | null
  notes?: string | null
  status: string
  createdAt: string
}

/** Backend CreateDriverListingDto karşılığı (vehicleType enum index olarak gönderilir). */
export interface CreateDriverListingRequest {
  originCity: string
  originDistrict: string
  originLatitude: number
  originLongitude: number
  destinationCity: string
  destinationDistrict: string
  destinationLatitude: number
  destinationLongitude: number
  availableFrom: string
  vehicleType: number
  capacityNote?: string
  notes?: string
}

/** API yanıtı { Total, Items } veya düz dizi olabilir — her ikisini de karşıla. */
function unwrapList(data: unknown): DriverListing[] {
  if (Array.isArray(data)) return data as DriverListing[]
  const items = (data as { items?: unknown; Items?: unknown })?.items ?? (data as { Items?: unknown })?.Items
  if (Array.isArray(items)) return items as DriverListing[]
  return []
}

export async function createDriverListing(
  payload: CreateDriverListingRequest,
): Promise<DriverListing> {
  const res = await apiClient.post<DriverListing>('/DriverListing', payload)
  return res.data
}

export async function getDriverListings(filters?: {
  fromCity?: string
  toCity?: string
}): Promise<DriverListing[]> {
  const params: Record<string, string> = {}
  if (filters?.fromCity?.trim()) params.fromCity = filters.fromCity.trim()
  if (filters?.toCity?.trim()) params.toCity = filters.toCity.trim()
  const res = await apiClient.get('/DriverListing', { params })
  return unwrapList(res.data)
}

export async function getMyDriverListings(): Promise<DriverListing[]> {
  const res = await apiClient.get('/DriverListing/mine')
  return unwrapList(res.data)
}

export async function getDriverListing(id: string): Promise<DriverListing> {
  const res = await apiClient.get<DriverListing>(`/DriverListing/${id}`)
  return res.data
}

export async function cancelDriverListing(id: string): Promise<{ message: string }> {
  const res = await apiClient.post(`/DriverListing/${id}/cancel`)
  const d = res.data as Record<string, unknown>
  return { message: String(d.message ?? d.Message ?? 'İlan iptal edildi.') }
}
