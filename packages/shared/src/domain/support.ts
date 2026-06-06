/**
 * Destek talebi sözleşmesi + saf durum/SLA mantığı — backend SupportTicketStatus /
 * SupportSenderRole ile birebir. Web (api/support.ts) ve mobil
 * (services/support.service.ts) tek kaynaktan tüketir. RENDER (renk/tone) platforma
 * özel kalır; burada yalnızca platform-bağımsız etiket + SLA metni üretilir.
 */
export type SupportStatus = 'Open' | 'Answered' | 'Resolved' | 'Closed';
export type SupportSenderRole = 'User' | 'Admin' | 'AI';

const STATUS_LABELS: Record<SupportStatus, string> = {
  Open: 'Operatör Bekliyor',
  Answered: 'Yanıtlandı',
  Resolved: 'Çözüldü',
  Closed: 'Kapatıldı',
};

export function supportStatusLabel(status: SupportStatus): string {
  return STATUS_LABELS[status] ?? status;
}

/** SLA için kalan süreyi insan-okur biçimde verir. Geçmişse "gecikmiş" döner. */
export function slaRemainingLabel(slaDeadline: string, status: SupportStatus): string {
  if (status === 'Resolved' || status === 'Closed') return 'Tamamlandı';
  const ms = new Date(slaDeadline).getTime() - Date.now();
  if (Number.isNaN(ms)) return '';
  if (ms <= 0) return 'SLA gecikmiş';
  const hours = Math.floor(ms / 3_600_000);
  const mins = Math.floor((ms % 3_600_000) / 60_000);
  if (hours >= 1) return `SLA: ~${hours} sa ${mins} dk kaldı`;
  return `SLA: ~${mins} dk kaldı`;
}
