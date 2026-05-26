import { formatWalletStatusLabel } from './displayLabels'

export type WalletTransactionRow = {
  id?: number
  loadId?: string | null
  amount?: number
  status?: string
  createdAt?: string
  description: string
}

const WALLET_TYPE_LABELS: Record<string, string> = {
  Hold: 'Ödeme beklemeye alındı',
  Release: 'Ödeme serbest bırakıldı',
  Commission: 'Şoför komisyonu',
  CustomerCommission: 'Müşteri payı komisyonu',
  Tax: 'Stopaj',
  Refund: 'İade',
}

function walletTxDescription(loadId: unknown, status: string): string {
  const key = String(status ?? '').trim()
  const base = WALLET_TYPE_LABELS[key] ?? formatWalletStatusLabel(status)
  const id = loadId != null && String(loadId) ? String(loadId).slice(0, 8) : ''
  return id ? `${base} (${id}…)` : base
}

/** Şoför cüzdan hareketleri — API Reason ham metni kullanılmaz. */
export function normalizeWalletTransactions(raw: unknown): WalletTransactionRow[] {
  const list = Array.isArray(raw) ? raw : []
  return list.map((item) => {
    const r = item as Record<string, unknown>
    const status = String(r.status ?? r.Status ?? '')
    return {
      id: r.id != null ? Number(r.id) : undefined,
      loadId: r.loadId != null ? String(r.loadId) : null,
      amount: Number(r.amount ?? 0),
      status,
      createdAt: String(r.createdAt ?? ''),
      description: walletTxDescription(r.loadId, status),
    }
  })
}
