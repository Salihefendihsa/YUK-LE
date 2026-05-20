import type { Load, LoadStatus } from '../types/load';

const LOAD_STATUS_MAP: Record<number, LoadStatus> = {
  0: 'Active',
  1: 'Assigned',
  2: 'OnWay',
  3: 'Arrived',
  4: 'Delivered',
  5: 'Cancelled',
};

function normalizeStatus(raw: unknown): LoadStatus {
  if (typeof raw === 'string') return raw as LoadStatus;
  if (typeof raw === 'number') return LOAD_STATUS_MAP[raw] ?? 'Active';
  return 'Active';
}

function normalizeEnumLabel(raw: unknown): string {
  if (raw == null) return '';
  if (typeof raw === 'string') return raw;
  if (typeof raw === 'number') {
    const labels = ['Paletli', 'Dokme', 'SogukZincir', 'TehlikeliMadde', 'Parsiyel'];
    return labels[raw] ?? String(raw);
  }
  return String(raw);
}

export function formatCurrencyTRY(value: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

export function formatWeightKg(value: number): string {
  if (!value) return '-';
  return `${value.toLocaleString('tr-TR')} kg`;
}

export function formatDateTR(value: string | Date): string {
  if (!value) return '-';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatTimeTR(value: string | Date): string {
  if (!value) return '-';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

export function formatDateTimeTR(value: string | Date): string {
  if (!value) return '-';
  return `${formatDateTR(value)} ${formatTimeTR(value)}`;
}

export function normalizeLoad(raw: unknown): Load {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    id: String(r.id ?? ''),
    fromCity: String(r.fromCity ?? ''),
    fromDistrict: String(r.fromDistrict ?? ''),
    toCity: String(r.toCity ?? ''),
    toDistrict: String(r.toDistrict ?? ''),
    description: String(r.description ?? ''),
    pickupDate: String(r.pickupDate ?? ''),
    deliveryDate: String(r.deliveryDate ?? ''),
    weight: Number(r.weight ?? 0),
    volume: Number(r.volume ?? 0),
    type: normalizeEnumLabel(r.type ?? r.loadType),
    loadType: normalizeEnumLabel(r.loadType ?? r.type),
    price: Number(r.price ?? 0),
    currency: String(r.currency ?? 'TRY'),
    ownerId: Number(r.ownerId ?? 0),
    ownerFullName: String(r.ownerFullName ?? ''),
    driverId: r.driverId as number | null | undefined,
    destinationLat: Number(r.destinationLat ?? 0),
    destinationLng: Number(r.destinationLng ?? 0),
    requiredVehicleType: r.requiredVehicleType != null ? String(r.requiredVehicleType) : undefined,
    status: normalizeStatus(r.status),
    createdAt: String(r.createdAt ?? ''),
    bidCount: Number(r.bidCount ?? 0),
    aiSuggestedPrice: r.aiSuggestedPrice != null ? Number(r.aiSuggestedPrice) : null,
    aiMinPrice: r.aiMinPrice != null ? Number(r.aiMinPrice) : null,
    aiMaxPrice: r.aiMaxPrice != null ? Number(r.aiMaxPrice) : null,
    aiPriceReasoning: r.aiPriceReasoning != null ? String(r.aiPriceReasoning) : null,
    distanceKm: r.distanceKm != null ? Number(r.distanceKm) : null,
  };
}

export function normalizeLoadList(data: unknown): Load[] {
  if (Array.isArray(data)) return data.map((item) => normalizeLoad(item));
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.items)) return obj.items.map((item) => normalizeLoad(item));
    if (Array.isArray(obj.data)) return obj.data.map((item) => normalizeLoad(item));
    if (Array.isArray(obj.result)) return obj.result.map((item) => normalizeLoad(item));
  }
  return [];
}
