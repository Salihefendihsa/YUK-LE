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

export const authService = {
  /** apps/web auth.ts ile aynı: POST /Auth/login, body { phone, password } */
  async login(data: LoginRequest): Promise<LoginResponse> {
    const res = await apiClient.post<LoginResponse>('/Auth/login', data);
    return res.data;
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
};
