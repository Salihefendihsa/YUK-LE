import type { Load } from './load';

/** API enum: VehicleType */
export type VehicleTypeValue = 0 | 1 | 2 | 3;

/** API enum: LoadType */
export type LoadTypeValue = 0 | 1 | 2 | 3 | 4;

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
