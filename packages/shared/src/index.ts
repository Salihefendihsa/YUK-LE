/**
 * @navlonix/shared — Navlonix web ↔ mobil ortak sözleşme barrel'ı.
 * Kaynak (TS) doğrudan tüketilir (Vite alias · Metro extraNodeModules · tsconfig paths).
 * Build adımı yok; saf refactor (yalnızca import yolu değişir).
 */
export type { PaymentStatus } from './domain/payment';
export type { SupportStatus, SupportSenderRole } from './domain/support';
export { supportStatusLabel, slaRemainingLabel } from './domain/support';
