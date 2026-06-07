import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { API_URL } from '../constants/api';
import { useAuthStore } from '../store/auth.store';
import { translateUserFacingError } from '../utils/apiErrors';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  // Mobil zayıf ağ + JIT cold-start için artırıldı (eski 15s timeout
  // kullanıcıya 'şifre hatalı' gibi yanıltıcı mesaj üretiyordu).
  timeout: 25000,
});

/** Anonymous endpoint'ler — backend bu yollarda JWT validate etmemeli;
 *  stale/expired token istemeden eklenirse middleware 401 dönüp asıl
 *  credential kontrolüne girmiyor (intermittent login bug). */
const ANON_PATHS = [
  '/Auth/login',
  '/Auth/register',
  '/Auth/verify-otp',
  '/Auth/resend-otp',
  '/Auth/forgot-password',
  '/Auth/reset-password',
];

function isAnonymousRequest(url: string | undefined): boolean {
  if (!url) return false;
  return ANON_PATHS.some((p) => url === p || url.startsWith(`${p}?`) || url.includes(p));
}

type ApiErrorPayload = {
  message?: string;
  title?: string;
  detail?: string;
  errors?: Record<string, string[]>;
};

function payloadToMessage(payload: ApiErrorPayload | undefined): string | null {
  if (!payload) return null;

  if (payload.errors) {
    const lines = Object.values(payload.errors)
      .flat()
      .filter(Boolean)
      .map((line) => translateUserFacingError(String(line)));
    if (lines.length > 0) return lines.join('\n');
  }

  const primary = payload.message ?? payload.detail ?? payload.title;
  if (primary?.trim()) return translateUserFacingError(primary.trim());

  return null;
}

export function getApiErrorMessage(error: unknown): string {
  const err = error as AxiosError<ApiErrorPayload>;
  const payload = err.response?.data;

  if (!err.response) {
    return translateUserFacingError(
      'Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin.'
    );
  }

  const fromPayload = payloadToMessage(payload);
  if (fromPayload) return fromPayload;

  if (err.response.status === 401) {
    return 'Oturum geçersiz. Lütfen tekrar giriş yapın.';
  }
  if (err.response.status === 403) {
    return 'Bu işlem için yetkiniz yok.';
  }
  if (err.response.status === 404) {
    return 'İstenen kayıt bulunamadı.';
  }
  if (err.response.status >= 500) {
    return 'Sunucu hatası. Lütfen tekrar deneyin.';
  }

  return 'Bir hata oluştu. Lütfen tekrar deneyin.';
}

apiClient.interceptors.request.use((config) => {
  // Anonymous endpoint'lerde stale Authorization header gönderme.
  // (config.headers axios v1'de AxiosHeaders; delete güvenli.)
  if (isAnonymousRequest(config.url)) {
    if (config.headers && 'Authorization' in (config.headers as object)) {
      delete (config.headers as Record<string, unknown>).Authorization;
    }
    return config;
  }
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── 401 → refresh-token akışı ────────────────────────────────────────────────
// Access token (7 gün) dolduğunda istek 401 döner. Saklı refresh token ile
// /Auth/refresh-token çağrılır, yeni token'lar store'a yazılır ve orijinal istek
// bir kez tekrarlanır. Refresh başarısızsa oturum kapatılır.
//
// Döngü guard'ları:
//   • original._retry → bir istek en fazla bir kez yeniden denenir.
//   • refresh çağrısı çıplak `axios` ile yapılır (apiClient değil) → interceptor özyinelemesi yok.
//   • anonim uçlar (login/register/...) ve /Auth/refresh-token'ın kendisi atlanır.
//   • refreshPromise tek-uçuş: eşzamanlı 401'ler aynı refresh'i paylaşır.
let refreshPromise: Promise<string> | null = null;

async function performTokenRefresh(): Promise<string> {
  const { token, refreshToken } = useAuthStore.getState();
  if (!token || !refreshToken) throw new Error('no-refresh-token');

  const res = await axios.post(`${API_URL}/Auth/refresh-token`, {
    accessToken: token,
    refreshToken,
  });
  const data = res.data as { token?: string; refreshToken?: string };
  if (!data?.token || !data?.refreshToken) throw new Error('bad-refresh-response');

  useAuthStore.getState().updateTokens(data.token, data.refreshToken);
  return data.token;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error.response?.status;

    const refreshable =
      status === 401 &&
      original != null &&
      !original._retry &&
      !isAnonymousRequest(original.url) &&
      !original.url?.includes('/Auth/refresh-token');

    if (!refreshable || !original) {
      return Promise.reject(error);
    }

    // Refresh token yoksa yenilenemez → oturumu kapat.
    if (!useAuthStore.getState().refreshToken) {
      useAuthStore.getState().logout();
      return Promise.reject(error);
    }

    original._retry = true;
    try {
      refreshPromise = refreshPromise ?? performTokenRefresh();
      const newToken = await refreshPromise;
      refreshPromise = null;
      // Yeni token ile orijinal isteği tekrarla (request interceptor da güncel token'ı ekler).
      original.headers.Authorization = `Bearer ${newToken}`;
      return apiClient(original);
    } catch {
      refreshPromise = null;
      useAuthStore.getState().logout();
      return Promise.reject(error);
    }
  },
);
