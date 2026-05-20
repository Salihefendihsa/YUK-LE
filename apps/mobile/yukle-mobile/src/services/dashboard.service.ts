import type { CustomerDashboard, DriverDashboard } from '../types/dashboard';
import { apiClient } from './api.client';

function normalizeCustomerDashboard(raw: unknown): CustomerDashboard {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    activeLoadCount: Number(r.activeLoadCount ?? 0),
    onWayLoadCount: Number(r.onWayLoadCount ?? 0),
    deliveredLoadCount: Number(r.deliveredLoadCount ?? 0),
    totalSpent: Number(r.totalSpent ?? 0),
  };
}

export async function getDriverDashboard(): Promise<DriverDashboard> {
  const res = await apiClient.get<DriverDashboard>('/Dashboard');
  return res.data ?? {
    activeBidCount: 0,
    completedJobCount: 0,
    totalEarnings: 0,
  };
}

export async function getCustomerDashboard(): Promise<CustomerDashboard> {
  const res = await apiClient.get('/Dashboard');
  return normalizeCustomerDashboard(res.data);
}
