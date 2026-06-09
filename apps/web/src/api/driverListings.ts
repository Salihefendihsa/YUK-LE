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

// ─────────────────────────────────────────────────────────────────────────────
//  Teklif / Eşleşme (ListingOffer) — Backend commit 1c0fcd8
// ─────────────────────────────────────────────────────────────────────────────

/** Backend ListingOfferStatus enum string karşılığı. */
export type ListingOfferStatus = 'Pending' | 'Accepted' | 'Rejected' | 'Withdrawn'

/** İlan sahibi şoförün gördüğü teklif (backend ListingOfferDto). */
export interface ListingOffer {
  id: string
  driverListingId: string
  loadId: string
  customerId: number
  customerName: string
  fromCity: string
  fromDistrict: string
  toCity: string
  toDistrict: string
  loadPrice: number
  amount?: number | null
  note?: string | null
  status: string
  createdAt: string
}

/** Müşterinin gördüğü kendi teklifi (backend MyListingOfferDto). */
export interface MyListingOffer {
  id: string
  driverListingId: string
  driverName: string
  originCity: string
  destinationCity: string
  loadId: string
  fromCity: string
  toCity: string
  amount?: number | null
  note?: string | null
  status: string
  createdAt: string
}

/** Backend CreateListingOfferDto karşılığı. */
export interface CreateListingOfferRequest {
  loadId: string
  amount?: number
  note?: string
}

function unwrapOffers<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  const items =
    (data as { items?: unknown; Items?: unknown })?.items ??
    (data as { Items?: unknown })?.Items
  if (Array.isArray(items)) return items as T[]
  return []
}

/** Müşteri: bir ilana kendi açık yükünü teklif eder. */
export async function createOffer(
  listingId: string,
  payload: CreateListingOfferRequest,
): Promise<{ id: string; message: string }> {
  const res = await apiClient.post(`/DriverListing/${listingId}/offers`, payload)
  const d = res.data as Record<string, unknown>
  return {
    id: String(d.id ?? d.Id ?? ''),
    message: String(d.message ?? d.Message ?? 'Teklifiniz iletildi.'),
  }
}

/** Şoför: kendi ilanına gelen teklifleri listeler. */
export async function getOffersForListing(listingId: string): Promise<ListingOffer[]> {
  const res = await apiClient.get(`/DriverListing/${listingId}/offers`)
  return unwrapOffers<ListingOffer>(res.data)
}

/** Müşteri: gönderdiği tüm teklifleri listeler. */
export async function getMyOffers(): Promise<MyListingOffer[]> {
  const res = await apiClient.get('/DriverListing/offers/mine')
  return unwrapOffers<MyListingOffer>(res.data)
}

/** Şoför: teklifi kabul eder (yük atanır, ilan Eşleşti). */
export async function acceptOffer(offerId: string): Promise<{ message: string }> {
  const res = await apiClient.post(`/DriverListing/offers/${offerId}/accept`)
  const d = res.data as Record<string, unknown>
  return { message: String(d.message ?? d.Message ?? 'Teklif kabul edildi.') }
}

/** Şoför: teklifi reddeder. */
export async function rejectOffer(offerId: string): Promise<{ message: string }> {
  const res = await apiClient.post(`/DriverListing/offers/${offerId}/reject`)
  const d = res.data as Record<string, unknown>
  return { message: String(d.message ?? d.Message ?? 'Teklif reddedildi.') }
}

/** Müşteri: kendi bekleyen teklifini geri çeker. */
export async function withdrawOffer(offerId: string): Promise<{ message: string }> {
  const res = await apiClient.post(`/DriverListing/offers/${offerId}/withdraw`)
  const d = res.data as Record<string, unknown>
  return { message: String(d.message ?? d.Message ?? 'Teklif geri çekildi.') }
}
