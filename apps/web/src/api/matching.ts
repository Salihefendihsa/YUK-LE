import { apiClient } from './client'
import type { MatchedLoad } from './types'

export async function getRecommendedLoads(): Promise<MatchedLoad[]> {
  const res = await apiClient.get<MatchedLoad[]>('/Matching/recommended')
  return res.data
}

export async function getLoadMatch(id: string): Promise<MatchedLoad> {
  const res = await apiClient.get<MatchedLoad>(`/Matching/load/${id}`)
  return res.data
}

export async function getLoadPriceSuggestion(id: string) {
  const res = await apiClient.get(`/Ai/load/${id}/price-suggestion`)
  return res.data
}
