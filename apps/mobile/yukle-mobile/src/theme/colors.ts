/** Web tokens.css + landing — tek kaynak */
export const palette = {
  brand: '#FF6B00',
  brandHover: '#FF8C38',
  brandPress: '#CC5500',
  brandMuted: 'rgba(255, 107, 0, 0.12)',
  brandBorder: 'rgba(255, 107, 0, 0.35)',

  gold: '#FFB627',
  goldMuted: 'rgba(255, 182, 39, 0.12)',
  goldBorder: 'rgba(255, 182, 39, 0.35)',

  bg: '#050608',
  bgElevated: '#090B0E',
  surface: '#111318',
  card: '#1C2029',
  cardHover: '#272D3A',
  input: '#111318',

  border: '#3A4252',
  borderLight: '#272D3A',
  borderSubtle: '#1E2030',

  text: '#F3F4F6',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  textFaint: '#4A4D5E',

  success: '#22C55E',
  successBg: 'rgba(34, 197, 94, 0.12)',
  successBorder: 'rgba(34, 197, 94, 0.35)',

  warning: '#F59E0B',
  warningBg: 'rgba(245, 158, 11, 0.12)',

  error: '#EF4444',
  errorBg: 'rgba(239, 68, 68, 0.12)',
  errorBorder: 'rgba(239, 68, 68, 0.35)',

  info: '#3B82F6',
  infoBg: 'rgba(59, 130, 246, 0.12)',

  glass: 'rgba(28, 32, 41, 0.72)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',

  overlay: 'rgba(5, 6, 8, 0.85)',
  onBrand: '#050608',
} as const;

/** Geriye uyumluluk — mevcut Colors importlari */
export const Colors = {
  primary: palette.brand,
  primaryGold: palette.gold,
  bgDark: palette.bg,
  bgCard: palette.card,
  bgInput: palette.input,
  textPrimary: palette.text,
  textSecondary: palette.textSecondary,
  textMuted: palette.textMuted,
  border: palette.borderSubtle,
  success: palette.success,
  error: palette.error,
};
