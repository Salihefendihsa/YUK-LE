import axios, { AxiosError } from 'axios';
import { API_URL } from '../constants/api';
import { useAuthStore } from '../store/auth.store';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

type ApiErrorPayload = {
  message?: string;
  title?: string;
  detail?: string;
  errors?: Record<string, string[]>;
};

export function getApiErrorMessage(error: unknown): string {
  const err = error as AxiosError<ApiErrorPayload>;
  const payload = err.response?.data;

  if (!err.response) {
    return 'Sunucuya baglanilamadi. Backend acik mi kontrol edin.';
  }

  if (payload?.errors) {
    const lines = Object.values(payload.errors).flat().filter(Boolean);
    if (lines.length > 0) return lines.join('\n');
  }
  if (payload?.message) return payload.message;
  if (payload?.detail) return payload.detail;
  if (payload?.title) return payload.title;

  if (err.response.status === 401) return 'Oturum geçersiz. Tekrar giriş yapın.';
  if (err.response.status === 403) return 'Bu islem icin yetkiniz yok.';
  if (err.response.status === 404) return 'Kaynak bulunamadi.';
  if (err.response.status >= 500) return 'Sunucu hatasi. Tekrar deneyin.';

  return 'Islem basarisiz. Tekrar deneyin.';
}

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
