import axios, { AxiosError } from 'axios';
import { API_URL } from '../constants/api';
import { useAuthStore } from '../store/auth.store';
import { translateUserFacingError } from '../utils/apiErrors';

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
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
