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

  bg: '#0A0D12',
  bgElevated: '#0D1018',
  surface: '#12161D',
  card: '#1A2030',
  cardHover: '#1F2738',
  input: '#12161D',

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
  infoBorder: 'rgba(59, 130, 246, 0.35)',

  glass: 'rgba(28, 32, 41, 0.72)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',

  overlay: 'rgba(10, 13, 18, 0.85)',
  onBrand: '#0A0D12',

  /** Notr gri skala (50 acik .. 900 koyu arka plan) */
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#0A0D12',
} as const;

export const gray = {
  50: palette.gray50,
  100: palette.gray100,
  200: palette.gray200,
  300: palette.gray300,
  400: palette.gray400,
  500: palette.gray500,
  600: palette.gray600,
  700: palette.gray700,
  800: palette.gray800,
  900: palette.gray900,
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
