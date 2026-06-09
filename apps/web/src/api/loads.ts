import { apiClient } from './client'
import type { Load, CreateLoadRequest, CreateLoadResponse } from './types'

/** Backend /Loads/active yanıtını ({ Total, Items } veya düz dizi) çöz. */
function unwrapLoadPage(data: unknown): { items: Load[]; total: number } {
  if (Array.isArray(data)) return { items: data as Load[], total: (data as Load[]).length }
  const obj = data as {
    items?: unknown; Items?: unknown; data?: unknown; result?: unknown
    total?: unknown; Total?: unknown
  } | null
  const rawItems = obj?.items ?? obj?.Items ?? obj?.data ?? obj?.result
  const items = Array.isArray(rawItems) ? (rawItems as Load[]) : []
  const totalRaw = obj?.total ?? obj?.Total
  const total = typeof totalRaw === 'number' ? totalRaw : items.length
  return { items, total }
}

export async function getLoads(params?: Record<string, string | number | boolean | undefined>): Promise<Load[]> {
  // Backend /Loads/active sayfalı döner ({ Total, Items }). Önceden frontend yalnız ilk 20 kaydı
  // alıyordu (Total yok sayılıyordu) → 20+ ilan sessizce gizleniyordu. Çözüm: tüm sayfaları
  // döngüyle çekip birleştir. (Tam sayfalama UI'ı sonraki adıma bırakıldı.)
  const pageSize = 100
  const all: Load[] = []
  for (let page = 1; page <= 100; page++) {
    const res = await apiClient.get('/Loads/active', { params: { ...params, page, pageSize } })
    const { items, total } = unwrapLoadPage(res.data)
    all.push(...items)
    if (items.length === 0 || all.length >= total) break
  }
  return all
}

export async function getActiveLoads(): Promise<Load[]> {
  return getLoads()
}

export async function getLoad(id: string): Promise<Load> {
  const res = await apiClient.get<Load>(`/Loads/${id}`)
  return res.data
}

export async function createLoad(data: CreateLoadRequest): Promise<CreateLoadResponse> {
  const res = await apiClient.post<CreateLoadResponse>('/Loads', data)
  return res.data
}

export async function pickupLoad(id: string) {
  const res = await apiClient.post(`/Loads/${id}/pickup`)
  return res.data
}

export async function deliverLoad(id: string, payload: { qrToken: string; targetLat: number; targetLng: number }) {
  const res = await apiClient.post(`/Loads/${id}/deliver`, payload)
  return res.data
}

export async function getDeliveryQr(id: string): Promise<{ loadId: string; token: string; expiresInMinutes: number }> {
  const res = await apiClient.get<{ loadId: string; token: string; expiresInMinutes: number }>(`/Loads/${id}/delivery-qr`)
  return res.data
}

export type HistoryRow = {
  id: string
  fromCity: string
  toCity: string
  deliveryDate?: string
  price: number
  driverName?: string | null
  customerName?: string | null
}

export async function getCustomerLoadHistory(page = 1, pageSize = 20) {
  const res = await apiClient.get<{ items: HistoryRow[]; totalSpend: number; total: number }>('/Loads/history', { params: { page, pageSize } })
  return res.data
}

export async function getDriverLoadHistory(page = 1, pageSize = 20) {
  const res = await apiClient.get<{ items: HistoryRow[]; totalEarn: number; tripCount: number; total: number }>('/Loads/driver-history', { params: { page, pageSize } })
  return res.data
}

export type CancelLoadResult = {
  loadId: string
  status: string
  message: string
  alreadyCancelled?: boolean
  refundAmount?: number | null
}

export async function cancelLoad(loadId: string, reason?: string): Promise<CancelLoadResult> {
  const res = await apiClient.post(`/Loads/${loadId}/cancel`, { reason: reason ?? null })
  const d = res.data as Record<string, unknown>
  return {
    loadId: String(d.loadId ?? loadId),
    status: String(d.status ?? d.Status ?? ''),
    message: String(d.message ?? d.Message ?? 'İlan iptal edildi.'),
    alreadyCancelled: Boolean(d.alreadyCancelled ?? d.AlreadyCancelled),
    refundAmount:
      d.refundAmount != null || d.RefundAmount != null
        ? Number(d.refundAmount ?? d.RefundAmount)
        : null,
  }
}
