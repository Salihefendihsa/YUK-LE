/** Kişisel veri maskeleme — boş/hatalı girdilerde çökmez. */

export function safeInitial(name: string | null | undefined): string {
  const t = String(name ?? '').trim()
  if (!t) return '?'
  return t[0]!.toUpperCase()
}

export function maskEmail(email: string | null | undefined): string {
  const raw = String(email ?? '').trim()
  if (!raw) return '—'
  const at = raw.indexOf('@')
  if (at <= 0) return '***@***'
  const user = raw.slice(0, at)
  const dom = raw.slice(at + 1)
  if (!dom) return '***@***'
  const prefix = user.length <= 2 ? user : `${user.slice(0, 2)}***`
  return `${prefix}@${dom}`
}

export function maskPhone(phone: string | null | undefined): string {
  const raw = String(phone ?? '').trim()
  if (!raw) return '—'
  const d = raw.replace(/\D/g, '')
  if (d.length < 4) return '***'
  return `*** *** ** ${d.slice(-2)}`
}

export function maskTax(tax: string | null | undefined): string {
  const t = String(tax ?? '').trim()
  if (!t) return '—'
  if (t.length < 6) return '***'
  return `${t.slice(0, 2)}******${t.slice(-2)}`
}

export function maskIban(iban: string | null | undefined): string {
  const t = String(iban ?? '').replace(/\s/g, '')
  if (!t) return '—'
  if (t.length < 8) return '****'
  return `${t.slice(0, 4)} **** **** **** **${t.slice(-4)}`
}
