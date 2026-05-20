export type LoadStatus =
  | 'Active'
  | 'Assigned'
  | 'OnWay'
  | 'Arrived'
  | 'Delivered'
  | 'Cancelled';

export interface Load {
  id: string;
  fromCity: string;
  fromDistrict: string;
  toCity: string;
  toDistrict: string;
  description: string;
  pickupDate: string;
  deliveryDate: string;
  weight: number;
  volume: number;
  type: string;
  price: number;
  currency: string;
  ownerId: number;
  ownerFullName: string;
  driverId?: number | null;
  destinationLat: number;
  destinationLng: number;
  requiredVehicleType?: string;
  loadType?: string;
  status: LoadStatus;
  createdAt: string;
  bidCount: number;
  aiSuggestedPrice?: number | null;
  aiMinPrice?: number | null;
  aiMaxPrice?: number | null;
  aiPriceReasoning?: string | null;
  distanceKm?: number | null;
}
