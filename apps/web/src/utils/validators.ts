export function digitsOnly(value: string) {
  return value.replace(/\D/g, '')
}

export function validateTC(tc: string): boolean {
  const clean = digitsOnly(tc)
  if (!/^[1-9][0-9]{10}$/.test(clean)) return false
  const digits = clean.split('').map(Number)
  const sum1 = (digits[0] + digits[2] + digits[4] + digits[6] + digits[8]) * 7
  const sum2 = digits[1] + digits[3] + digits[5] + digits[7]
  const d10 = (sum1 - sum2) % 10
  if (d10 !== digits[9]) return false
  const total = digits.slice(0, 10).reduce((a, b) => a + b, 0)
  return total % 10 === digits[10]
}

export function validateIBAN(iban: string): boolean {
  const clean = iban.replace(/\s/g, '').toUpperCase()
  return /^TR\d{24}$/.test(clean)
}

export function validateTaxNumber(tax: string): boolean {
  return /^\d{10}$/.test(digitsOnly(tax))
}

export function validatePhone(phone: string): boolean {
  const clean = digitsOnly(phone)
  return /^5\d{9}$/.test(clean)
}

export function validatePlate(plate: string): boolean {
  const clean = plate.toUpperCase().replace(/\s+/g, ' ').trim()
  return /^\d{2,3}\s[A-ZÇĞİÖŞÜ]{2,3}\s\d{2,4}$/.test(clean)
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

export function validatePassword(pass: string): { valid: boolean; strength: string } {
  if (pass.length < 8) return { valid: false, strength: 'Zayıf' }
  const hasUpper = /[A-Z]/.test(pass)
  const hasLower = /[a-z]/.test(pass)
  const hasDigit = /\d/.test(pass)
  const hasSpecial = /[^A-Za-z0-9]/.test(pass)
  if (pass.length >= 12 && hasUpper && hasLower && hasDigit && hasSpecial) return { valid: true, strength: 'Çok Güçlü' }
  if (hasUpper && hasLower && hasDigit) return { valid: true, strength: 'Güçlü' }
  return { valid: false, strength: 'Orta' }
}

export function formatIBAN(iban: string): string {
  const raw = iban.replace(/\s/g, '').toUpperCase().replace(/[^A-Z0-9]/g, '')
  const normalized = raw.startsWith('TR') ? raw : `TR${raw.replace(/^TR/i, '')}`
  return normalized.match(/.{1,4}/g)?.join(' ') ?? normalized
}

export function formatPhone(phone: string): string {
  const raw = digitsOnly(phone).slice(0, 10)
  if (raw.length <= 3) return raw
  if (raw.length <= 6) return `${raw.slice(0, 3)} ${raw.slice(3)}`
  if (raw.length <= 8) return `${raw.slice(0, 3)} ${raw.slice(3, 6)} ${raw.slice(6)}`
  return `${raw.slice(0, 3)} ${raw.slice(3, 6)} ${raw.slice(6, 8)} ${raw.slice(8, 10)}`
}

export function formatCurrency(amount: number): string {
  return `₺${Number(amount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
