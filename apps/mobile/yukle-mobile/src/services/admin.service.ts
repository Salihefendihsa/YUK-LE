import type {
  AdminActiveDriverRow,
  AdminBlockedMessageRow,
  AdminChatMessageRow,
  AdminChatSummaryRow,
  AdminCustomerRow,
  AdminDashboardStats,
  AdminDriverRow,
  AdminLoadRow,
  AdminLogRow,
  AdminPaymentRow,
  AdminRatingRow,
  AdminRecentAction,
  AdminReviewDecision,
  AdminSystemInfo,
  AdminSystemStatus,
  AdminUserListItem,
  AiInferenceParsed,
  PendingReview,
  SystemExternalStatus,
} from '../types/admin';
import { apiClient } from './api.client';

export function parseAiInferenceDetails(raw?: string | null): AiInferenceParsed {
  if (!raw) return { raw: {} };
  try {
    const o = JSON.parse(raw) as Record<string, unknown>;
    return {
      documentType: o.DocumentType != null ? String(o.DocumentType) : undefined,
      isValid: o.IsValid != null ? Boolean(o.IsValid) : undefined,
      isSealDetected: o.IsSealDetected != null ? Boolean(o.IsSealDetected) : undefined,
      confidenceScore: o.ConfidenceScore != null ? Number(o.ConfidenceScore) : undefined,
      validationMessage: o.ValidationMessage != null ? String(o.ValidationMessage) : undefined,
      expiryDate: o.ExpiryDate != null ? String(o.ExpiryDate) : undefined,
      documentClasses: Array.isArray(o.DocumentClasses)
        ? o.DocumentClasses.map(String)
        : undefined,
      documentUrl:
        typeof o.DocumentUrl === 'string'
          ? o.DocumentUrl
          : typeof o.PreviewUrl === 'string'
            ? o.PreviewUrl
            : typeof o.ImageUrl === 'string'
              ? o.ImageUrl
              : undefined,
      nameMatch: o.NameMatch != null ? Boolean(o.NameMatch) : undefined,
      tcMatch: o.TcMatch != null ? Boolean(o.TcMatch) : undefined,
      licenseClass: o.LicenseClass != null ? String(o.LicenseClass) : undefined,
      validUntil: o.ValidUntil != null ? String(o.ValidUntil) : undefined,
      suspiciousNotes: o.SuspiciousNotes != null ? String(o.SuspiciousNotes) : undefined,
      raw: o,
    };
  } catch {
    return { raw: {} };
  }
}

function normalizePendingReview(raw: unknown): PendingReview {
  const r = raw as Record<string, unknown>;
  return {
    id: Number(r.id ?? 0),
    fullName: String(r.fullName ?? ''),
    phone: String(r.phone ?? ''),
    email: String(r.email ?? ''),
    createdAt: String(r.createdAt ?? ''),
    adminReviewNote: r.adminReviewNote != null ? String(r.adminReviewNote) : null,
    aiInferenceDetails: r.aiInferenceDetails != null ? String(r.aiInferenceDetails) : null,
  };
}

/** GET /Admin/pending-reviews */
export async function getPendingReviews(): Promise<PendingReview[]> {
  const res = await apiClient.get('/Admin/pending-reviews');
  const data = res.data;
  if (!Array.isArray(data)) return [];
  return data.map(normalizePendingReview);
}

/** POST /Admin/reviews/{userId}/decide */
export async function decideReview(userId: number, body: AdminReviewDecision): Promise<void> {
  await apiClient.post(`/Admin/reviews/${userId}/decide`, {
    isApproved: body.isApproved,
    reason: body.reason,
  });
}

function normalizeRecentAction(raw: unknown): AdminRecentAction {
  const r = raw as Record<string, unknown>;
  return {
    id: Number(r.id ?? 0),
    adminId: r.adminId != null ? Number(r.adminId) : undefined,
    targetUserId: r.targetUserId != null ? Number(r.targetUserId) : null,
    action: r.action != null ? String(r.action) : undefined,
    note: r.note != null ? String(r.note) : null,
    timestampUtc: String(r.timestampUtc ?? ''),
  };
}

function normalizeSystemStatus(raw: unknown): AdminSystemStatus | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const s = raw as Record<string, unknown>;
  return {
    api: s.api != null ? String(s.api) : undefined,
    db: s.db != null ? String(s.db) : undefined,
    redis: s.redis != null ? String(s.redis) : undefined,
  };
}

function normalizeDashboard(raw: unknown): AdminDashboardStats {
  const d = (raw ?? {}) as Record<string, unknown>;
  const sys = d.systemStatus ?? d.SystemStatus;
  const actions = d.recentActions ?? d.RecentActions;
  return {
    totalUsers: Number(d.totalUsers ?? d.TotalUsers ?? 0),
    activeLoadCount: Number(d.activeLoadCount ?? d.ActiveLoadCount ?? 0),
    pendingReviewCount: Number(d.pendingReviewCount ?? d.PendingReviewCount ?? 0),
    totalTransactionVolume: Number(d.totalTransactionVolume ?? d.TotalTransactionVolume ?? 0),
    systemStatus: normalizeSystemStatus(sys),
    recentActions: Array.isArray(actions) ? actions.map(normalizeRecentAction) : [],
  };
}

function normalizeDriverRow(raw: unknown): AdminDriverRow {
  const r = raw as Record<string, unknown>;
  return {
    id: Number(r.id ?? 0),
    fullName: String(r.fullName ?? ''),
    phone: String(r.phone ?? ''),
    email: String(r.email ?? ''),
    isActive: Boolean(r.isActive),
    approvalStatus: String(r.approvalStatus ?? r.ApprovalStatus ?? '-'),
    vehicle: r.vehicle != null ? String(r.vehicle) : null,
    rating: Number(r.rating ?? r.Rating ?? 0),
  };
}

function normalizeCustomerRow(raw: unknown): AdminCustomerRow {
  const r = raw as Record<string, unknown>;
  return {
    id: Number(r.id ?? 0),
    fullName: String(r.fullName ?? ''),
    phone: String(r.phone ?? ''),
    email: String(r.email ?? ''),
    isActive: Boolean(r.isActive),
    totalLoadCount: Number(r.totalLoadCount ?? r.TotalLoadCount ?? 0),
    totalSpent: Number(r.totalSpent ?? r.TotalSpent ?? 0),
  };
}

export function driverToListItem(d: AdminDriverRow): AdminUserListItem {
  return {
    id: d.id,
    role: 'Driver',
    fullName: d.fullName,
    phone: d.phone,
    email: d.email,
    isActive: d.isActive,
    approvalStatus: d.approvalStatus,
    vehicle: d.vehicle,
    rating: d.rating,
  };
}

export function customerToListItem(c: AdminCustomerRow): AdminUserListItem {
  return {
    id: c.id,
    role: 'Customer',
    fullName: c.fullName,
    phone: c.phone,
    email: c.email,
    isActive: c.isActive,
    totalLoadCount: c.totalLoadCount,
    totalSpent: c.totalSpent,
  };
}

/** GET /Admin/drivers */
export async function getAdminDrivers(params?: {
  status?: string;
  search?: string;
}): Promise<AdminDriverRow[]> {
  const res = await apiClient.get('/Admin/drivers', { params });
  const data = res.data;
  if (!Array.isArray(data)) return [];
  return data.map(normalizeDriverRow);
}

/** GET /Admin/customers */
export async function getAdminCustomers(params?: {
  status?: string;
  search?: string;
}): Promise<AdminCustomerRow[]> {
  const res = await apiClient.get('/Admin/customers', { params });
  const data = res.data;
  if (!Array.isArray(data)) return [];
  return data.map(normalizeCustomerRow);
}

/** POST /Admin/users/{userId}/toggle-active */
export async function toggleUserActive(userId: number): Promise<{ id: number; isActive: boolean }> {
  const res = await apiClient.post(`/Admin/users/${userId}/toggle-active`);
  const d = res.data as Record<string, unknown>;
  return {
    id: Number(d.id ?? userId),
    isActive: Boolean(d.isActive ?? d.IsActive),
  };
}

function normalizeAdminLoad(raw: unknown): AdminLoadRow {
  const r = raw as Record<string, unknown>;
  return {
    id: String(r.id ?? ''),
    fromCity: String(r.fromCity ?? ''),
    toCity: String(r.toCity ?? ''),
    status: String(r.status ?? r.Status ?? ''),
    price: Number(r.price ?? r.Price ?? 0),
    createdAt: String(r.createdAt ?? r.CreatedAt ?? ''),
  };
}

function normalizeAdminPayment(raw: unknown): AdminPaymentRow {
  const r = raw as Record<string, unknown>;
  return {
    id: String(r.id ?? ''),
    loadId: String(r.loadId ?? r.LoadId ?? ''),
    transactionId: String(r.transactionId ?? r.TransactionId ?? ''),
    amount: Number(r.amount ?? r.Amount ?? 0),
    status: String(r.status ?? r.Status ?? ''),
    createdAt: String(r.createdAt ?? r.CreatedAt ?? ''),
    updatedAt: r.updatedAt != null ? String(r.updatedAt) : null,
  };
}

/** GET /Admin/loads */
export async function getAdminLoads(params?: {
  status?: string;
  q?: string;
}): Promise<AdminLoadRow[]> {
  const res = await apiClient.get('/Admin/loads', { params });
  const data = res.data;
  if (!Array.isArray(data)) return [];
  return data.map(normalizeAdminLoad);
}

/** POST /Admin/loads/{loadId}/cancel */
export async function cancelAdminLoad(loadId: string): Promise<void> {
  await apiClient.post(`/Admin/loads/${loadId}/cancel`);
}

/** GET /Admin/payments */
export async function getAdminPayments(params?: { status?: string }): Promise<AdminPaymentRow[]> {
  const res = await apiClient.get('/Admin/payments', { params });
  const data = res.data;
  if (!Array.isArray(data)) return [];
  return data.map(normalizeAdminPayment);
}

/** POST /Admin/payments/{paymentId}/release */
export async function releaseAdminPayment(paymentId: string): Promise<void> {
  await apiClient.post(`/Admin/payments/${paymentId}/release`);
}

/** GET /Admin/dashboard */
export async function getAdminDashboard(): Promise<AdminDashboardStats> {
  const res = await apiClient.get('/Admin/dashboard');
  return normalizeDashboard(res.data);
}

function normalizeAdminLog(raw: unknown): AdminLogRow {
  const r = raw as Record<string, unknown>;
  return {
    id: Number(r.id ?? 0),
    adminId: r.adminId != null ? Number(r.adminId) : undefined,
    targetUserId: r.targetUserId != null ? Number(r.targetUserId) : null,
    action: r.action != null ? String(r.action) : undefined,
    note: r.note != null ? String(r.note) : null,
    timestampUtc: String(r.timestampUtc ?? ''),
  };
}

function normalizeSystemInfo(raw: unknown): AdminSystemInfo {
  const r = (raw ?? {}) as Record<string, unknown>;
  const workers = r.workers as Record<string, unknown> | undefined;
  return {
    api: String(r.api ?? '-'),
    db: String(r.db ?? '-'),
    workers: workers
      ? { uetdsPending: Number(workers.uetdsPending ?? workers.UetdsPending ?? 0) }
      : undefined,
  };
}

function normalizeExternalStatus(raw: unknown): SystemExternalStatus {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    message: r.message != null ? String(r.message) : r.Message != null ? String(r.Message) : undefined,
    environment:
      r.environment != null
        ? String(r.environment)
        : r.Environment != null
          ? String(r.Environment)
          : undefined,
    framework:
      r.framework != null ? String(r.framework) : r.Framework != null ? String(r.Framework) : undefined,
    serverTime:
      r.serverTime != null
        ? String(r.serverTime)
        : r.ServerTime != null
          ? String(r.ServerTime)
          : undefined,
  };
}

/** GET /Admin/system + GET /System/status */
export async function getAdminSystemFull(): Promise<{
  system: AdminSystemInfo;
  external: SystemExternalStatus;
}> {
  const [adminRes, systemRes] = await Promise.all([
    apiClient.get('/Admin/system'),
    apiClient.get('/System/status'),
  ]);
  return {
    system: normalizeSystemInfo(adminRes.data),
    external: normalizeExternalStatus(systemRes.data),
  };
}

/** GET /Admin/logs */
export async function getAdminLogs(): Promise<AdminLogRow[]> {
  const res = await apiClient.get('/Admin/logs');
  const data = res.data;
  if (!Array.isArray(data)) return [];
  return data.map(normalizeAdminLog);
}

function normalizeBlockedMessage(raw: unknown): AdminBlockedMessageRow {
  const r = raw as Record<string, unknown>;
  return {
    senderId: String(r.senderId ?? r.SenderId ?? ''),
    senderName: String(r.senderName ?? r.SenderName ?? ''),
    loadId: String(r.loadId ?? r.LoadId ?? ''),
    message: String(r.message ?? r.Message ?? ''),
    timestampUtc: String(r.timestampUtc ?? r.TimestampUtc ?? ''),
  };
}

/** GET /Admin/blocked-messages */
export async function getAdminBlockedMessages(): Promise<AdminBlockedMessageRow[]> {
  const res = await apiClient.get('/Admin/blocked-messages');
  const data = res.data;
  if (!Array.isArray(data)) return [];
  return data.map(normalizeBlockedMessage);
}

function normalizeChatSummary(raw: unknown): AdminChatSummaryRow {
  const r = raw as Record<string, unknown>;
  return {
    loadId: String(r.loadId ?? r.LoadId ?? ''),
    customerName: String(r.customerName ?? r.CustomerName ?? '-'),
    driverName: String(r.driverName ?? r.DriverName ?? '-'),
    route: String(r.route ?? r.Route ?? ''),
    lastMessage: String(r.lastMessage ?? r.LastMessage ?? ''),
    lastMessageAt: String(r.lastMessageAt ?? r.LastMessageAt ?? ''),
    messageCount: Number(r.messageCount ?? r.MessageCount ?? 0),
  };
}

function normalizeChatMessage(raw: unknown): AdminChatMessageRow {
  const r = raw as Record<string, unknown>;
  return {
    id: String(r.id ?? ''),
    loadId: String(r.loadId ?? ''),
    senderUserId: Number(r.senderUserId ?? 0),
    senderName: String(r.senderName ?? ''),
    senderRole: String(r.senderRole ?? ''),
    message: String(r.message ?? ''),
    createdAt: String(r.createdAt ?? ''),
    isBlocked: Boolean(r.isBlocked ?? r.IsBlocked),
    blockReason: r.blockReason != null ? String(r.blockReason) : null,
  };
}

/** GET /Admin/chats */
export async function getAdminChats(): Promise<AdminChatSummaryRow[]> {
  const res = await apiClient.get('/Admin/chats');
  const data = res.data;
  if (!Array.isArray(data)) return [];
  return data.map(normalizeChatSummary);
}

/** GET /Admin/chats/{loadId} */
export async function getAdminChatMessages(loadId: string): Promise<AdminChatMessageRow[]> {
  const res = await apiClient.get(`/Admin/chats/${loadId}`);
  const data = res.data;
  if (!Array.isArray(data)) return [];
  return data.map(normalizeChatMessage);
}

function normalizeActiveDriver(raw: unknown): AdminActiveDriverRow {
  const r = raw as Record<string, unknown>;
  return {
    loadId: String(r.loadId ?? r.LoadId ?? ''),
    driverId: Number(r.driverId ?? r.DriverId ?? 0),
    driverName: String(r.driverName ?? r.DriverName ?? '?'),
    plate: String(r.plate ?? r.Plate ?? ''),
    lastKnownLat:
      r.lastKnownLat != null
        ? Number(r.lastKnownLat)
        : r.LastKnownLat != null
          ? Number(r.LastKnownLat)
          : null,
    lastKnownLng:
      r.lastKnownLng != null
        ? Number(r.lastKnownLng)
        : r.LastKnownLng != null
          ? Number(r.LastKnownLng)
          : null,
    lastLocationUpdate:
      r.lastLocationUpdate != null
        ? String(r.lastLocationUpdate)
        : r.LastLocationUpdate != null
          ? String(r.LastLocationUpdate)
          : null,
    route: String(r.route ?? r.Route ?? ''),
  };
}

/** GET /Admin/active-drivers */
export async function getAdminActiveDrivers(): Promise<AdminActiveDriverRow[]> {
  const res = await apiClient.get('/Admin/active-drivers');
  const data = res.data;
  if (!Array.isArray(data)) return [];
  return data.map(normalizeActiveDriver);
}

function normalizeRatingRow(raw: unknown): AdminRatingRow {
  const r = raw as Record<string, unknown>;
  return {
    id: String(r.id ?? ''),
    givenByName: String(r.givenByName ?? r.GivenByName ?? ''),
    givenToName: String(r.givenToName ?? r.GivenToName ?? ''),
    score: Number(r.score ?? r.Score ?? 0),
    comment: String(r.comment ?? r.Comment ?? ''),
    loadId: String(r.loadId ?? r.LoadId ?? ''),
    createdAt: String(r.createdAt ?? r.CreatedAt ?? ''),
  };
}

/** GET /Ratings/all */
export async function getAllRatings(params?: {
  filter?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<AdminRatingRow[]> {
  const res = await apiClient.get('/Ratings/all', { params });
  const data = res.data;
  if (!Array.isArray(data)) return [];
  return data.map(normalizeRatingRow);
}

/** DELETE /Ratings/{id} */
export async function deleteRating(id: string): Promise<void> {
  await apiClient.delete(`/Ratings/${id}`);
}
