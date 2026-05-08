import { apiClient } from './client'

export async function submitRating(data: { loadId: string; givenToUserId: number; score: number; comment?: string }) {
  const res = await apiClient.post('/Ratings/submit', data)
  return res.data
}

export async function getUserRatings(userId: number) {
  const res = await apiClient.get(`/Ratings/user/${userId}`)
  return res.data
}
