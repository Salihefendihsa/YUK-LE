/**
 * Emanet (escrow) ödeme durumu — backend PaymentStatus enum string'i ile birebir.
 * Web (api/payments.ts) ve mobil (services/payments.service.ts) tek kaynaktan tüketir.
 */
export type PaymentStatus = 'Held' | 'Released' | 'Refunded';
