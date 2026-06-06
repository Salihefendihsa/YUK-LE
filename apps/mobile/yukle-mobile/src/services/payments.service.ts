import { apiClient } from './api.client';

/**
 * Emanet (escrow) ödeme servisi — web api/payments.ts ile birebir sözleşme.
 * Mock ödeme; gerçek tahsilat yok. Mevcut /Payments/* endpoint'leri, yeni API yok.
 */
export type PaymentStatus = 'Held' | 'Released' | 'Refunded';

export interface PaymentInfo {
  loadId: string;
  customerId: number;
  driverId?: number | null;
  grossAmount: number;
  customerTotal: number;
  commissionRate: number;
  commissionAmount: number;
  customerCommission: number;
  customerCommissionRate: number;
  driverCommission: number;
  driverCommissionRate: number;
  withholding: number;
  netAmount: number;
  status: PaymentStatus;
  createdAt: string;
  releasedAt?: string | null;
}

/** Bir yükün emanet bilgisi. Emanet yoksa null (404'ü demo-güvenli yutarız). */
export async function getPaymentForLoad(loadId: string): Promise<PaymentInfo | null> {
  try {
    const res = await apiClient.get(`/Payments/load/${loadId}`);
    return res.data as PaymentInfo;
  } catch {
    return null;
  }
}
