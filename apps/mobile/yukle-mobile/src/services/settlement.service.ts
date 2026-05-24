import type { SettlementPreview } from '../types/settlement';
import { apiClient } from './api.client';

function normalizeSettlement(raw: unknown): SettlementPreview {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    bidAmount: Number(r.bidAmount ?? r.BidAmount ?? 0),
    driverCommission: Number(r.driverCommission ?? r.DriverCommission ?? 0),
    customerCommission: Number(r.customerCommission ?? r.CustomerCommission ?? 0),
    withholding: Number(r.withholding ?? r.Withholding ?? 0),
    driverNet: Number(r.driverNet ?? r.DriverNet ?? 0),
    customerTotal: Number(r.customerTotal ?? r.CustomerTotal ?? 0),
    platformRevenue: Number(r.platformRevenue ?? r.PlatformRevenue ?? 0),
    driverCommissionRate: Number(r.driverCommissionRate ?? r.DriverCommissionRate ?? 0),
    customerCommissionRate: Number(r.customerCommissionRate ?? r.CustomerCommissionRate ?? 0),
    stopajRate: Number(r.stopajRate ?? r.StopajRate ?? 0),
  };
}

/** GET /Settlement/preview — oranlar sunucu config'inden */
export async function previewSettlement(
  amount: number,
  driverIsCorporate = false
): Promise<SettlementPreview> {
  const res = await apiClient.get('/Settlement/preview', {
    params: { amount, driverIsCorporate },
  });
  return normalizeSettlement(res.data);
}

export function formatRatePct(rate: number): string {
  return `%${(rate * 100).toFixed(rate * 100 % 1 === 0 ? 0 : 2)}`;
}
