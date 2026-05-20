export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

export function validateTC(tc: string): boolean {
  const clean = digitsOnly(tc);
  if (!/^[1-9][0-9]{10}$/.test(clean)) return false;
  const digits = clean.split('').map(Number);
  const sum1 = (digits[0] + digits[2] + digits[4] + digits[6] + digits[8]) * 7;
  const sum2 = digits[1] + digits[3] + digits[5] + digits[7];
  const d10 = (sum1 - sum2) % 10;
  if (d10 !== digits[9]) return false;
  const total = digits.slice(0, 10).reduce((a, b) => a + b, 0);
  return total % 10 === digits[10];
}

export function validateIBAN(iban: string): boolean {
  const clean = iban.replace(/\s/g, '').toUpperCase();
  return /^TR\d{24}$/.test(clean);
}

export function validateTaxNumber(tax: string): boolean {
  return /^\d{10}$/.test(digitsOnly(tax));
}

export function validatePhone(phone: string): boolean {
  return /^5\d{9}$/.test(digitsOnly(phone));
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function validatePassword(pass: string): { valid: boolean; strength: string } {
  if (pass.length < 8) return { valid: false, strength: 'Zayif' };
  const hasUpper = /[A-Z]/.test(pass);
  const hasLower = /[a-z]/.test(pass);
  const hasDigit = /\d/.test(pass);
  if (hasUpper && hasLower && hasDigit) return { valid: true, strength: 'Guclu' };
  return { valid: false, strength: 'Orta' };
}

export function formatIBAN(iban: string): string {
  const raw = iban.replace(/\s/g, '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const normalized = raw.startsWith('TR') ? raw : `TR${raw.replace(/^TR/i, '')}`;
  return normalized.match(/.{1,4}/g)?.join(' ') ?? normalized;
}

export function formatPhone(phone: string): string {
  const raw = digitsOnly(phone).slice(0, 10);
  if (raw.length <= 3) return raw;
  if (raw.length <= 6) return `${raw.slice(0, 3)} ${raw.slice(3)}`;
  if (raw.length <= 8) return `${raw.slice(0, 3)} ${raw.slice(3, 6)} ${raw.slice(6)}`;
  return `${raw.slice(0, 3)} ${raw.slice(3, 6)} ${raw.slice(6, 8)} ${raw.slice(8, 10)}`;
}

export function isAdult(dateIso: string): boolean {
  const birth = new Date(dateIso);
  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 18);
  return birth <= minDate;
}
