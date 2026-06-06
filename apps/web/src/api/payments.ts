import { apiClient } from './client'

export type PaymentStatus = 'Held' | 'Released' | 'Refunded'

export interface PaymentInfo {
  loadId: string
  customerId: number
  driverId?: number | null
  grossAmount: number
  customerTotal: number
  commissionRate: number
  commissionAmount: number
  withholding: number
  netAmount: number
  status: PaymentStatus
  createdAt: string
  releasedAt?: string | null
}

export interface PaymentRevenueSummary {
  totalPlatformRevenue: number
  heldEscrowTotal: number
  releasedGrossTotal: number
  heldCount: number
  releasedCount: number
}

/** Bir yükün emanet bilgisi. Emanet yoksa null döner (404'ü demo-güvenli yutarız). */
export async function getPaymentForLoad(loadId: string): Promise<PaymentInfo | null> {
  try {
    const res = await apiClient.get(`/Payments/load/${loadId}`)
    return res.data
  } catch {
    return null
  }
}

export async function getMyPayments(): Promise<PaymentInfo[]> {
  const res = await apiClient.get('/Payments/mine')
  return res.data
}

export async function getPaymentRevenueSummary(): Promise<PaymentRevenueSummary> {
  const res = await apiClient.get('/Payments/admin/summary')
  return res.data
}
