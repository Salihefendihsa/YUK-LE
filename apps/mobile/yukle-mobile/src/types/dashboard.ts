import type { CustomerDashboard } from '@navlonix/shared';

/** CustomerDashboard ortak (web ↔ mobil birebir); re-export ile çağrı yolu korunur. */
export type { CustomerDashboard };

/** Matches GET /Dashboard for Driver role (camelCase JSON). */
export interface DriverDashboard {
  completedJobCount: number;
  activeBidCount: number;
  totalEarnings: number;
}
