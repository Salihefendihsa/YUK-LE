/**
 * Dashboard sözleşmesi — GET /Dashboard (camelCase JSON).
 * CustomerDashboard web + mobilde BİREBİR AYNI. (DriverDashboard iki tarafta farklı
 * alan adları/sayısı içerdiğinden paylaşılmaz; platforma özgü kalır.)
 */
export interface CustomerDashboard {
  activeLoadCount: number;
  onWayLoadCount: number;
  deliveredLoadCount: number;
  totalSpent: number;
}
