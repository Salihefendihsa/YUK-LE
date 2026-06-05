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

const LOAD_TYPE_DISPLAY: Record<string, string> = {
  General: 'Genel',
  Paletli: 'Paletli',
  Dokme: 'Dökme Yük',
  Dökme: 'Dökme Yük',
  SogukZincir: 'Soğuk Zincir',
  SoğukZincir: 'Soğuk Zincir',
  TehlikeliMadde: 'Tehlikeli Madde (ADR)',
  Parsiyel: 'Parsiyel',
  GenelKargo: 'Genel Kargo',
  Konteyner: 'Konteyner',
  ProjeAgirYuk: 'Proje / Ağır Yük',
  CanliHayvan: 'Canlı Hayvan',
  Gida: 'Gıda',
  InsaatMalzemesi: 'İnşaat Malzemesi',
  AkaryakitSivi: 'Akaryakıt / Sıvı',
  TahilHububat: 'Tahıl / Hububat',
  Otomotiv: 'Otomotiv (Araç Taşıma)',
  MobilyaBeyazEsya: 'Mobilya / Beyaz Eşya',
  Kimyasal: 'Kimyasal',
};

// Backend LoadType index sırası (Yukle.Api/Models/Enums.cs) ile birebir.
const LOAD_TYPE_BY_INDEX = [
  'Paletli',
  'Dökme Yük',
  'Soğuk Zincir',
  'Tehlikeli Madde (ADR)',
  'Parsiyel',
  'Genel Kargo',
  'Konteyner',
  'Proje / Ağır Yük',
  'Canlı Hayvan',
  'Gıda',
  'İnşaat Malzemesi',
  'Akaryakıt / Sıvı',
  'Tahıl / Hububat',
  'Otomotiv (Araç Taşıma)',
  'Mobilya / Beyaz Eşya',
  'Kimyasal',
];

/** API enum/string veya indeks → kullanıcıya gösterilen yük tipi etiketi */
export function formatLoadTypeLabel(raw: unknown): string {
  if (raw == null || raw === '') return '-';
  if (typeof raw === 'number') return LOAD_TYPE_BY_INDEX[raw] ?? String(raw);
  const s = String(raw);
  return LOAD_TYPE_DISPLAY[s] ?? s;
}

function normalizeEnumLabel(raw: unknown): string {
  if (raw == null) return '';
  return formatLoadTypeLabel(raw === '' ? null : raw);
}

/** Ödeme kaydı işlem kimliği — mock/iyzico/auth gibi iç önekler gizlenir */
export function formatPaymentTransactionId(raw: string | null | undefined): string {
  if (!raw?.trim()) return '—';
  const cleaned = raw
    .trim()
    .replace(/^mock_iyzico_auth_/i, '')
    .replace(/^mock_iyzico_/i, '')
    .replace(/^mock_/i, '')
    .replace(/^iyzico_/i, '')
    .replace(/^auth_/i, '');
  const suffix = (cleaned.length >= 6 ? cleaned.slice(-6) : cleaned) || raw.slice(-6);
  return `İşlem No: …${suffix}`;
}

/** Yönetim logu işlem türü */
export function formatAdminLogAction(action?: string | null): string {
  if (!action?.trim()) return 'İşlem';
  const known: Record<string, string> = {
    SuspendUser: 'Kullanıcı askıya alındı',
    ActivateUser: 'Kullanıcı etkinleştirildi',
    WarnUser: 'Kullanıcı uyarıldı',
    ApproveDriver: 'Şoför onaylandı',
    RejectDriver: 'Şoför reddedildi',
    ReleasePayment: 'Ödeme serbest bırakıldı',
    UpdateUser: 'Kullanıcı güncellendi',
    DeleteRating: 'Puan silindi',
  };
  const trimmed = action.trim();
  if (known[trimmed]) return known[trimmed];
  return trimmed.replace(/([a-z])([A-Z])/g, '$1 $2');
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
    if (Array.isArray(obj.Items)) return obj.Items.map((item) => normalizeLoad(item));
    if (Array.isArray(obj.data)) return obj.data.map((item) => normalizeLoad(item));
    if (Array.isArray(obj.Data)) return obj.Data.map((item) => normalizeLoad(item));
    if (Array.isArray(obj.result)) return obj.result.map((item) => normalizeLoad(item));
  }
  return [];
}
