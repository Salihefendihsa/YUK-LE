import { apiClient } from './client'

export async function uploadDocumentForAi(file: File, docType = 'DriverLicense') {
  const formData = new FormData()
  formData.append('file', file)

  const res = await apiClient.post(`/Ai/ocr?docType=${encodeURIComponent(docType)}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

export async function uploadDriverDocument(file: File, docType = 'DriverLicense') {
  const formData = new FormData()
  formData.append('file', file)

  const res = await apiClient.post(`/Auth/upload-document?docType=${encodeURIComponent(docType)}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

export type PriceSuggestionPreview = {
  recommendedPrice: number
  minPrice: number
  maxPrice: number
  distanceKm: number
}

function normalizePriceSuggestion(raw: unknown): PriceSuggestionPreview | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const recommended = Number(r.recommendedPrice ?? r.RecommendedPrice ?? 0)
  if (!Number.isFinite(recommended) || recommended <= 0) return null
  return {
    recommendedPrice: recommended,
    minPrice: Number(r.minPrice ?? r.MinPrice ?? 0),
    maxPrice: Number(r.maxPrice ?? r.MaxPrice ?? 0),
    distanceKm: Number(r.distanceKm ?? r.DistanceKm ?? 0),
  }
}

/** POST /Ai/price-suggestion — ilan kaydetmeden fiyat önizleme (mobil paritesi). */
export async function previewLoadPriceSuggestion(
  params: {
    originLat: number
    originLng: number
    destLat: number
    destLng: number
    fromCity: string
    toCity: string
    vehicleType: string
    weight: number
    volume?: number
  },
  options?: { signal?: AbortSignal }
): Promise<PriceSuggestionPreview | null> {
  const res = await apiClient.post(
    '/Ai/price-suggestion',
    {
      originLat: params.originLat,
      originLng: params.originLng,
      destLat: params.destLat,
      destLng: params.destLng,
      fromCity: params.fromCity,
      toCity: params.toCity,
      vehicleType: params.vehicleType,
      weight: params.weight,
      volume: params.volume,
    },
    { timeout: 45000, signal: options?.signal }
  )
  return normalizePriceSuggestion(res.data)
}
