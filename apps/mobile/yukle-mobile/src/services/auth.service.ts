import axios, { AxiosError } from 'axios';
import { API_URL } from '../constants/api';
import { translateUserFacingError } from '../utils/apiErrors';
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

const anon = { timeout: 15000, headers: { 'Content-Type': 'application/json' } };

export const authService = {
  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await axios.post<LoginResponse>(`${API_URL}/Auth/login`, data, anon);
    return response.data;
  },

  async register(data: RegisterRequest): Promise<void> {
    const body: Record<string, unknown> = { ...data };
    if (!body.birthDate) delete body.birthDate;
    if (!body.iban) delete body.iban;
    if (!body.address) delete body.address;
    if (!body.licenseClass) delete body.licenseClass;
    await axios.post(`${API_URL}/Auth/register`, body, anon);
  },

  async verifyOtp(data: VerifyOtpRequest): Promise<void> {
    await axios.post(`${API_URL}/Auth/verify-otp`, data, anon);
  },

  async resendVerificationOtp(phone: string): Promise<void> {
    await axios.post(`${API_URL}/Auth/resend-otp`, { phone }, anon);
  },

  async forgotPassword(data: ForgotPasswordRequest): Promise<void> {
    await axios.post(`${API_URL}/Auth/forgot-password`, data, anon);
  },

  async resetPassword(data: ResetPasswordRequest): Promise<void> {
    await axios.post(`${API_URL}/Auth/reset-password`, data, anon);
  },

  getErrorMessage: extractError,
};
