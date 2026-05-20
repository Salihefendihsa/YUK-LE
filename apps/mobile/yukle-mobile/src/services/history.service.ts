import type {
  CustomerHistoryResponse,
  CustomerHistoryRow,
  DriverHistoryResponse,
  DriverHistoryRow,
} from '../types/history';
import { apiClient } from './api.client';

function normalizeCustomerRow(raw: unknown): CustomerHistoryRow {
  const r = raw as Record<string, unknown>;
  return {
    id: String(r.id ?? ''),
    fromCity: String(r.fromCity ?? ''),
    toCity: String(r.toCity ?? ''),
    deliveryDate: r.deliveryDate != null ? String(r.deliveryDate) : null,
    price: Number(r.price ?? 0),
    driverName: r.driverName != null ? String(r.driverName) : null,
    status: 'Delivered',
  };
}

function normalizeRow(raw: unknown): DriverHistoryRow {
  const r = raw as Record<string, unknown>;
  return {
    id: String(r.id ?? ''),
    fromCity: String(r.fromCity ?? ''),
    toCity: String(r.toCity ?? ''),
    deliveryDate: r.deliveryDate != null ? String(r.deliveryDate) : null,
    price: Number(r.price ?? 0),
    customerName: r.customerName != null ? String(r.customerName) : null,
    status: 'Delivered',
  };
}

/** Musteri: GET /Loads/history */
export async function getCustomerLoadHistory(
  page = 1,
  pageSize = 50
): Promise<CustomerHistoryResponse> {
  const res = await apiClient.get('/Loads/history', { params: { page, pageSize } });
  const data = res.data as Record<string, unknown>;
  const rawItems = data.items ?? data.Items;
  const items = Array.isArray(rawItems) ? rawItems.map(normalizeCustomerRow) : [];
  return {
    items,
    totalSpend: Number(data.totalSpend ?? data.TotalSpend ?? 0),
    total: Number(data.total ?? data.Total ?? items.length),
  };
}

export async function getDriverLoadHistory(
  page = 1,
  pageSize = 50
): Promise<DriverHistoryResponse> {
  const res = await apiClient.get('/Loads/driver-history', { params: { page, pageSize } });
  const data = res.data as Record<string, unknown>;
  const items = Array.isArray(data.items) ? data.items.map(normalizeRow) : [];
  return {
    items,
    totalEarn: Number(data.totalEarn ?? 0),
    tripCount: Number(data.tripCount ?? data.total ?? items.length),
    total: Number(data.total ?? items.length),
  };
}
