/** Sunucu/istemci hata metinlerini kullanıcıya Türkçe gösterir (log anahtarları ASCII kalır). */

const EXACT_TR: Record<string, string> = {
  'sunucuya baglanilamadi. backend acik mi kontrol edin.':
    'Sunucuya bağlanılamadı. İnternet bağlantınızı ve uygulamanın çalıştığını kontrol edin.',
  'islem basarisiz. tekrar deneyin.': 'İşlem başarısız. Lütfen tekrar deneyin.',
  'oturum gecersiz. tekrar giris yapin.': 'Oturum geçersiz. Lütfen tekrar giriş yapın.',
  'bu islem icin yetkiniz yok.': 'Bu işlem için yetkiniz yok.',
  'kaynak bulunamadi.': 'İstenen kayıt bulunamadı.',
  'sunucu hatasi. tekrar deneyin.': 'Sunucu hatası. Lütfen tekrar deneyin.',
  unauthorized: 'Oturum geçersiz. Lütfen tekrar giriş yapın.',
  forbidden: 'Bu işlem için yetkiniz yok.',
  'not found': 'İstenen kayıt bulunamadı.',
  'bad request': 'Geçersiz istek. Bilgileri kontrol edip tekrar deneyin.',
  'internal server error': 'Sunucu hatası. Lütfen tekrar deneyin.',
  'network error': 'Ağ hatası. Bağlantınızı kontrol edin.',
  'request failed with status code 401': 'Oturum geçersiz. Lütfen tekrar giriş yapın.',
  'request failed with status code 403': 'Bu işlem için yetkiniz yok.',
  'request failed with status code 404': 'İstenen kayıt bulunamadı.',
  'request failed with status code 500': 'Sunucu hatası. Lütfen tekrar deneyin.',
  'kimlik dogrulamasi gerekli.': 'Oturum doğrulanamadı. Lütfen tekrar giriş yapın.',
  'yuk bulunamadi.': 'İlan bulunamadı.',
  'bu yukun mesajlarina erisim yetkiniz yok.': 'Bu ilanın mesajlarına erişim yetkiniz yok.',
}

const PHRASE_TR: [string, string][] = [
  ['unauthorized', 'Oturum geçersiz. Lütfen tekrar giriş yapın.'],
  ['forbidden', 'Bu işlem için yetkiniz yok.'],
  ['not found', 'İstenen kayıt bulunamadı.'],
  ['bad request', 'Geçersiz istek. Lütfen tekrar deneyin.'],
  ['timeout', 'İstek zaman aşımına uğradı. Tekrar deneyin.'],
  ['network', 'Ağ hatası. Bağlantınızı kontrol edin.'],
  ['token', 'Oturum süresi doldu. Tekrar giriş yapın.'],
  ['password', 'Şifre işlemi başarısız. Bilgileri kontrol edin.'],
  ['invalid', 'Girilen bilgiler geçersiz.'],
  ['already exists', 'Bu kayıt zaten mevcut.'],
  ['conflict', 'İşlem çakışması. Sayfayı yenileyip tekrar deneyin.'],
]

function hasTurkishChars(text: string): boolean {
  return /[ğıüşöçİĞÜŞÖÇ]/.test(text)
}

function isMostlyAsciiEnglish(text: string): boolean {
  const trimmed = text.trim()
  if (!trimmed) return false
  if (hasTurkishChars(trimmed)) return false
  return /^[\x20-\x7E]+$/.test(trimmed)
}

/** Ham API/axios mesajını kullanıcı dostu Türkçeye çevirir. */
export function translateUserFacingError(message: string): string {
  const trimmed = message.trim()
  if (!trimmed) return 'Bir hata oluştu. Lütfen tekrar deneyin.'

  const lower = trimmed.toLowerCase()
  if (EXACT_TR[lower]) return EXACT_TR[lower]

  for (const [needle, tr] of PHRASE_TR) {
    if (lower.includes(needle)) return tr
  }

  if (isMostlyAsciiEnglish(trimmed)) {
    return 'Bir hata oluştu. Lütfen tekrar deneyin.'
  }

  return trimmed
}

export function formatExternalStatusMessage(raw?: string | null): string {
  if (!raw?.trim()) return 'Sunucu yanıt vermiyor veya bilgi alınamadı.'

  const msg = translateUserFacingError(raw)
  if (msg !== 'Bir hata oluştu. Lütfen tekrar deneyin.') return msg

  const lower = raw.trim().toLowerCase()
  if (lower.includes('healthy') || lower.includes('running') || lower === 'ok' || lower.includes('online')) {
    return 'Sistem çalışıyor.'
  }
  if (lower.includes('degraded') || lower.includes('warning')) {
    return 'Sistem kısıtlı çalışıyor.'
  }
  if (lower.includes('down') || lower.includes('error') || lower.includes('fail') || lower.includes('offline')) {
    return 'Sistemde sorun algılandı.'
  }

  return 'Durum bilgisi alındı.'
}

export function formatExternalEnvironmentLabel(raw?: string | null): string {
  if (!raw?.trim()) return '—'
  const map: Record<string, string> = {
    development: 'Geliştirme',
    staging: 'Test',
    production: 'Canlı',
  }
  return map[raw.trim().toLowerCase()] ?? raw.trim()
}

export function formatExternalFrameworkLabel(raw?: string | null): string {
  if (!raw?.trim()) return '—'
  const v = raw.trim()
  if (/^[\d.]+$/.test(v)) return `Sürüm ${v}`
  if (isMostlyAsciiEnglish(v)) return 'Uygulama sunucusu'
  return v
}
