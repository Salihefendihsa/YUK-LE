// Ortak (web ↔ mobil birebir) tipler @navlonix/shared'den; mevcut çağrı yolları
// (../api/types) korunsun diye buradan re-export edilir.
import type {
  CustomerDashboard,
  LoadStatus,
  LoadTypeValue,
  VehicleTypeValue,
} from '@navlonix/shared'

export type { CustomerDashboard, LoadStatus, LoadTypeValue, VehicleTypeValue }

// ── Auth ──────────────────────────────────────────────────────────────
export interface LoginRequest {
  phone: string
  password: string
}

export interface RegisterRequest {
  fullName: string
  phone: string
  email: string
  password: string
  role: 'Customer' | 'Driver'
  isCorporate: boolean
  companyName: string
  taxNumber: string
  companyAddress: string
  tcIdentityNumber: string
  birthDate: string
  iban: string
  address: string
  licenseClass: string
  acceptedKvkk: boolean
  acceptedTerms: boolean
  acceptedLocationTracking: boolean
  taxNumberOrTCKN: string
}

export interface VerifyOtpRequest {
  phone: string
  code: string
}

export interface RefreshTokenRequest {
  token: string
  refreshToken: string
}

export type ApprovalStatus = 'Pending' | 'Approved' | 'Active' | 'Rejected' | 'ManualApprovalRequired' | 'PendingReview'

export interface LoginResponse {
  token: string
  expiration: string
  refreshToken: string
  refreshTokenExpiration: string
  userId: number
  fullName: string
  role: 'Customer' | 'Driver' | 'Admin'
  isPhoneVerified: boolean
  isActive: boolean
  approvalStatus: ApprovalStatus
}

// ── Dashboard ─────────────────────────────────────────────────────────
// CustomerDashboard @navlonix/shared'dan (üstte re-export).
export interface DriverDashboard {
  activeOffersCount: number
  completedLoadsCount: number
  totalEarned: number
  rating: number
}

// ── Loads ─────────────────────────────────────────────────────────────
// LoadStatus @navlonix/shared'dan (üstte re-export).
// Backend enum üye adlarıyla birebir hizalı (Yukle.Api/Models/Enums.cs).
export type VehicleType =
  | 'TIR'
  | 'Kamyon'
  | 'Kamyonet'
  | 'Panelvan'
  | 'Frigorifik'
  | 'Tenteli'
  | 'AcikKasa'
  | 'Lowboy'
  | 'Tanker'
  | 'Damperli'
  | 'KonteynerTasiyici'
  | 'Silobas'
export type LoadType =
  | 'Paletli'
  | 'Dökme'
  | 'SoğukZincir'
  | 'TehlikeliMadde'
  | 'Parsiyel'
  | 'GenelKargo'
  | 'Konteyner'
  | 'ProjeAgirYuk'
  | 'CanliHayvan'
  | 'Gida'
  | 'InsaatMalzemesi'
  | 'AkaryakitSivi'
  | 'TahilHububat'
  | 'Otomotiv'
  | 'MobilyaBeyazEsya'
  | 'Kimyasal'

// Backend System.Text.Json enum'ları integer index bekler (mobil paritesi).
// VehicleTypeValue / LoadTypeValue @navlonix/shared'dan (üstte re-export).

export interface Load {
  id: string
  fromCity: string
  fromDistrict: string
  toCity: string
  toDistrict: string
  description: string
  pickupDate: string
  deliveryDate: string
  weight: number
  volume: number
  type: string
  price: number
  currency: string
  ownerId: number
  ownerFullName: string
  driverId?: number | null
  destinationLat: number
  destinationLng: number
  requiredVehicleType?: VehicleType
  loadType?: LoadType
  aiSuggestedPrice?: number
  aiMinPrice?: number
  aiMaxPrice?: number
  aiPriceReasoning?: string
  status: LoadStatus
  createdAt: string
  bidCount: number
}

export interface CreateLoadRequest {
  fromCity: string
  fromDistrict: string
  toCity: string
  toDistrict: string
  fromLatitude: number
  fromLongitude: number
  toLatitude: number
  toLongitude: number
  pickupDate: string
  deliveryDate: string
  weight: number
  volume?: number
  // Backend enum index olarak gönderilir (mobil ile aynı; string isim deserialize edilmez).
  loadType: LoadTypeValue
  requiredVehicleType: VehicleTypeValue
  price: number
  currency: string
  description?: string
}

export interface CreateLoadResponse {
  load: Load
  aiMarketAnalysis: {
    recommendedPrice: number
    minPrice: number
    maxPrice: number
    reasoning: string
    distanceKm: number
    fuelPriceTl: number
    isAiGenerated: boolean
  }
}

// ── Bids ──────────────────────────────────────────────────────────────
export type BidStatus = 'Pending' | 'Accepted' | 'Rejected' | 'Cancelled' | string

export interface Bid {
  id: number
  amount: number
  note?: string
  offerDate: string
  status: BidStatus
  driverFullName: string
  driverPhone: string
}

export interface CreateBidRequest {
  loadId: string
  amount: number
  note?: string
}

// Şoförün verdiği teklifler (GET /Bids/driver → DriverBidListDto)
export interface DriverBid {
  id: number
  loadId: string
  fromCity: string
  toCity: string
  amount: number
  note?: string
  offerDate: string
  status: BidStatus
}

// ── Matching ──────────────────────────────────────────────────────────
export interface MatchedLoad {
  load: Load
  match: {
    loadId: string
    matchScore: number
    personalizedReason: string
    priorityTag: string
    isAiGenerated: boolean
  }
}

// ── API generic ───────────────────────────────────────────────────────
export interface ApiError {
  message: string
  statusCode?: number
}

export interface PagedResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}
