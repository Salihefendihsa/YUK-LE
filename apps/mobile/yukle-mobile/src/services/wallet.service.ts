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

function txDescription(loadId: unknown, status: string): string {
  const id = loadId ? String(loadId).slice(0, 8) : '';
  if (status === 'Released') return id ? `Yük ödemesi (${id}...)` : 'Yük ödemesi';
  if (status === 'Blocked') return id ? `Bloke tutar (${id}...)` : 'Bloke tutar';
  if (status === 'Pending') return 'Bekleyen islem';
  if (status === 'Refunded') return 'Iade';
  if (status === 'Failed') return 'Basarisiz islem';
  return 'Cüzdan hareketi';
}

function txDirection(status: string): WalletTransaction['direction'] {
  if (status === 'Released') return 'in';
  if (status === 'Refunded' || status === 'Failed') return 'out';
  return 'pending';
}

function normalizeTransactions(raw: unknown): WalletTransaction[] {
  const list = Array.isArray(raw) ? raw : [];
  return list.map((item) => {
    const r = item as Record<string, unknown>;
    const status = String(r.status ?? '-');
    return {
      id: Number(r.id ?? 0),
      loadId: r.loadId != null ? String(r.loadId) : null,
      amount: Number(r.amount ?? 0),
      status,
      createdAt: String(r.createdAt ?? ''),
      description: txDescription(r.loadId, status),
      direction: txDirection(status),
    };
  });
}

export async function getWalletSummary(): Promise<WalletSummary> {
  const res = await apiClient.get('/Wallet');
  return normalizeSummary(res.data);
}

export async function getWalletTransactions(from?: string, to?: string): Promise<WalletTransaction[]> {
  const res = await apiClient.get('/Wallet/transactions', { params: { from, to } });
  return normalizeTransactions(res.data);
}
