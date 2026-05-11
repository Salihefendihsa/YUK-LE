import { apiClient } from './client'
import type { Load, CreateLoadRequest, CreateLoadResponse } from './types'

export async function getLoads(params?: Record<string, string | number | boolean | undefined>): Promise<Load[]> {
  const res = await apiClient.get('/Loads/active', { params })
  const data = res.data as { items?: unknown; data?: unknown; result?: unknown } | unknown
  if (Array.isArray(data)) return data as Load[]
  if (Array.isArray((data as { items?: unknown })?.items)) return (data as { items: Load[] }).items
  if (Array.isArray((data as { data?: unknown })?.data)) return (data as { data: Load[] }).data
  if (Array.isArray((data as { result?: unknown })?.result)) return (data as { result: Load[] }).result
  return []
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
