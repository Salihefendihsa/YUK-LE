import { useAuthStore } from '../store/auth.store';
import { roleAccentFor, type RoleAccent } from './roleAccent';

/**
 * Oturumdaki kullanıcının rolüne göre aksan token'ını döndürür.
 * Ekranlar `const accent = useRoleAccent()` ile tek satırda tüm rol-renkli
 * vurguları (buton, sayı, ikon kutucuğu, hero glow) besler.
 */
export function useRoleAccent(): RoleAccent {
  const role = useAuthStore((s) => s.user?.role);
  return roleAccentFor(role);
}
