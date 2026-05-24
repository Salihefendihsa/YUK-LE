import type { StatusTone } from '../components/ui/StatusPill';
import type { DocUiStatus } from '../types/document';
import type { LoadStatus } from '../types/load';

export type StatusPillConfig = { label: string; tone: StatusTone };

const LOAD_STATUS: Record<LoadStatus, StatusPillConfig> = {
  Active: { label: 'Aktif', tone: 'warning' },
  Assigned: { label: 'Atandı', tone: 'brand' },
  OnWay: { label: 'Yolda', tone: 'info' },
  Arrived: { label: 'Varıldı', tone: 'info' },
  Delivered: { label: 'Teslim', tone: 'success' },
  Cancelled: { label: 'İptal', tone: 'error' },
};

export function getLoadStatusPill(status: string): StatusPillConfig {
  if (status in LOAD_STATUS) return LOAD_STATUS[status as LoadStatus];
  return { label: status, tone: 'neutral' };
}

const BID_LABELS: Record<string, string> = {
  Pending: 'Beklemede',
  Accepted: 'Kabul edildi',
  Rejected: 'Reddedildi',
  Cancelled: 'İptal',
};

export function getBidStatusPill(status: string): StatusPillConfig {
  const s = status.toLowerCase();
  const label = BID_LABELS[status] ?? status;
  if (s.includes('accept') || s.includes('approved')) return { label, tone: 'success' };
  if (s.includes('reject') || s.includes('cancel')) return { label, tone: 'error' };
  if (s.includes('pending') || s.includes('wait')) return { label, tone: 'warning' };
  return { label, tone: 'neutral' };
}

/** AI min/max araligina gore teklif kiyas rozeti */
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

export function getApprovalStatusPill(status: string | undefined): StatusPillConfig {
  if (!status) return { label: 'Bilinmiyor', tone: 'neutral' };
  const s = status.toLowerCase();
  if (s === 'active' || s.includes('approv')) return { label: 'Onaylı', tone: 'success' };
  if (s.includes('reject')) return { label: 'Reddedildi', tone: 'error' };
  if (s.includes('pending') || s.includes('manual') || s.includes('review')) {
    return { label: 'Beklemede', tone: 'warning' };
  }
  return { label: status, tone: 'neutral' };
}

export function getPaymentStatusPill(status: string): StatusPillConfig {
  const s = status.toLowerCase();
  if (s === 'blocked') return { label: status, tone: 'warning' };
  if (s === 'released') return { label: status, tone: 'success' };
  return { label: status, tone: 'neutral' };
}

export function getSystemServicePill(value: string): StatusPillConfig {
  const v = value.toLowerCase();
  const online = v.includes('online') || v === 'ok';
  return { label: value, tone: online ? 'success' : 'error' };
}

export function getAiConfidencePill(score: number | null | undefined): StatusPillConfig {
  if (score == null) return { label: 'Güven: —', tone: 'neutral' };
  const label = `Güven %${Math.round(score)}`;
  if (score >= 80) return { label, tone: 'success' };
  if (score >= 50) return { label, tone: 'warning' };
  return { label, tone: 'error' };
}

const WALLET_TYPE_LABELS: Record<string, string> = {
  Hold: 'Bloke',
  Release: 'Ödeme',
  Commission: 'Şoför kom.',
  CustomerCommission: 'Müşteri kom.',
  Tax: 'Stopaj',
  Refund: 'İade',
  Blocked: 'Bloke',
  Released: 'Ödeme',
  Pending: 'Beklemede',
};

export function getWalletTxStatusPill(status: string): StatusPillConfig {
  const label = WALLET_TYPE_LABELS[status] ?? status;
  const s = status.toLowerCase();
  if (s === 'release' || s === 'released' || s === 'refund') {
    return { label, tone: 'success' };
  }
  if (s === 'commission' || s === 'customercommission' || s === 'tax' || s.includes('fail') || s.includes('cancel')) {
    return { label, tone: 'error' };
  }
  if (s === 'hold' || s === 'blocked' || s.includes('pending')) {
    return { label, tone: 'warning' };
  }
  if (s.includes('complete') || s.includes('success') || s === 'paid') {
    return { label, tone: 'success' };
  }
  return { label, tone: 'neutral' };
}
