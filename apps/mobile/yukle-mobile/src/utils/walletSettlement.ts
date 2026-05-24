import type { SettlementPreview } from '../types/settlement';
import type { WalletTransaction } from '../types/wallet';

export type LoadSettlementFromLedger = {
  loadId: string;
  hasRelease: boolean;
  settlement: SettlementPreview;
};

/** Şoför audit loglarından yük bazlı ödeme dökümü */
export function buildDriverSettlementsFromTransactions(
  txs: WalletTransaction[]
): LoadSettlementFromLedger[] {
  const byLoad = new Map<string, WalletTransaction[]>();
  for (const tx of txs) {
    if (!tx.loadId) continue;
    const list = byLoad.get(tx.loadId) ?? [];
    list.push(tx);
    byLoad.set(tx.loadId, list);
  }

  const results: LoadSettlementFromLedger[] = [];

  for (const [loadId, items] of byLoad) {
    const hold = items.find((t) => t.status === 'Hold');
    if (!hold) continue;

    const driverNet = hold.amount;
    const driverCommission =
      items.find((t) => t.status === 'Commission')?.amount ?? 0;
    const customerCommission =
      items.find((t) => t.status === 'CustomerCommission')?.amount ?? 0;
    const withholding = items.find((t) => t.status === 'Tax')?.amount ?? 0;
    const bidAmount = round2(driverNet + driverCommission + withholding);
    const hasRelease = items.some((t) => t.status === 'Release');

    results.push({
      loadId,
      hasRelease,
      settlement: {
        bidAmount,
        driverCommission,
        customerCommission,
        withholding,
        driverNet,
        customerTotal: round2(bidAmount + customerCommission),
        platformRevenue: round2(driverCommission + customerCommission),
        driverCommissionRate: bidAmount > 0 ? driverCommission / bidAmount : 0,
        customerCommissionRate: bidAmount > 0 ? customerCommission / bidAmount : 0,
        stopajRate: bidAmount > 0 ? withholding / bidAmount : 0,
      },
    });
  }

  return results.sort((a, b) => b.loadId.localeCompare(a.loadId));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
