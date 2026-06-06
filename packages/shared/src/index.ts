/**
 * @navlonix/shared — Navlonix web ↔ mobil ortak sözleşme barrel'ı.
 * Kaynak (TS) doğrudan tüketilir (Vite alias · Metro extraNodeModules · tsconfig paths).
 * Build adımı yok; saf refactor (yalnızca import yolu değişir).
 */
export type { PaymentStatus } from './domain/payment';
export type { SupportStatus, SupportSenderRole } from './domain/support';
export { supportStatusLabel, slaRemainingLabel } from './domain/support';
export type { LoadStatus, VehicleTypeValue, LoadTypeValue } from './domain/load';
export type { CustomerDashboard } from './domain/dashboard';
export {
  translateUserFacingError,
  isMostlyAsciiEnglish,
  formatExternalEnvironmentLabel,
  formatExternalFrameworkLabel,
} from './util/apiErrors';
export type { AccessTokenFactory } from './realtime/signalr';
