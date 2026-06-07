import { apiClient } from './client'
import type { LoginRequest, LoginResponse, RegisterRequest, VerifyOtpRequest } from './types'

export async function login(data: LoginRequest): Promise<LoginResponse> {
  const res = await apiClient.post<LoginResponse>('/Auth/login', data)
  return res.data
}

export async function register(data: RegisterRequest) {
  const res = await apiClient.post('/Auth/register', data)
  return res.data
}

export async function verifyOtp(data: VerifyOtpRequest) {
  const res = await apiClient.post('/Auth/verify-otp', data)
  return res.data
}

export async function resendOtp(phone: string) {
  const res = await apiClient.post('/Auth/resend-otp', { phone })
  return res.data
}

export async function refreshToken(token: string, refreshToken: string) {
  const res = await apiClient.post('/Auth/refresh-token', { accessToken: token, refreshToken })
  return res.data
}
