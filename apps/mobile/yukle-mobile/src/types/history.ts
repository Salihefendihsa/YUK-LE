export interface DriverHistoryRow {
  id: string;
  fromCity: string;
  toCity: string;
  deliveryDate?: string | null;
  price: number;
  customerName?: string | null;
  status?: string;
  /** Wallet Release satırından; yoksa liste fiyatı gösterilmez */
  netEarn?: number | null;
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
  /** Ödeme kaydı / kabul edilen teklif tutarı */
  actualSpend?: number | null;
}

export interface CustomerHistoryResponse {
  items: CustomerHistoryRow[];
  totalSpend: number;
  total: number;
}
