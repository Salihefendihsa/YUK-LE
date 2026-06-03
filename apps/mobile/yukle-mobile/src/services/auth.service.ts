import { AxiosError } from 'axios';
import { translateUserFacingError } from '../utils/apiErrors';
import { apiClient, getApiErrorMessage } from './api.client';
import type {
  ForgotPasswordRequest,
  LoginResponse,
  RegisterRequest,
  ResetPasswordRequest,
  VerifyOtpRequest,
} from '../types/auth';

export interface LoginRequest {
  phone: string;
  password: string;
}

type ApiErrorPayload = {
  message?: string;
  title?: string;
  detail?: string;
  errors?: Record<string, string[]>;
};

function extractError(error: unknown): string {
  const err = error as AxiosError<ApiErrorPayload>;
  const payload = err.response?.data;
  if (payload?.errors) {
    const lines = Object.values(payload.errors).flat().filter(Boolean);
    if (lines.length > 0) {
      return lines.map((line) => translateUserFacingError(String(line))).join('\n');
    }
  }
  if (payload?.message) return translateUserFacingError(payload.message);
  if (!err.response) {
    return translateUserFacingError(
      'Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin.'
    );
  }
  return 'Bir hata oluştu. Lütfen tekrar deneyin.';
}

function isTransientError(err: AxiosError): boolean {
  // Hiç yanıt yoksa: network down, DNS, ECONNREFUSED, timeout, kesilmiş bağlantı
  if (!err.response) return true;
  const status = err.response.status;
  // 502 Bad Gateway, 503 Service Unavailable, 504 Gateway Timeout — transient
  return status === 502 || status === 503 || status === 504;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Login için Metro/dev'de gerçek hatayı loglar — credential mi, network mi
 *  ayırt etmek için. Üretimde de zarar vermez (console no-op). */
function logLoginFailure(err: AxiosError, attempt: number): void {
  const payload = err.response?.data as ApiErrorPayload | undefined;
  console.log('[auth.login fail]', {
    attempt,
    code: err.code,
    message: err.message,
    status: err.response?.status,
    payloadMessage: payload?.message ?? payload?.title ?? payload?.detail,
    hasResponse: Boolean(err.response),
  });
}

/** Login bağlamında dürüst hata mesajı:
 *  - Gerçek 400/401 + auth response → "Telefon/şifre hatalı"
 *  - Network/timeout/no-response → "Bağlantı sorunu" (kullanıcı credential sanmasın)
 *  - 429 → rate limit
 *  - 5xx → sunucu sorunu
 */
export function getLoginErrorMessage(error: unknown): string {
  const err = error as AxiosError<ApiErrorPayload>;

  // Yanıt yok: network/timeout/connection refused/abort
  if (!err.response) {
    if (err.code === 'ECONNABORTED' || /timeout/i.test(err.message ?? '')) {
      return 'Bağlantı zaman aşımına uğradı. Tekrar deneyin.';
    }
    return 'Bağlantı sorunu. İnternetinizi kontrol edip tekrar deneyin.';
  }

  const status = err.response.status;
  const payload = err.response.data;
  const payloadMsg =
    payload?.message ??
    payload?.title ??
    payload?.detail ??
    (payload?.errors
      ? Object.values(payload.errors).flat().filter(Boolean).join('\n')
      : undefined);

  // 400/401: backend mesajı varsa onu kullan, yoksa dürüst credential mesajı
  if (status === 400 || status === 401) {
    if (payloadMsg) return translateUserFacingError(payloadMsg);
    return 'Telefon numarası veya şifre hatalı.';
  }
  if (status === 403) {
    // requiresVerification akışı LoginScreen'de yakalanıyor — buraya gelirse generic
    return payloadMsg ? translateUserFacingError(payloadMsg) : 'Erişim reddedildi.';
  }
  if (status === 429) {
    return 'Çok fazla deneme. Lütfen bir süre bekleyip tekrar deneyin.';
  }
  if (status >= 500) {
    return 'Sunucu yanıt vermiyor. Birazdan tekrar deneyin.';
  }

  return payloadMsg ? translateUserFacingError(payloadMsg) : 'Giriş yapılamadı.';
}

export const authService = {
  /** apps/web auth.ts ile aynı: POST /Auth/login, body { phone, password }
   *  + transient error (network/5xx) durumunda 1 retry. */
  async login(data: LoginRequest, _attempt = 1): Promise<LoginResponse> {
    try {
      const res = await apiClient.post<LoginResponse>('/Auth/login', data);
      return res.data;
    } catch (rawErr) {
      const err = rawErr as AxiosError;
      logLoginFailure(err, _attempt);
      // Transient + ilk deneme → kısa backoff sonrası 1 retry. Geçici ağ
      // dalgalanması "şifre hatalı" gibi görünmesin.
      if (_attempt === 1 && isTransientError(err)) {
        await sleep(800);
        return this.login(data, 2);
      }
      throw err;
    }
  },

  async register(data: RegisterRequest): Promise<void> {
    const body: Record<string, unknown> = { ...data };
    if (!body.birthDate) delete body.birthDate;
    if (!body.iban) delete body.iban;
    if (!body.address) delete body.address;
    if (!body.licenseClass) delete body.licenseClass;
    await apiClient.post('/Auth/register', body);
  },

  async verifyOtp(data: VerifyOtpRequest): Promise<void> {
    await apiClient.post('/Auth/verify-otp', data);
  },

  async resendVerificationOtp(phone: string): Promise<void> {
    await apiClient.post('/Auth/resend-otp', { phone });
  },

  async forgotPassword(data: ForgotPasswordRequest): Promise<void> {
    await apiClient.post('/Auth/forgot-password', data);
  },

  async resetPassword(data: ResetPasswordRequest): Promise<void> {
    await apiClient.post('/Auth/reset-password', data);
  },

  getErrorMessage: (error: unknown) => getApiErrorMessage(error) || extractError(error),

  /** Login-spesifik dürüst hata mesajı — LoginScreen / admin-login bunu kullansın. */
  getLoginErrorMessage,
};
