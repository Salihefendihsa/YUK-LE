import type { LoadTypeValue, VehicleTypeValue } from '@navlonix/shared';
import type { Load } from './load';

// Ortak (web ↔ mobil birebir) tipler; mevcut çağrı yolları korunsun diye re-export.
export type { LoadTypeValue, VehicleTypeValue };

export interface CreateLoadPayload {
  fromCity: string;
  fromDistrict: string;
  toCity: string;
  toDistrict: string;
  fromLatitude: number;
  fromLongitude: number;
  toLatitude: number;
  toLongitude: number;
  pickupDate: string;
  deliveryDate: string;
  weight: number;
  volume?: number;
  loadType: LoadTypeValue;
  requiredVehicleType: VehicleTypeValue;
  price: number;
  currency: string;
  description?: string;
}

export interface AiMarketAnalysis {
  recommendedPrice: number;
  minPrice: number;
  maxPrice: number;
  reasoning: string;
  distanceKm: number;
  fuelPriceTl?: number;
  isAiGenerated?: boolean;
}

export interface CreateLoadResponse {
  load: Load;
  aiMarketAnalysis?: AiMarketAnalysis;
}

export interface AiPriceSuggestionResponse {
  loadId?: string;
  suggestion?: {
    recommendedPrice?: number;
    minPrice?: number;
    maxPrice?: number;
    reasoning?: string;
    distanceKm?: number;
  };
}
