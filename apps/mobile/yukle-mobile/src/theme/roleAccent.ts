import type { UserRole } from '../types/auth';

/**
 * Rol-aksan tek kaynağı — onaylanan müşteri dashboard MOCKUP'ına birebir.
 *
 * İLKE: kartlar NÖTR (palette.card #161C26) kalır; turuncu/kırmızı yalnızca
 * ACCENT (ikon kutucuğu, sayı vurgusu, buton, aktif öğe) + TEK parlayan HERO
 * kartında kullanılır. Hiçbir içerik/stat kartında renk wash YOK.
 *   • MÜŞTERİ + ŞOFÖR → turuncu
 *   • ADMIN           → kırmızı (web admin temasıyla aynı)
 *
 * Semantik durum rozetleri (Atandı/Aktif/Yolda/Teslim/İptal) role göre DEĞİŞMEZ;
 * onlar palette'teki sabit semantik renkleri kullanır.
 */
export interface RoleAccentHero {
  /** Hero kart diyagonal (135°) zemin degradesi — [başlangıç, orta, bitiş]. */
  gradient: readonly [string, string, string];
  /** Hero kenarlığı (yarı saydam accent). */
  border: string;
  /** Sağ üst radial glow rengi. */
  glowColor: string;
  /** Radial glow tepe opaklığı (0–1). */
  glowPeak: number;
  /** Hero ikon kutucuğu zemini. */
  iconBg: string;
  /** Hero ikon rengi. */
  iconColor: string;
  /** Hero büyük değer metni rengi. */
  value: string;
  /** Hero yumuşak renkli gölge rengi. */
  shadowColor: string;
}

export interface RoleAccent {
  /** Birincil aksan (butonlar, aktif öğe). */
  accent: string;
  /** Parlak/açık ton (vurgu sayı, ikon). */
  accentHover: string;
  /** Basılı/koyu ton. */
  accentPress: string;
  /** Koyu zeminde okunur açık ton. */
  accentLight: string;
  /** İkon kutucuğu / çip dolgusu (yarı saydam). */
  accentMuted: string;
  /** Çok hafif zemin. */
  accentSoft: string;
  /** İnce kenarlık (yarı saydam). */
  accentBorder: string;
  /** Aksan dolgu üstündeki metin rengi. */
  onAccent: string;
  /** Grafik çubuğu degradesi — [üst, alt]. */
  bar: readonly [string, string];
  /** Hero kart spesifikasyonu. */
  hero: RoleAccentHero;
  /** ScreenBackground rol anahtarı (ambient spotlight). */
  bgRole: 'customer' | 'driver' | 'admin';
}

const ORANGE: RoleAccent = {
  accent: '#FF6B00',
  accentHover: '#FF8A33',
  accentPress: '#CC5500',
  accentLight: '#FFB27A',
  accentMuted: 'rgba(255, 107, 0, 0.16)',
  accentSoft: 'rgba(255, 107, 0, 0.08)',
  accentBorder: 'rgba(255, 107, 0, 0.45)',
  onAccent: '#0A0D12',
  bar: ['#FF8A33', '#B34A00'],
  hero: {
    gradient: ['#2A1808', '#16110C', '#121620'],
    border: 'rgba(255, 138, 51, 0.22)',
    glowColor: '#FF6B00',
    glowPeak: 0.30,
    iconBg: 'rgba(255, 107, 0, 0.18)',
    iconColor: '#FF8A33',
    value: '#FF8A33',
    shadowColor: '#FF6B00',
  },
  bgRole: 'customer',
};

const ORANGE_DRIVER: RoleAccent = { ...ORANGE, bgRole: 'driver' };

const RED: RoleAccent = {
  accent: '#EF4444',
  accentHover: '#F87171',
  accentPress: '#DC2626',
  accentLight: '#FCA5A5',
  accentMuted: 'rgba(239, 68, 68, 0.16)',
  accentSoft: 'rgba(239, 68, 68, 0.08)',
  accentBorder: 'rgba(239, 68, 68, 0.45)',
  onAccent: '#FFFFFF',
  bar: ['#F87171', '#991B1B'],
  hero: {
    gradient: ['#2A0C0C', '#160C0C', '#121620'],
    border: 'rgba(248, 113, 113, 0.22)',
    glowColor: '#EF4444',
    glowPeak: 0.30,
    iconBg: 'rgba(239, 68, 68, 0.18)',
    iconColor: '#F87171',
    value: '#F87171',
    shadowColor: '#EF4444',
  },
  bgRole: 'admin',
};

/** Rol → aksan haritası (case-insensitive; bilinmeyen rol → müşteri/turuncu). */
export function roleAccentFor(role?: UserRole | string | null): RoleAccent {
  switch (String(role ?? '').toLowerCase()) {
    case 'admin':
      return RED;
    case 'driver':
      return ORANGE_DRIVER;
    default:
      return ORANGE;
  }
}

export const roleAccents = {
  customer: ORANGE,
  driver: ORANGE_DRIVER,
  admin: RED,
} as const;
