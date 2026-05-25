import type { StatusTone } from '../components/ui/StatusPill';
import type { DocUiStatus } from '../types/document';
import type { LoadStatus } from '../types/load';

export type StatusPillConfig = { label: string; tone: StatusTone };

/** API enum indeksi veya ham değer → güvenli karşılaştırma anahtarı */
const APPROVAL_STATUS_BY_INDEX: Record<number, string> = {
  0: 'Pending',
  1: 'Approved',
  2: 'Rejected',
  3: 'Active',
  4: 'ManualApprovalRequired',
};

export function normalizeStatusKey(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) {
    return APPROVAL_STATUS_BY_INDEX[value] ?? String(value);
  }
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return String(value).trim();
}

const LOAD_STATUS: Record<LoadStatus, StatusPillConfig> = {
  Active: { label: 'Aktif', tone: 'warning' },
  Assigned: { label: 'Atandı', tone: 'brand' },
  OnWay: { label: 'Yolda', tone: 'info' },
  Arrived: { label: 'Varıldı', tone: 'info' },
  Delivered: { label: 'Teslim', tone: 'success' },
  Cancelled: { label: 'İptal', tone: 'error' },
};

export function getLoadStatusPill(status: unknown): StatusPillConfig {
  const key = normalizeStatusKey(status);
  if (key in LOAD_STATUS) return LOAD_STATUS[key as LoadStatus];
  return { label: key || 'Bilinmiyor', tone: 'neutral' };
}

const BID_LABELS: Record<string, string> = {
  Pending: 'Beklemede',
  Accepted: 'Kabul edildi',
  Rejected: 'Reddedildi',
  Cancelled: 'İptal',
};

export function getBidStatusPill(status: unknown): StatusPillConfig {
  const key = normalizeStatusKey(status);
  const s = key.toLowerCase();
  const label = BID_LABELS[key] ?? (key || 'Bilinmiyor');
  if (s.includes('accept') || s.includes('approv')) return { label, tone: 'success' };
  if (s.includes('reject') || s.includes('cancel')) return { label, tone: 'error' };
  if (s.includes('pending') || s.includes('wait')) return { label, tone: 'warning' };
  return { label, tone: 'neutral' };
}

/** Min/max aralığına göre teklif kıyas rozeti */
export function getAiPriceComparePill(
  amount: number,
  min: number | null | undefined,
  max: number | null | undefined
): StatusPillConfig | null {
  if (min == null || max == null || min <= 0) return null;
  if (amount < min) return { label: 'Uygun fiyat', tone: 'success' };
  if (amount > max) return { label: 'Yüksek teklif', tone: 'error' };
  return { label: 'Önerilen aralıkta', tone: 'warning' };
}

export function getDocUiStatusPill(status: DocUiStatus): StatusPillConfig {
  switch (status) {
    case 'Onayli':
      return { label: 'Onaylı', tone: 'success' };
    case 'Reddedildi':
      return { label: status, tone: 'error' };
    case 'Inceleniyor':
      return { label: status, tone: 'warning' };
    default:
      return { label: status, tone: 'neutral' };
  }
}

const APPROVAL_PILL_LABELS: Record<string, StatusPillConfig> = {
  Active: { label: 'Onaylı', tone: 'success' },
  Approved: { label: 'Onaylı', tone: 'success' },
  Rejected: { label: 'Reddedildi', tone: 'error' },
  Pending: { label: 'Beklemede', tone: 'warning' },
  ManualApprovalRequired: { label: 'Manuel inceleme', tone: 'warning' },
  PendingReview: { label: 'İncelemede', tone: 'warning' },
};

export function getApprovalStatusPill(status: unknown): StatusPillConfig {
  const key = normalizeStatusKey(status);
  if (!key) return { label: 'Bilinmiyor', tone: 'neutral' };
  if (APPROVAL_PILL_LABELS[key]) return APPROVAL_PILL_LABELS[key];
  const s = key.toLowerCase();
  if (s === 'active' || s.includes('approv')) return { label: 'Onaylı', tone: 'success' };
  if (s.includes('reject')) return { label: 'Reddedildi', tone: 'error' };
  if (s.includes('pending') || s.includes('manual') || s.includes('review')) {
    return { label: 'Beklemede', tone: 'warning' };
  }
  return { label: key, tone: 'neutral' };
}

const PAYMENT_STATUS_LABELS: Record<string, StatusPillConfig> = {
  Blocked: { label: 'Bloke', tone: 'warning' },
  Released: { label: 'Serbest bırakıldı', tone: 'success' },
  Failed: { label: 'Başarısız', tone: 'error' },
  Refunded: { label: 'İade edildi', tone: 'neutral' },
};

export function getPaymentStatusPill(status: unknown): StatusPillConfig {
  const key = normalizeStatusKey(status);
  if (PAYMENT_STATUS_LABELS[key]) return PAYMENT_STATUS_LABELS[key];
  const s = key.toLowerCase();
  if (s === 'blocked' || s.includes('hold') || s.includes('bloke')) {
    return { label: 'Bloke', tone: 'warning' };
  }
  if (s === 'released' || s.includes('serbest')) {
    return { label: 'Serbest bırakıldı', tone: 'success' };
  }
  return { label: key || 'Bilinmiyor', tone: 'neutral' };
}

export function getSystemServicePill(value: unknown): StatusPillConfig {
  const v = normalizeStatusKey(value).toLowerCase();
  const online =
    v.includes('online') || v === 'ok' || v.includes('up') || v.includes('healthy') || v === 'true';
  return { label: online ? 'Çalışıyor' : 'Kapalı', tone: online ? 'success' : 'error' };
}

export function formatSystemServiceLabel(value: unknown): string {
  return getSystemServicePill(value).label;
}

export function getAiConfidencePill(score: number | null | undefined): StatusPillConfig {
  if (score == null) return { label: 'Güven: —', tone: 'neutral' };
  const label = `Güven %${Math.round(score)}`;
  if (score >= 80) return { label, tone: 'success' };
  if (score >= 50) return { label, tone: 'warning' };
  return { label, tone: 'error' };
}

const WALLET_TYPE_LABELS: Record<string, string> = {
  Hold: 'Ödeme blokede',
  Release: 'Ödeme serbest bırakıldı',
  Commission: 'Şoför komisyonu',
  CustomerCommission: 'Müşteri komisyonu',
  Tax: 'Stopaj',
  Refund: 'İade',
  Blocked: 'Ödeme blokede',
  Released: 'Ödeme serbest bırakıldı',
  Pending: 'Beklemede',
  Failed: 'Başarısız',
};

export function getWalletTxStatusPill(status: unknown): StatusPillConfig {
  const key = normalizeStatusKey(status);
  const label = WALLET_TYPE_LABELS[key] ?? (key || 'İşlem');
  const s = key.toLowerCase();
  if (s === 'release' || s === 'released' || s === 'refund') {
    return { label, tone: 'success' };
  }
  if (s === 'commission' || s === 'customercommission' || s === 'tax' || s.includes('fail') || s.includes('cancel')) {
    return { label, tone: 'error' };
  }
  if (s === 'hold' || s === 'blocked' || s.includes('pending') || s.includes('bloke')) {
    return { label, tone: 'warning' };
  }
  if (s.includes('complete') || s.includes('success') || s === 'paid') {
    return { label, tone: 'success' };
  }
  return { label, tone: 'neutral' };
}
