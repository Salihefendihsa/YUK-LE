export interface DriverHistoryRow {
  id: string;
  fromCity: string;
  toCity: string;
  deliveryDate?: string | null;
  price: number;
  customerName?: string | null;
  status?: string;
}

export interface DriverHistoryResponse {
  items: DriverHistoryRow[];
  totalEarn: number;
  tripCount: number;
  total: number;
}

/** Musteri: GET /Loads/history */
export interface CustomerHistoryRow {
  id: string;
  fromCity: string;
  toCity: string;
  deliveryDate?: string | null;
  price: number;
  driverName?: string | null;
  status?: string;
}

export interface CustomerHistoryResponse {
  items: CustomerHistoryRow[];
  totalSpend: number;
  total: number;
}
