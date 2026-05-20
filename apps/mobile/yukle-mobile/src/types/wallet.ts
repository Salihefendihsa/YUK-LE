export interface WalletSummary {
  walletBalance: number;
  pendingBalance: number;
  monthAmount: number;
}

export interface WalletTransaction {
  id: number;
  loadId?: string | null;
  amount: number;
  status: string;
  createdAt: string;
  description?: string;
  direction?: 'in' | 'out' | 'pending';
}
