/**
 * Hata metni çevirisi çekirdeği @navlonix/shared'den; mevcut çağrı yolları
 * (../utils/apiErrors) korunsun diye buradan re-export edilir.
 * formatExternalStatusMessage web'e özgü (online/offline işler) → LOKAL kalır.
 */
import { translateUserFacingError } from '@navlonix/shared'

export {
  translateUserFacingError,
  formatExternalEnvironmentLabel,
  formatExternalFrameworkLabel,
} from '@navlonix/shared'

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
