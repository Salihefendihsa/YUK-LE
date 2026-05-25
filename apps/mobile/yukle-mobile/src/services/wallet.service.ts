import type { WalletSummary, WalletTransaction } from '../types/wallet';
import { apiClient } from './api.client';

function normalizeSummary(raw: unknown): WalletSummary {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    walletBalance: Number(r.walletBalance ?? 0),
    pendingBalance: Number(r.pendingBalance ?? 0),
    monthAmount: Number(r.monthAmount ?? 0),
  };
}

const AUDIT_LABELS: Record<string, string> = {
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

function txDescription(
  loadId: unknown,
  status: string,
  reason?: string | null
): string {
  const id = loadId ? String(loadId).slice(0, 8) : '';
  const base = AUDIT_LABELS[status] ?? 'Cüzdan hareketi';
  const suffix = id ? ` (${id}…)` : '';
  if (reason?.trim()) return `${base}${suffix}: ${reason.trim()}`;
  return `${base}${suffix}`;
}

/** WalletAuditLogType / PaymentStatus → hareket yönü */
function txDirection(status: string): WalletTransaction['direction'] {
  const s = status.toLowerCase();
  if (s === 'release' || s === 'released' || s === 'refund' || s === 'refunded') return 'in';
  if (s === 'commission' || s === 'customercommission' || s === 'tax' || s === 'failed') return 'out';
  if (s === 'hold' || s === 'blocked' || s === 'pending') return 'pending';
  return 'pending';
}

function normalizeTransactions(raw: unknown): WalletTransaction[] {
  const list = Array.isArray(raw) ? raw : [];
  return list.map((item) => {
    const r = item as Record<string, unknown>;
    const status = String(r.status ?? r.Status ?? '-');
    const reason = r.reason != null ? String(r.reason) : r.Reason != null ? String(r.Reason) : null;
    return {
      id: Number(r.id ?? 0),
      loadId: r.loadId != null ? String(r.loadId) : null,
      amount: Number(r.amount ?? 0),
      status,
      createdAt: String(r.createdAt ?? ''),
      description: txDescription(r.loadId, status, reason),
      direction: txDirection(status),
    };
  });
}

/** loadId → net Release tutarı (şoför kazancı) */
export function mapReleaseEarningsByLoadId(transactions: WalletTransaction[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const tx of transactions) {
    if (tx.loadId && tx.status === 'Release') {
      map.set(tx.loadId, tx.amount);
    }
  }
  return map;
}

export function sumReleaseEarnings(transactions: WalletTransaction[]): number {
  return transactions
    .filter((tx) => tx.status === 'Release')
    .reduce((sum, tx) => sum + tx.amount, 0);
}

/** Müşteri: loadId → ödenen tutar (Released öncelikli, yoksa Blocked) */
export function mapCustomerPaymentByLoadId(
  transactions: WalletTransaction[]
): Map<string, number> {
  const map = new Map<string, number>();
  for (const tx of transactions) {
    if (!tx.loadId) continue;
    const s = tx.status.toLowerCase();
    if (s === 'blocked' && !map.has(tx.loadId)) {
      map.set(tx.loadId, tx.amount);
    }
  }
  for (const tx of transactions) {
    if (!tx.loadId) continue;
    if (tx.status.toLowerCase() === 'released') {
      map.set(tx.loadId, tx.amount);
    }
  }
  return map;
}

export function sumCustomerPayments(transactions: WalletTransaction[]): number {
  let total = 0;
  mapCustomerPaymentByLoadId(transactions).forEach((amount) => {
    total += amount;
  });
  return total;
}

export async function getWalletSummary(): Promise<WalletSummary> {
  const res = await apiClient.get('/Wallet');
  return normalizeSummary(res.data);
}

export async function getWalletTransactions(from?: string, to?: string): Promise<WalletTransaction[]> {
  const res = await apiClient.get('/Wallet/transactions', { params: { from, to } });
  return normalizeTransactions(res.data);
}
