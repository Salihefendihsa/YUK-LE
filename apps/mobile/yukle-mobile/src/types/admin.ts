export interface AdminSystemStatus {
  api?: string;
  db?: string;
  redis?: string;
}

export interface AdminSystemWorkers {
  uetdsPending?: number;
}

export interface AdminSystemInfo {
  api: string;
  db: string;
  workers?: AdminSystemWorkers;
}

export interface SystemExternalStatus {
  message?: string;
  environment?: string;
  framework?: string;
  serverTime?: string;
}

export interface AdminLogRow {
  id: number;
  adminId?: number;
  targetUserId?: number | null;
  action?: string;
  note?: string | null;
  timestampUtc: string;
}

export interface AdminBlockedMessageRow {
  senderId: string;
  senderName: string;
  loadId: string;
  message: string;
  timestampUtc: string;
}

export interface AdminChatSummaryRow {
  loadId: string;
  customerName: string;
  driverName: string;
  route: string;
  lastMessage: string;
  lastMessageAt: string;
  messageCount: number;
}

export interface AdminChatMessageRow {
  id: string;
  loadId: string;
  senderUserId: number;
  senderName: string;
  senderRole: string;
  message: string;
  createdAt: string;
  isBlocked: boolean;
  blockReason?: string | null;
}

export interface AdminActiveDriverRow {
  loadId: string;
  driverId: number;
  driverName: string;
  plate: string;
  lastKnownLat?: number | null;
  lastKnownLng?: number | null;
  lastLocationUpdate?: string | null;
  route: string;
}

export interface AdminRatingRow {
  id: string;
  givenByName: string;
  givenToName: string;
  score: number;
  comment: string;
  loadId: string;
  createdAt: string;
}

export interface AdminRecentAction {
  id: number;
  adminId?: number;
  targetUserId?: number | null;
  action?: string;
  note?: string | null;
  timestampUtc: string;
}

export interface PendingReview {
  id: number;
  fullName: string;
  phone: string;
  email: string;
  createdAt: string;
  approvalStatus?: string;
  adminReviewNote?: string | null;
  aiInferenceDetails?: string | null;
}

export interface AiInferenceParsed {
  documentType?: string;
  isValid?: boolean;
  isSealDetected?: boolean;
  confidenceScore?: number;
  validationMessage?: string;
  expiryDate?: string;
  documentClasses?: string[];
  documentUrl?: string;
  previewUrl?: string;
  imageUrl?: string;
  nameMatch?: boolean;
  tcMatch?: boolean;
  licenseClass?: string;
  validUntil?: string;
  suspiciousNotes?: string;
  raw: Record<string, unknown>;
}

export interface AdminReviewDecision {
  isApproved: boolean;
  reason: string;
  documentType?: string;
}

export interface AdminDriverRow {
  id: number;
  fullName: string;
  phone: string;
  email: string;
  isActive: boolean;
  approvalStatus: string;
  vehicle?: string | null;
  rating: number;
}

export interface AdminCustomerRow {
  id: number;
  fullName: string;
  phone: string;
  email: string;
  isActive: boolean;
  totalLoadCount: number;
  totalSpent: number;
}

/** Liste + detay navigasyonu icin birlestirilmis satir */
export interface AdminLoadRow {
  id: string;
  fromCity: string;
  toCity: string;
  status: string;
  price: number;
  createdAt: string;
  customerName?: string | null;
  driverName?: string | null;
}

export interface AdminPaymentRow {
  id: string;
  loadId: string;
  transactionId: string;
  amount: number;
  status: string;
  createdAt: string;
  updatedAt?: string | null;
}

export interface AdminUserListItem {
  id: number;
  role: 'Driver' | 'Customer';
  fullName: string;
  phone: string;
  email: string;
  isActive: boolean;
  approvalStatus?: string;
  vehicle?: string | null;
  rating?: number;
  totalLoadCount?: number;
  totalSpent?: number;
}

export interface AdminDashboardStats {
  totalUsers: number;
  activeLoadCount: number;
  pendingReviewCount: number;
  totalTransactionVolume: number;
  systemStatus?: AdminSystemStatus;
  recentActions: AdminRecentAction[];
}
