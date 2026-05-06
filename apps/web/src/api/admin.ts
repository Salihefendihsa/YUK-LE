import { apiClient } from './client'

export interface PendingReview {
  id: number
  fullName: string
  phone: string
  email: string
  adminReviewNote?: string
  aiInferenceDetails?: string
  createdAt: string
}

export async function getPendingReviews(): Promise<PendingReview[]> {
  const res = await apiClient.get<PendingReview[]>('/Admin/pending-reviews')
  return res.data
}

export async function decideReview(userId: number, isApproved: boolean, reason: string) {
  const res = await apiClient.post(`/Admin/reviews/${userId}/decide`, {
    isApproved,
    reason,
  })
  return res.data
}
