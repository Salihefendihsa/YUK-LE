import { apiClient } from './client'

export interface PendingReview {
  id: number
  fullName: string
  phone: string
  email: string
  adminReviewNote?: string
  aiInferenceDetails?: string
  createdAt: string
}

export async function getPendingReviews(): Promise<PendingReview[]> {
  const res = await apiClient.get<PendingReview[]>('/Admin/pending-reviews')
  return res.data
}

export async function decideReview(userId: number, isApproved: boolean, reason: string) {
  const res = await apiClient.post(`/Admin/reviews/${userId}/decide`, {
    isApproved,
    reason,
  })
  return res.data
}

export async function getAdminDashboard() {
  const res = await apiClient.get('/Admin/dashboard')
  return res.data
}

export async function getAdminBlockedMessages() {
  const res = await apiClient.get('/Admin/blocked-messages')
  return res.data
}

export async function getDrivers(status?: string) {
  return getAdminDrivers(status)
}

export async function getCustomers() {
  return getAdminCustomers()
}

export async function toggleUserActive(userId: number) {
  const res = await apiClient.post(`/Admin/users/${userId}/toggle-active`)
  return res.data
}

export type AdminCustomerRow = {
  id: number
  fullName: string
  phone: string
  email: string
  isActive: boolean
  totalLoadCount: number
  totalSpent: number
}

export type AdminDriverRow = {
  id: number
  fullName: string
  phone: string
  email: string
  isActive: boolean
  approvalStatus: string
  vehicle?: string
  rating: number
}

export type AdminLoadRow = {
  id: string
  fromCity: string
  toCity: string
  status: string
  price: number
  createdAt: string
  customerName?: string | null
  driverName?: string | null
}

export type AdminPaymentRow = {
  id: string
  loadId: string
  transactionId: string
  amount: number
  status: string
  createdAt: string
  updatedAt?: string | null
}

export type CustomerStats = {
  totalLoads: number
  delivered: number
  cancelled: number
  totalSpend: number
}

export type DriverStats = {
  totalTrips: number
  totalWeight: number
  totalEarnings: number
  topRoutes: { route: string; count: number }[]
}

export type AdminRatingRow = {
  id: string
  givenByName: string
  givenToName: string
  score: number
  comment: string
  loadId: string
  createdAt: string
}

function normalizeCustomerRow(raw: unknown): AdminCustomerRow {
  const r = raw as Record<string, unknown>
  return {
    id: Number(r.id ?? 0),
    fullName: String(r.fullName ?? ''),
    phone: String(r.phone ?? ''),
    email: String(r.email ?? ''),
    isActive: Boolean(r.isActive ?? r.IsActive ?? true),
    totalLoadCount: Number(r.totalLoadCount ?? r.TotalLoadCount ?? 0),
    totalSpent: Number(r.totalSpent ?? r.TotalSpent ?? 0),
  }
}

function normalizeDriverRow(raw: unknown): AdminDriverRow {
  const r = raw as Record<string, unknown>
  return {
    id: Number(r.id ?? 0),
    fullName: String(r.fullName ?? ''),
    phone: String(r.phone ?? ''),
    email: String(r.email ?? ''),
    isActive: Boolean(r.isActive ?? r.IsActive ?? true),
    approvalStatus: String(r.approvalStatus ?? r.ApprovalStatus ?? ''),
    vehicle: r.vehicle != null ? String(r.vehicle) : undefined,
    rating: Number(r.rating ?? r.Rating ?? 0),
  }
}

function normalizeAdminLoad(raw: unknown): AdminLoadRow {
  const r = raw as Record<string, unknown>
  return {
    id: String(r.id ?? ''),
    fromCity: String(r.fromCity ?? r.FromCity ?? ''),
    toCity: String(r.toCity ?? r.ToCity ?? ''),
    status: String(r.status ?? r.Status ?? ''),
    price: Number(r.price ?? r.Price ?? 0),
    createdAt: String(r.createdAt ?? r.CreatedAt ?? ''),
    customerName:
      r.customerName != null
        ? String(r.customerName)
        : r.CustomerName != null
          ? String(r.CustomerName)
          : null,
    driverName:
      r.driverName != null ? String(r.driverName) : r.DriverName != null ? String(r.DriverName) : null,
  }
}

function normalizeAdminPayment(raw: unknown): AdminPaymentRow {
  const r = raw as Record<string, unknown>
  return {
    id: String(r.id ?? ''),
    loadId: String(r.loadId ?? r.LoadId ?? ''),
    transactionId: String(r.transactionId ?? r.TransactionId ?? ''),
    amount: Number(r.amount ?? r.Amount ?? 0),
    status: String(r.status ?? r.Status ?? ''),
    createdAt: String(r.createdAt ?? r.CreatedAt ?? ''),
    updatedAt: r.updatedAt != null ? String(r.updatedAt) : r.UpdatedAt != null ? String(r.UpdatedAt) : null,
  }
}

function normalizeRatingRow(raw: unknown): AdminRatingRow {
  const r = raw as Record<string, unknown>
  return {
    id: String(r.id ?? ''),
    givenByName: String(r.givenByName ?? r.GivenByName ?? ''),
    givenToName: String(r.givenToName ?? r.GivenToName ?? ''),
    score: Number(r.score ?? r.Score ?? 0),
    comment: String(r.comment ?? r.Comment ?? ''),
    loadId: String(r.loadId ?? r.LoadId ?? ''),
    createdAt: String(r.createdAt ?? r.CreatedAt ?? ''),
  }
}

export async function getAdminCustomers(): Promise<AdminCustomerRow[]> {
  const res = await apiClient.get('/Admin/customers')
  const data = res.data
  if (!Array.isArray(data)) return []
  return data.map(normalizeCustomerRow)
}

export async function getAdminDrivers(status?: string): Promise<AdminDriverRow[]> {
  const res = await apiClient.get('/Admin/drivers', { params: { status } })
  const data = res.data
  if (!Array.isArray(data)) return []
  return data.map(normalizeDriverRow)
}

export async function getAdminLoads(params?: {
  status?: string
  q?: string
  fromCity?: string
  dateFrom?: string
  dateTo?: string
  customerId?: number
  driverId?: number
}): Promise<AdminLoadRow[]> {
  const res = await apiClient.get('/Admin/loads', { params })
  const data = res.data
  if (!Array.isArray(data)) return []
  return data.map(normalizeAdminLoad)
}

export async function cancelAdminLoad(loadId: string, reason?: string) {
  const res = await apiClient.post(`/Admin/loads/${loadId}/cancel`, { reason: reason ?? null })
  return res.data
}

// ── Boş Araç İlanları (DriverListing) Moderasyonu — backend 7ff7acc ───────────

/** Backend AdminDriverListingDto karşılığı. */
export type AdminDriverListingRow = {
  id: string
  driverId: number
  driverName: string
  originCity: string
  originDistrict: string
  destinationCity: string
  destinationDistrict: string
  vehicleType: string
  availableFrom: string
  status: string
  offerCount: number
  createdAt: string
}

/** Backend ListingOfferDto karşılığı (admin teklif görünümü). */
export type AdminListingOfferRow = {
  id: string
  driverListingId: string
  loadId: string
  customerId: number
  customerName: string
  fromCity: string
  fromDistrict: string
  toCity: string
  toDistrict: string
  loadPrice: number
  amount?: number | null
  note?: string | null
  status: string
  createdAt: string
}

/** { Total, Items } veya düz dizi olabilir — her ikisini de karşıla. */
function unwrapItems<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  const items =
    (data as { items?: unknown; Items?: unknown })?.items ??
    (data as { Items?: unknown })?.Items
  return Array.isArray(items) ? (items as T[]) : []
}

export async function getAdminDriverListings(status?: string): Promise<AdminDriverListingRow[]> {
  const params: Record<string, string> = {}
  if (status?.trim()) params.status = status.trim()
  const res = await apiClient.get('/Admin/driver-listings', { params })
  return unwrapItems<AdminDriverListingRow>(res.data)
}

export async function getAdminDriverListingOffers(id: string): Promise<AdminListingOfferRow[]> {
  const res = await apiClient.get(`/Admin/driver-listings/${id}/offers`)
  return unwrapItems<AdminListingOfferRow>(res.data)
}

export async function cancelAdminDriverListing(
  id: string,
  note?: string,
): Promise<{ message: string; rejectedOffers: number }> {
  const res = await apiClient.post(`/Admin/driver-listings/${id}/cancel`, { text: note ?? null })
  const d = res.data as Record<string, unknown>
  return {
    message: String(d.message ?? d.Message ?? 'İlan kaldırıldı.'),
    rejectedOffers: Number(d.rejectedOffers ?? d.RejectedOffers ?? 0),
  }
}

export async function getAdminPayments(params?: {
  status?: string
  customerId?: number
}): Promise<AdminPaymentRow[]> {
  const res = await apiClient.get('/Admin/payments', { params })
  const data = res.data
  if (!Array.isArray(data)) return []
  return data.map(normalizeAdminPayment)
}

/** @deprecated use getAdminPayments */
export async function getPayments(params?: { status?: string; customerId?: number }) {
  return getAdminPayments(params)
}

/** GET /Admin/customers/{id}/stats */
export async function getCustomerStats(id: number): Promise<CustomerStats> {
  const res = await apiClient.get(`/Admin/customers/${id}/stats`)
  const r = res.data as Record<string, unknown>
  return {
    totalLoads: Number(r.totalLoads ?? r.TotalLoads ?? 0),
    delivered: Number(r.delivered ?? r.Delivered ?? 0),
    cancelled: Number(r.cancelled ?? r.Cancelled ?? 0),
    totalSpend: Number(r.totalSpend ?? r.TotalSpend ?? 0),
  }
}

/** GET /Admin/drivers/{id}/stats */
export async function getDriverStats(id: number): Promise<DriverStats> {
  const res = await apiClient.get(`/Admin/drivers/${id}/stats`)
  const r = res.data as Record<string, unknown>
  const topRaw = r.topRoutes ?? r.TopRoutes
  const topRoutes = Array.isArray(topRaw)
    ? topRaw.map((x) => {
        const item = x as Record<string, unknown>
        return {
          route: String(item.route ?? item.Route ?? ''),
          count: Number(item.count ?? item.Count ?? 0),
        }
      })
    : []
  return {
    totalTrips: Number(r.totalTrips ?? r.TotalTrips ?? 0),
    totalWeight: Number(r.totalWeight ?? r.TotalWeight ?? 0),
    totalEarnings: Number(r.totalEarnings ?? r.TotalEarnings ?? 0),
    topRoutes,
  }
}

export async function suspendUser(userId: number, reason: string) {
  await apiClient.put(`/Admin/users/${userId}/suspend`, { reason })
}

export async function activateUser(userId: number) {
  await apiClient.put(`/Admin/users/${userId}/activate`)
}

export async function addUserNote(userId: number, text: string) {
  await apiClient.post(`/Admin/users/${userId}/note`, { text })
}

export async function warnUser(userId: number, reason?: string) {
  await apiClient.post(`/Admin/users/${userId}/warn`, { reason: reason?.trim() || 'Uyarı' })
}

/** GET /Ratings/all */
export async function getAllRatings(params?: {
  filter?: string
  dateFrom?: string
  dateTo?: string
}): Promise<AdminRatingRow[]> {
  const res = await apiClient.get('/Ratings/all', { params })
  const data = res.data
  if (!Array.isArray(data)) return []
  return data.map(normalizeRatingRow)
}

/** DELETE /Ratings/{id} */
export async function deleteRating(id: string) {
  await apiClient.delete(`/Ratings/${id}`)
}

export async function releasePayment(paymentId: string) {
  const res = await apiClient.post(`/Admin/payments/${paymentId}/release`)
  return res.data
}

export async function getAdminLogs() {
  const res = await apiClient.get('/Admin/logs')
  return res.data
}

export async function getAdminSystemStatus() {
  const [adminRes, systemRes] = await Promise.all([
    apiClient.get('/Admin/system'),
    apiClient.get('/System/status'),
  ])
  return { ...adminRes.data, external: systemRes.data }
}

export async function getAdminUsers() {
  const [drivers, customers] = await Promise.all([getDrivers(), getCustomers()])
  return [
    ...drivers.map((d: Record<string, unknown>) => ({ ...d, role: 'Driver' })),
    ...customers.map((c: Record<string, unknown>) => ({ ...c, role: 'Customer' })),
  ]
}

export type AdminActiveDriverRow = {
  loadId: string
  driverId: number
  driverName: string
  plate: string
  lastKnownLat: number | null
  lastKnownLng: number | null
  lastLocationUpdate: string | null
  route: string
}

function normalizeActiveDriver(raw: unknown): AdminActiveDriverRow {
  const r = raw as Record<string, unknown>
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
  }
}

/** GET /Admin/active-drivers */
export async function getAdminActiveDrivers(): Promise<AdminActiveDriverRow[]> {
  const res = await apiClient.get('/Admin/active-drivers')
  const data = res.data
  if (!Array.isArray(data)) return []
  return data.map(normalizeActiveDriver)
}

export type AdminChatSummaryRow = {
  loadId: string
  customerName: string
  driverName: string
  route: string
  lastMessage: string
  lastMessageAt: string
  messageCount: number
}

export type AdminChatMessageRow = {
  id: string
  loadId: string
  senderUserId: number
  senderName: string
  senderRole: string
  message: string
  createdAt: string
  isBlocked: boolean
  blockReason?: string | null
}

function normalizeChatSummary(raw: unknown): AdminChatSummaryRow {
  const r = raw as Record<string, unknown>
  return {
    loadId: String(r.loadId ?? r.LoadId ?? ''),
    customerName: String(r.customerName ?? r.CustomerName ?? '-'),
    driverName: String(r.driverName ?? r.DriverName ?? '-'),
    route: String(r.route ?? r.Route ?? ''),
    lastMessage: String(r.lastMessage ?? r.LastMessage ?? ''),
    lastMessageAt: String(r.lastMessageAt ?? r.LastMessageAt ?? ''),
    messageCount: Number(r.messageCount ?? r.MessageCount ?? 0),
  }
}

function normalizeChatMessage(raw: unknown): AdminChatMessageRow {
  const r = raw as Record<string, unknown>
  return {
    id: String(r.id ?? r.Id ?? ''),
    loadId: String(r.loadId ?? r.LoadId ?? ''),
    senderUserId: Number(r.senderUserId ?? r.SenderUserId ?? 0),
    senderName: String(r.senderName ?? r.SenderName ?? ''),
    senderRole: String(r.senderRole ?? r.SenderRole ?? ''),
    message: String(r.message ?? r.Message ?? ''),
    createdAt: String(r.createdAt ?? r.CreatedAt ?? ''),
    isBlocked: Boolean(r.isBlocked ?? r.IsBlocked),
    blockReason:
      r.blockReason != null ? String(r.blockReason) : r.BlockReason != null ? String(r.BlockReason) : null,
  }
}

/** GET /Admin/chats — tüm konuşma özetleri (read-only) */
export async function getAdminChats(): Promise<AdminChatSummaryRow[]> {
  const res = await apiClient.get('/Admin/chats')
  const data = res.data
  if (!Array.isArray(data)) return []
  return data.map(normalizeChatSummary)
}

/** GET /Admin/chats/{loadId} — bir yükün tam transkripti (engellenmiş dahil, read-only) */
export async function getAdminChatMessages(loadId: string): Promise<AdminChatMessageRow[]> {
  const res = await apiClient.get(`/Admin/chats/${loadId}`)
  const data = res.data
  if (!Array.isArray(data)) return []
  return data.map(normalizeChatMessage)
}
