import { apiClient } from './client'
import type { Load, CreateLoadRequest, CreateLoadResponse } from './types'

export async function getActiveLoads(): Promise<Load[]> {
  const res = await apiClient.get<Load[]>('/Loads/active')
  return res.data
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
