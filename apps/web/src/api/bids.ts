import { apiClient } from './client'
import type { Bid, CreateBidRequest, DriverBid } from './types'

export async function getBidsForLoad(loadId: string): Promise<Bid[]> {
  const res = await apiClient.get<Bid[]>(`/Bids/load/${loadId}`)
  return res.data
}

// Giriş yapan şoförün verdiği tüm teklifler (status zaten string döner)
export async function getDriverBids(): Promise<DriverBid[]> {
  const res = await apiClient.get<DriverBid[]>('/Bids/driver')
  return res.data
}

export async function submitBid(data: CreateBidRequest) {
  const res = await apiClient.post('/Bids/submit', data)
  return res.data
}

export async function acceptBid(bidId: number) {
  const res = await apiClient.post(`/Bids/${bidId}/accept`)
  return res.data
}
