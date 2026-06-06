/**
 * Web tokens.css + landing — tek kaynak.
 * Canlı/cafcaf revizyon: kartlar tabandan belirgin açık + ince kenarlık + yumuşak gölge
 * ("yüzen kart" hissi), durum rozetleri daha doygun. Rol aksanı için bkz. roleAccent.ts.
 */
export const palette = {
  brand: '#FF6B00',
  brandHover: '#FF8A33',
  brandPress: '#CC5500',
  brandMuted: 'rgba(255, 107, 0, 0.16)',
  brandBorder: 'rgba(255, 107, 0, 0.45)',

  gold: '#FBBF24',
  goldMuted: 'rgba(251, 191, 36, 0.16)',
  goldBorder: 'rgba(251, 191, 36, 0.40)',

  bg: '#0A0E14',
  bgElevated: '#0D1119',
  surface: '#131923',
  card: '#161C26',
  cardHover: '#1B2230',
  input: '#131923',

  border: '#3A4252',
  borderLight: 'rgba(255, 255, 255, 0.07)',
  borderSubtle: '#222A36',

  text: '#F4F6F9',
  textSecondary: '#9AA4B2',
  textMuted: '#7C8696',
  textFaint: '#4A4D5E',

  success: '#4ADE80',
  successBg: 'rgba(74, 222, 128, 0.16)',
  successBorder: 'rgba(74, 222, 128, 0.40)',

  warning: '#FBBF24',
  warningBg: 'rgba(251, 191, 36, 0.16)',

  error: '#EF4444',
  errorBg: 'rgba(239, 68, 68, 0.16)',
  errorBorder: 'rgba(239, 68, 68, 0.45)',

  info: '#60A5FA',
  infoBg: 'rgba(96, 165, 250, 0.16)',
  infoBorder: 'rgba(96, 165, 250, 0.40)',

  glass: 'rgba(22, 28, 38, 0.80)',
  glassBorder: 'rgba(255, 255, 255, 0.07)',

  overlay: 'rgba(10, 14, 20, 0.85)',
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
