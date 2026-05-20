import type { DriverBid, LoadBid } from '../types/bid';
import { apiClient } from './api.client';

export interface SubmitBidRequest {
  loadId: string;
  amount: number;
  note?: string;
}

export async function submitBid(data: SubmitBidRequest): Promise<unknown> {
  const res = await apiClient.post('/Bids/submit', data);
  return res.data;
}

function normalizeBid(raw: unknown): DriverBid {
  const r = raw as Record<string, unknown>;
  return {
    id: Number(r.id ?? 0),
    loadId: String(r.loadId ?? ''),
    fromCity: String(r.fromCity ?? ''),
    toCity: String(r.toCity ?? ''),
    amount: Number(r.amount ?? 0),
    note: r.note != null ? String(r.note) : null,
    offerDate: String(r.offerDate ?? r.createdAt ?? ''),
    status: String(r.status ?? '-'),
  };
}

function normalizeLoadBid(raw: unknown): LoadBid {
  const r = raw as Record<string, unknown>;
  return {
    id: Number(r.id ?? 0),
    amount: Number(r.amount ?? 0),
    note: r.note != null ? String(r.note) : null,
    offerDate: String(r.offerDate ?? r.createdAt ?? ''),
    status: String(r.status ?? 'Pending'),
    driverFullName: String(r.driverFullName ?? '-'),
    driverPhone: String(r.driverPhone ?? ''),
  };
}

/** Musteri: GET /Bids/load/{loadId} */
export async function getBidsForLoad(loadId: string): Promise<LoadBid[]> {
  const res = await apiClient.get(`/Bids/load/${loadId}`);
  const data = res.data;
  if (!Array.isArray(data)) return [];
  return data.map(normalizeLoadBid);
}

/** Musteri: POST /Bids/{bidId}/accept */
export async function acceptBid(bidId: number): Promise<void> {
  await apiClient.post(`/Bids/${bidId}/accept`);
}

/** GET /Bids/driver — sofor teklif listesi (mobil icin eklendi). */
export async function getDriverBids(): Promise<DriverBid[]> {
  const res = await apiClient.get('/Bids/driver');
  const data = res.data;
  if (!Array.isArray(data)) return [];
  return data.map(normalizeBid);
}
