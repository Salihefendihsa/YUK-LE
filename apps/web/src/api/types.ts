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
export interface CustomerDashboard {
  activeLoadCount: number
  onWayLoadCount: number
  deliveredLoadCount: number
  totalSpent: number
}

export interface DriverDashboard {
  activeOffersCount: number
  completedLoadsCount: number
  totalEarned: number
  rating: number
}

// ── Loads ─────────────────────────────────────────────────────────────
export type LoadStatus = 'Active' | 'Assigned' | 'OnWay' | 'Delivered' | 'Cancelled'
export type VehicleType = 'Tir' | 'Kamyon' | 'Frigorifik' | 'Lowboy' | 'Tanker'
export type LoadType = 'General' | 'Paletli' | 'Dokme' | 'SogukZincir' | 'TehlikeliMadde' | 'Parsiyel'

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
  loadType: LoadType
  requiredVehicleType: VehicleType
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
