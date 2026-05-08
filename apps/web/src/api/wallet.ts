import { apiClient } from './client'

export async function getWalletSummary() {
  const res = await apiClient.get('/Wallet')
  return res.data
}

export async function getWalletTransactions(from?: string, to?: string) {
  const res = await apiClient.get('/Wallet/transactions', { params: { from, to } })
  return res.data
}
