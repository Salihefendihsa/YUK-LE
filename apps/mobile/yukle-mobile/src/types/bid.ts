export interface DriverBid {
  id: number;
  loadId: string;
  fromCity: string;
  toCity: string;
  amount: number;
  note?: string | null;
  offerDate: string;
  status: string;
}

/** Musteri: ilana gelen teklif satiri */
export interface LoadBid {
  id: number;
  amount: number;
  note?: string | null;
  offerDate: string;
  status: string;
  driverFullName: string;
  driverPhone: string;
}

export interface DeliveryQrResponse {
  loadId: string;
  token: string;
  expiresInMinutes: number;
}
