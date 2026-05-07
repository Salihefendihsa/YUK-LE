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

export async function getAdminDashboard() {
  const res = await apiClient.get('/Admin/dashboard')
  return res.data
}

export async function getDrivers(status?: string) {
  const res = await apiClient.get('/Admin/drivers', { params: { status } })
  return res.data
}

export async function getCustomers() {
  const res = await apiClient.get('/Admin/customers')
  return res.data
}

export async function toggleUserActive(userId: number) {
  const res = await apiClient.post(`/Admin/users/${userId}/toggle-active`)
  return res.data
}

export async function getAdminLoads(status?: string, q?: string) {
  const res = await apiClient.get('/Admin/loads', { params: { status, q } })
  return res.data
}

export async function cancelAdminLoad(loadId: string) {
  const res = await apiClient.post(`/Admin/loads/${loadId}/cancel`)
  return res.data
}

export async function getPayments() {
  const res = await apiClient.get('/Admin/payments')
  return res.data
}

export async function releasePayment(paymentId: string) {
  const res = await apiClient.post(`/Admin/payments/${paymentId}/release`)
  return res.data
}

export async function getAdminLogs() {
  const res = await apiClient.get('/Admin/logs')
  return res.data
}

export async function getAdminSystemStatus() {
  const res = await apiClient.get('/Admin/system')
  return res.data
}
