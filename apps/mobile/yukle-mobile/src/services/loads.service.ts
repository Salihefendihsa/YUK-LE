import type {
  AiMarketAnalysis,
  AiPriceSuggestionResponse,
  CreateLoadPayload,
  CreateLoadResponse,
} from '../types/create-load';
import type { Load } from '../types/load';
import { normalizeLoad, normalizeLoadList } from '../utils/format';
import { apiClient } from './api.client';

function normalizeAiAnalysis(raw: unknown): AiMarketAnalysis | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const r = raw as Record<string, unknown>;
  return {
    recommendedPrice: Number(r.recommendedPrice ?? 0),
    minPrice: Number(r.minPrice ?? 0),
    maxPrice: Number(r.maxPrice ?? 0),
    reasoning: String(r.reasoning ?? ''),
    distanceKm: Number(r.distanceKm ?? 0),
    fuelPriceTl: r.fuelPriceTl != null ? Number(r.fuelPriceTl) : undefined,
    isAiGenerated: r.isAiGenerated != null ? Boolean(r.isAiGenerated) : undefined,
  };
}

export async function createLoad(
  payload: CreateLoadPayload,
  options?: { signal?: AbortSignal }
): Promise<CreateLoadResponse> {
  const res = await apiClient.post('/Loads', payload, {
    timeout: 60000,
    signal: options?.signal,
  });
  const data = res.data as Record<string, unknown>;
  const loadRaw = data.load ?? data.Load;
  const aiRaw = data.aiMarketAnalysis ?? data.AiMarketAnalysis;
  return {
    load: normalizeLoad(loadRaw),
    aiMarketAnalysis: normalizeAiAnalysis(aiRaw),
  };
}

/** Web: GET /Ai/load/{id}/price-suggestion (ilan olusturma SONRASI). */
export async function getLoadPriceSuggestion(
  loadId: string,
  options?: { signal?: AbortSignal }
): Promise<AiMarketAnalysis | null> {
  const res = await apiClient.get(`/Ai/load/${loadId}/price-suggestion`, {
    timeout: 45000,
    signal: options?.signal,
  });
  const data = res.data as Record<string, unknown>;
  const suggestion = (data.suggestion ?? data.Suggestion) as Record<string, unknown> | undefined;
  if (!suggestion) return null;
  return {
    recommendedPrice: Number(suggestion.recommendedPrice ?? suggestion.RecommendedPrice ?? 0),
    minPrice: Number(suggestion.minPrice ?? suggestion.MinPrice ?? 0),
    maxPrice: Number(suggestion.maxPrice ?? suggestion.MaxPrice ?? 0),
    reasoning: String(suggestion.reasoning ?? suggestion.Reasoning ?? ''),
    distanceKm: Number(suggestion.distanceKm ?? suggestion.DistanceKm ?? 0),
  };
}

export interface ActiveLoadsQuery {
  fromCity?: string;
  toCity?: string;
  vehicleType?: string;
  minPrice?: number;
  maxPrice?: number;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'date' | 'price';
  page?: number;
  pageSize?: number;
}

export interface ActiveLoadsPage {
  items: Load[];
  total: number;
  page: number;
  pageSize: number;
}

export async function getActiveLoadsPaged(query: ActiveLoadsQuery = {}): Promise<ActiveLoadsPage> {
  const res = await apiClient.get('/Loads/active', {
    params: {
      fromCity: query.fromCity || undefined,
      toCity: query.toCity || undefined,
      vehicleType: query.vehicleType || undefined,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      sortBy: query.sortBy,
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 20,
    },
  });
  const data = res.data as Record<string, unknown>;
  const items = normalizeLoadList(data);
  return {
    items,
    total: Number(data.total ?? data.Total ?? items.length),
    page: Number(data.page ?? data.Page ?? query.page ?? 1),
    pageSize: Number(data.pageSize ?? data.PageSize ?? query.pageSize ?? 20),
  };
}

export async function getActiveLoads(): Promise<Load[]> {
  const page = await getActiveLoadsPaged({ page: 1, pageSize: 20 });
  return page.items;
}

/** Musteri: GET /Loads/active (API musteri icin kendi ilanlarini dondurur). */
export async function getCustomerLoads(): Promise<Load[]> {
  return getActiveLoads();
}

export async function getLoadById(id: string): Promise<Load> {
  const res = await apiClient.get(`/Loads/${id}`);
  return normalizeLoad(res.data);
}

/** Web ActiveLoad: GET /Loads/active, Assigned | OnWay (driver trip merged on API). */
export async function getDriverActiveTrip(driverId: number): Promise<Load | null> {
  const rows = await getActiveLoads();
  const trip =
    rows.find(
      (row) =>
        row.driverId === driverId &&
        (row.status === 'Assigned' || row.status === 'OnWay' || row.status === 'Arrived')
    ) ?? null;
  return trip;
}

export async function pickupLoad(id: string): Promise<void> {
  await apiClient.post(`/Loads/${id}/pickup`);
}

export interface DeliverLoadPayload {
  qrToken: string;
  targetLat: number;
  targetLng: number;
}

export async function deliverLoad(id: string, payload: DeliverLoadPayload): Promise<void> {
  await apiClient.post(`/Loads/${id}/deliver`, payload);
}

/** Musteri: GET /Loads/{id}/delivery-qr */
export async function getDeliveryQr(loadId: string): Promise<{
  loadId: string;
  token: string;
  expiresInMinutes: number;
}> {
  const res = await apiClient.get(`/Loads/${loadId}/delivery-qr`);
  const d = res.data as Record<string, unknown>;
  return {
    loadId: String(d.loadId ?? loadId),
    token: String(d.token ?? d.Token ?? ''),
    expiresInMinutes: Number(d.expiresInMinutes ?? d.ExpiresInMinutes ?? 15),
  };
}

export interface CancelLoadResult {
  loadId: string;
  status: string;
  message: string;
  alreadyCancelled?: boolean;
  refundAmount?: number | null;
  closedBids?: number;
}

export async function cancelLoad(
  loadId: string,
  reason?: string
): Promise<CancelLoadResult> {
  const res = await apiClient.post(`/Loads/${loadId}/cancel`, { reason: reason ?? null });
  const d = res.data as Record<string, unknown>;
  return {
    loadId: String(d.loadId ?? loadId),
    status: String(d.status ?? d.Status ?? ''),
    message: String(d.message ?? d.Message ?? ''),
    alreadyCancelled: Boolean(d.alreadyCancelled ?? d.AlreadyCancelled),
    refundAmount:
      d.refundAmount != null || d.RefundAmount != null
        ? Number(d.refundAmount ?? d.RefundAmount)
        : null,
    closedBids: Number(d.closedBids ?? d.ClosedBids ?? 0),
  };
}

export interface UpdateLoadResult {
  load: Load;
  materialChanged: boolean;
  notifiedDrivers: boolean;
  message: string;
}

export async function updateLoad(
  loadId: string,
  payload: CreateLoadPayload
): Promise<UpdateLoadResult> {
  const res = await apiClient.put(`/Loads/${loadId}`, payload, { timeout: 60000 });
  const d = res.data as Record<string, unknown>;
  const loadRaw = d.load ?? d.Load;
  return {
    load: normalizeLoad(loadRaw),
    materialChanged: Boolean(d.materialChanged ?? d.MaterialChanged),
    notifiedDrivers: Boolean(d.notifiedDrivers ?? d.NotifiedDrivers),
    message: String(d.message ?? d.Message ?? ''),
  };
}
