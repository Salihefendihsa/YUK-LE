/** Matches GET /Dashboard for Driver role (camelCase JSON). */
export interface DriverDashboard {
  completedJobCount: number;
  activeBidCount: number;
  totalEarnings: number;
}

/** Matches GET /Dashboard for Customer role (camelCase JSON). */
export interface CustomerDashboard {
  activeLoadCount: number;
  onWayLoadCount: number;
  deliveredLoadCount: number;
  totalSpent: number;
}
