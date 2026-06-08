/** Kullanıcıya görünen durum/eylem etiketleri — API enum değerleri ASCII kalır. */

const CUSTOMER_COMMISSION_RATE = 0.02
const DRIVER_COMMISSION_RATE = 0.02

function normalizeKey(raw: unknown): string {
  if (raw == null) return ''
  if (typeof raw === 'number') {
    const approvalByIndex: Record<number, string> = {
      0: 'Pending',
      1: 'Approved',
      2: 'Rejected',
      3: 'Active',
      4: 'ManualApprovalRequired',
      5: 'PendingReview',
    }
    return approvalByIndex[raw] ?? String(raw)
  }
  return String(raw).trim()
}

/** Yukle.Api.Models.LoadStatus — 0 Active … 5 Cancelled */
const LOAD_STATUS_BY_INDEX: Record<number, string> = {
  0: 'Active',
  1: 'Assigned',
  2: 'OnWay',
  3: 'Arrived',
  4: 'Delivered',
  5: 'Cancelled',
}

const LOAD_STATUS_LABELS: Record<string, string> = {
  Active: 'Yayında',
  Assigned: 'Atandı',
  OnWay: 'Yolda',
  Arrived: 'Varıldı',
  Delivered: 'Teslim edildi',
  Cancelled: 'İptal edildi',
}

/** Ham API status (sayı veya enum adı) → karşılaştırma anahtarı */
export function normalizeLoadStatusKey(raw: unknown): string {
  if (raw == null) return ''
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return LOAD_STATUS_BY_INDEX[raw] ?? String(raw)
  }
  const s = String(raw).trim()
  if (/^\d+$/.test(s)) {
    const n = Number(s)
    return LOAD_STATUS_BY_INDEX[n] ?? s
  }
  return s
}

export function formatLoadStatusLabel(status: unknown): string {
  const key = normalizeLoadStatusKey(status)
  if (LOAD_STATUS_LABELS[key]) return LOAD_STATUS_LABELS[key]
  const s = key.toLowerCase()
  if (s === 'active') return 'Yayında'
  if (s === 'assigned') return 'Atandı'
  if (s.includes('onway') || s === 'on_way') return 'Yolda'
  if (s === 'arrived') return 'Varıldı'
  if (s === 'delivered') return 'Teslim edildi'
  if (s === 'cancelled' || s.includes('cancel')) return 'İptal edildi'
  return key || 'Bilinmiyor'
}

/** Tablo / liste için renkli durum pill sınıfı */
export function getLoadStatusBadgeClass(status: unknown): string {
  const key = normalizeLoadStatusKey(status)
  switch (key) {
    case 'Active':
      return 'badge badge-load-active'
    case 'Assigned':
      return 'badge badge-load-assigned'
    case 'OnWay':
      return 'badge badge-load-onway'
    case 'Arrived':
    case 'Delivered':
      return 'badge badge-load-delivered'
    case 'Cancelled':
      return 'badge badge-load-cancelled'
    default:
      return 'badge badge-muted'
  }
}

const APPROVAL_STATUS_LABELS: Record<string, string> = {
  Active: 'Onaylı',
  Approved: 'Onaylı',
  Rejected: 'Reddedildi',
  Pending: 'Beklemede',
  ManualApprovalRequired: 'Manuel inceleme',
  PendingReview: 'İncelemede',
}

export function formatApprovalStatusLabel(status: unknown): string {
  const key = normalizeKey(status)
  if (APPROVAL_STATUS_LABELS[key]) return APPROVAL_STATUS_LABELS[key]
  const s = key.toLowerCase()
  if (s === 'active' || s.includes('approv')) return 'Onaylı'
  if (s.includes('reject')) return 'Reddedildi'
  if (s.includes('pending') || s.includes('manual') || s.includes('review')) return 'Beklemede'
  return key || 'Bilinmiyor'
}

/** Yukle.Api.Models.LoadType — 0 Paletli … 15 Kimyasal (sona eklemeli) */
const LOAD_TYPE_BY_INDEX: Record<number, string> = {
  0: 'Paletli',
  1: 'Dökme',
  2: 'SoğukZincir',
  3: 'TehlikeliMadde',
  4: 'Parsiyel',
  5: 'GenelKargo',
  6: 'Konteyner',
  7: 'ProjeAgirYuk',
  8: 'CanliHayvan',
  9: 'Gida',
  10: 'InsaatMalzemesi',
  11: 'AkaryakitSivi',
  12: 'TahilHububat',
  13: 'Otomotiv',
  14: 'MobilyaBeyazEsya',
  15: 'Kimyasal',
}

const LOAD_TYPE_LABELS: Record<string, string> = {
  General: 'Genel',
  Paletli: 'Paletli',
  Dökme: 'Dökme Yük',
  Dokme: 'Dökme Yük',
  SoğukZincir: 'Soğuk Zincir',
  SogukZincir: 'Soğuk Zincir',
  TehlikeliMadde: 'Tehlikeli Madde (ADR)',
  Parsiyel: 'Parsiyel',
  GenelKargo: 'Genel Kargo',
  Konteyner: 'Konteyner',
  ProjeAgirYuk: 'Proje / Ağır Yük',
  CanliHayvan: 'Canlı Hayvan',
  Gida: 'Gıda',
  InsaatMalzemesi: 'İnşaat Malzemesi',
  AkaryakitSivi: 'Akaryakıt / Sıvı',
  TahilHububat: 'Tahıl / Hububat',
  Otomotiv: 'Otomotiv (Araç Taşıma)',
  MobilyaBeyazEsya: 'Mobilya / Beyaz Eşya',
  Kimyasal: 'Kimyasal',
}

function typeKey(raw: unknown, byIndex: Record<number, string>): string {
  if (raw == null) return ''
  if (typeof raw === 'number' && Number.isFinite(raw)) return byIndex[raw] ?? String(raw)
  const s = String(raw).trim()
  if (/^\d+$/.test(s)) return byIndex[Number(s)] ?? s
  return s
}

export function formatLoadTypeLabel(type: unknown): string {
  const key = typeKey(type, LOAD_TYPE_BY_INDEX)
  if (LOAD_TYPE_LABELS[key]) return LOAD_TYPE_LABELS[key]
  return key || '—'
}

/** Yukle.Api.Models.VehicleType — 0 TIR … 11 Silobas (sona eklemeli) */
const VEHICLE_TYPE_BY_INDEX: Record<number, string> = {
  0: 'TIR',
  1: 'Kamyon',
  2: 'Kamyonet',
  3: 'Panelvan',
  4: 'Frigorifik',
  5: 'Tenteli',
  6: 'AcikKasa',
  7: 'Lowboy',
  8: 'Tanker',
  9: 'Damperli',
  10: 'KonteynerTasiyici',
  11: 'Silobas',
}

const VEHICLE_TYPE_LABELS: Record<string, string> = {
  TIR: 'TIR',
  Tir: 'TIR',
  Kamyon: 'Kamyon',
  Kamyonet: 'Kamyonet',
  Panelvan: 'Panelvan',
  Frigorifik: 'Frigorifik',
  Tenteli: 'Tenteli',
  AcikKasa: 'Açık Kasa (Platform)',
  Lowboy: 'Lowboy',
  Tanker: 'Tanker',
  Damperli: 'Damperli',
  KonteynerTasiyici: 'Konteyner Taşıyıcı',
  Silobas: 'Silobas',
}

export function formatVehicleTypeLabel(type: unknown): string {
  const key = typeKey(type, VEHICLE_TYPE_BY_INDEX)
  if (VEHICLE_TYPE_LABELS[key]) return VEHICLE_TYPE_LABELS[key]
  return key || '—'
}

const BID_STATUS_LABELS: Record<string, string> = {
  Pending: 'Beklemede',
  Accepted: 'Kabul edildi',
  Rejected: 'Reddedildi',
  Cancelled: 'İptal edildi',
}

export function formatBidStatusLabel(status: unknown): string {
  const key = normalizeKey(status)
  if (BID_STATUS_LABELS[key]) return BID_STATUS_LABELS[key]
  const s = key.toLowerCase()
  if (s.includes('pending') || s.includes('bekle')) return 'Beklemede'
  if (s.includes('accept') || s.includes('kabul')) return 'Kabul edildi'
  if (s.includes('reject') || s.includes('red')) return 'Reddedildi'
  if (s.includes('cancel') || s.includes('iptal')) return 'İptal edildi'
  return key || 'Bilinmiyor'
}

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  Pending: 'Bekleyen',
  Blocked: 'Bloke',
  Released: 'Serbest bırakıldı',
  Refunded: 'İade edildi',
  Failed: 'Başarısız',
}

export function formatPaymentStatusLabel(status: unknown): string {
  const key = normalizeKey(status)
  if (PAYMENT_STATUS_LABELS[key]) return PAYMENT_STATUS_LABELS[key]
  const s = key.toLowerCase()
  if (s === 'blocked' || s.includes('hold') || s.includes('bloke')) return 'Bloke'
  if (s === 'released' || s.includes('serbest')) return 'Serbest bırakıldı'
  if (s.includes('refund') || s.includes('iade')) return 'İade edildi'
  if (s.includes('fail')) return 'Başarısız'
  if (s.includes('pending') || s.includes('bekle')) return 'Bekleyen'
  return key || 'Bilinmiyor'
}

const WALLET_STATUS_LABELS: Record<string, string> = {
  Hold: 'Ödeme blokede',
  Release: 'Ödeme serbest bırakıldı',
  Commission: 'Şoför komisyonu',
  CustomerCommission: 'Müşteri komisyonu',
  Tax: 'Stopaj',
  Refund: 'İade',
  Blocked: 'Ödeme blokede',
  Released: 'Ödeme serbest bırakıldı',
  Pending: 'Bekleyen',
  Failed: 'Başarısız',
}

export function formatWalletStatusLabel(status: unknown): string {
  const key = normalizeKey(status)
  if (WALLET_STATUS_LABELS[key]) return WALLET_STATUS_LABELS[key]
  const s = key.toLowerCase()
  if (s === 'release' || s === 'released') return 'Ödeme serbest bırakıldı'
  if (s === 'hold' || s === 'blocked') return 'Ödeme blokede'
  if (s === 'commission') return 'Şoför komisyonu'
  if (s === 'customercommission') return 'Müşteri komisyonu'
  if (s === 'tax') return 'Stopaj'
  if (s.includes('refund') || s.includes('iade')) return 'İade'
  if (s.includes('fail')) return 'Başarısız'
  if (s.includes('pending') || s.includes('bekle')) return 'Bekleyen'
  return key || 'İşlem'
}

export function formatSystemServiceLabel(value: unknown): string {
  const v = normalizeKey(value).toLowerCase()
  if (!v) return '—'
  if (v.includes('online') || v === 'ok' || v.includes('up') || v.includes('healthy') || v === 'true') {
    return 'Çalışıyor'
  }
  if (v.includes('offline') || v.includes('down') || v.includes('fail') || v === 'false') {
    return 'Kapalı'
  }
  return formatPaymentStatusLabel(value)
}

/** Ödeme kaydı işlem kimliği — mock/iyzico/auth gibi iç önekler gizlenir */
export function formatPaymentTransactionId(raw: string | null | undefined): string {
  if (!raw?.trim()) return '—'
  const cleaned = raw
    .trim()
    .replace(/^mock_iyzico_auth_/i, '')
    .replace(/^mock_iyzico_/i, '')
    .replace(/^mock_/i, '')
    .replace(/^iyzico_/i, '')
    .replace(/^auth_/i, '')
  const suffix = (cleaned.length >= 6 ? cleaned.slice(-6) : cleaned) || raw.slice(-6)
  return `İşlem No: …${suffix}`
}

/** Müşteri toplamından platform payı tahmini (%2 + %2, teklif tutarı üzerinden) */
export function estimatePlatformCommissionFromCustomerTotal(customerTotal: number): number {
  if (!customerTotal || customerTotal <= 0) return 0
  const bid = customerTotal / (1 + CUSTOMER_COMMISSION_RATE)
  return bid * (CUSTOMER_COMMISSION_RATE + DRIVER_COMMISSION_RATE)
}

// Aksiyon adını normalize edip (lowercase + boşluk/_/- sil) tek tabloya bağlar.
// Mobil ADMIN_LOG_ACTION_LABELS (apps/mobile/.../utils/format.ts) ile birebir aynı.
const ADMIN_LOG_ACTION_LABELS: Record<string, string> = {
  suspenduser: 'Kullanıcı askıya alındı',
  activateuser: 'Kullanıcı etkinleştirildi',
  deactivateuser: 'Kullanıcı pasifleştirildi',
  warnuser: 'Kullanıcı uyarıldı',
  updateuser: 'Kullanıcı güncellendi',
  deleteuser: 'Kullanıcı silindi',
  createuser: 'Kullanıcı oluşturuldu',
  approvedriver: 'Şoför onaylandı',
  rejectdriver: 'Şoför reddedildi',
  approvereview: 'Belge incelemesi onaylandı',
  rejectreview: 'Belge incelemesi reddedildi',
  releasepayment: 'Ödeme serbest bırakıldı',
  paymentrelease: 'Ödeme serbest bırakıldı',
  blockpayment: 'Ödeme blokeye alındı',
  paymentblock: 'Ödeme blokeye alındı',
  refundpayment: 'Ödeme iade edildi',
  paymentrefund: 'Ödeme iade edildi',
  deleterating: 'Puan silindi',
  deletemessage: 'Mesaj silindi',
  blockmessage: 'Mesaj engellendi',
  cancelload: 'İlan iptal edildi',
  deleteload: 'İlan silindi',
  // AdminActionLog'un ham (kısa) aksiyon adları — AdminController WriteAdminActionLogAsync.
  suspend: 'Kullanıcı askıya alındı',
  activate: 'Kullanıcı etkinleştirildi',
  toggleactive: 'Kullanıcı durumu değiştirildi',
  warn: 'Kullanıcı uyarıldı',
  note: 'Not eklendi',
  approve: 'Belge incelemesi onaylandı',
  reject: 'Belge incelemesi reddedildi',
}

function normalizeAdminActionKey(action: string): string {
  return action.trim().toLowerCase().replace(/[\s_-]+/g, '')
}

export function formatAdminLogAction(action?: string | null): string {
  if (!action?.trim()) return 'İşlem'
  const trimmed = action.trim()
  const key = normalizeAdminActionKey(trimmed)
  if (ADMIN_LOG_ACTION_LABELS[key]) return ADMIN_LOG_ACTION_LABELS[key]
  if (hasTurkishChars(trimmed)) return trimmed
  if (isMostlyAsciiEnglish(trimmed)) {
    return trimmed.replace(/([a-z])([A-Z])/g, '$1 $2')
  }
  return trimmed
}

/**
 * Komuta Merkezi "Canlı Aktivite Akışı" tek-satır metni: ham AdminActionLog
 * (çoğu İngilizce + GUID'li / "IsActive=True" gibi) kaydını okunaklı Türkçeye
 * çevirir. Mobil formatAdminActivity ile birebir aynı mantık (iki tarafta tek davranış).
 * ToggleActive notundaki IsActive=True/False değerinden spesifik etiket üretir:
 *   IsActive=False → "Kullanıcı askıya alındı", IsActive=True → "Kullanıcı aktif edildi".
 */
export function formatAdminActivity(
  action?: string | null,
  note?: string | null,
  targetUserId?: number | null,
): string {
  const raw = note?.trim() ?? ''
  const actKey = normalizeAdminActionKey(action ?? '')

  // ToggleActive: ham not "IsActive=True/False" → spesifik etiket.
  if (actKey === 'toggleactive') {
    const m = raw.match(/IsActive\s*=\s*(true|false)/i)
    if (m) {
      const base =
        m[1].toLowerCase() === 'true' ? 'Kullanıcı aktif edildi' : 'Kullanıcı askıya alındı'
      return targetUserId != null ? `${base} · kullanıcı #${targetUserId}` : base
    }
  }

  const base = formatAdminLogAction(action)

  // 1) Yük bağlamı: "... for load <guid>" veya "load <guid>".
  const loadMatch = raw.match(/load\s+#?([0-9a-fA-F]{8})[0-9a-fA-F-]*/i)
  if (loadMatch) return `${base} · yük #${loadMatch[1]}`

  // 2) Nottaki ilk GUID → genel kısa referans.
  const guidMatch = raw.match(/([0-9a-fA-F]{8})-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-/)
  if (guidMatch) return `${base} · #${guidMatch[1]}`

  // 3) Kullanıcı hedefi.
  if (targetUserId != null) return `${base} · kullanıcı #${targetUserId}`

  return base
}

function hasTurkishChars(text: string): boolean {
  return /[ğıüşöçİĞÜŞÖÇ]/.test(text)
}

function isMostlyAsciiEnglish(text: string): boolean {
  const trimmed = text.trim()
  if (!trimmed) return false
  if (hasTurkishChars(trimmed)) return false
  return /^[\x20-\x7E]+$/.test(trimmed)
}
