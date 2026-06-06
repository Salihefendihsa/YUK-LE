import type { UserRole } from '../types/auth';

/**
 * Rol-aksan tek kaynağı (cafcaf revizyon).
 *
 * Tüm ekranlar bu token'ı tüketir → birincil butonlar, önemli sayılar, ikon
 * kutucukları, aktif öğeler ve hero ışıması role göre renk alır.
 *   • MÜŞTERİ + ŞOFÖR → turuncu  (#FF6B00 / #FF8A33)
 *   • ADMIN           → kırmızı  (web admin temasının accent'i: #EF4444 / #F59E0B)
 *
 * NOT: Semantik durum rozetleri (Atandı/Aktif/Yolda/Teslim/İptal) role göre
 * DEĞİŞMEZ — onlar palette'teki sabit semantik renkleri kullanır.
 */
export interface RoleAccent {
  /** Birincil aksan (butonlar, vurgu sayıları, aktif öğe). */
  accent: string;
  /** Hover/parlak ton. */
  accentHover: string;
  /** Basılı/koyu ton. */
  accentPress: string;
  /** Koyu zemin üstünde okunur açık ton (vurgu metin). */
  accentLight: string;
  /** İkon kutucuğu / çip dolgusu (yarı saydam). */
  accentMuted: string;
  /** Çok hafif zemin ışıması. */
  accentSoft: string;
  /** İnce kenarlık (yarı saydam). */
  accentBorder: string;
  /** Buton/aksan degrade — [açık, koyu]. */
  gradient: readonly [string, string];
  /** Hero kart degrade örtüsü — [tepe, orta, şeffaf]. */
  gradientSoft: readonly [string, string, string];
  /** Yumuşak glow rengi (gölge/ışıma). */
  glow: string;
  /** Aksan dolgu üstündeki metin rengi. */
  onAccent: string;
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
  gradient: ['#FF8A33', '#FF6B00'],
  gradientSoft: ['rgba(255, 138, 51, 0.22)', 'rgba(255, 107, 0, 0.05)', 'transparent'],
  glow: 'rgba(255, 107, 0, 0.45)',
  onAccent: '#0A0D12',
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
  gradient: ['#F87171', '#DC2626'],
  gradientSoft: ['rgba(248, 113, 113, 0.22)', 'rgba(239, 68, 68, 0.05)', 'transparent'],
  glow: 'rgba(239, 68, 68, 0.45)',
  onAccent: '#FFFFFF',
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
