/** ISO string -> kullaniciya Turkce tarih/saat gosterimi */
export function formatDateTimeTR(iso: string | undefined | null): string {
  if (!iso) return 'Tarih seçin';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Tarih seçin';
  return d.toLocaleString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** datetime-local input icin yerel format (web) */
export function isoToLocalInputValue(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** datetime-local -> ISO */
export function localInputValueToIso(value: string): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString();
}
