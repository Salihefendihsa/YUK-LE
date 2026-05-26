import { apiClient } from './client'
import { normalizeWalletTransactions, type WalletTransactionRow } from '../utils/walletTransactions'

export async function getWalletSummary() {
  const res = await apiClient.get('/Wallet')
  return res.data
}

export async function getWalletTransactions(
  from?: string,
  to?: string
): Promise<WalletTransactionRow[]> {
  const res = await apiClient.get('/Wallet/transactions', { params: { from, to } })
  return normalizeWalletTransactions(res.data)
}
