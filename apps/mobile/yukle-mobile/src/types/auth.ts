export type UserRole = 'Customer' | 'Driver' | 'Admin';

export interface LoginResponse {
  token: string;
  refreshToken: string;
  userId: number;
  fullName: string;
  role: UserRole;
  isPhoneVerified: boolean;
  isActive: boolean;
  approvalStatus: string;
}

export type RegisterRole = 'Customer' | 'Driver';

export interface RegisterRequest {
  fullName: string;
  phone: string;
  email: string;
  password: string;
  role: RegisterRole;
  isCorporate: boolean;
  companyName: string;
  taxNumber: string;
  companyAddress: string;
  tcIdentityNumber: string;
  birthDate?: string;
  iban?: string;
  address?: string;
  licenseClass?: string;
  acceptedKvkk: boolean;
  acceptedTerms: boolean;
  acceptedLocationTracking: boolean;
  taxNumberOrTCKN: string;
}

export interface VerifyOtpRequest {
  phone: string;
  code: string;
  purpose?: 'PhoneVerification' | 'PasswordReset';
}

export interface ForgotPasswordRequest {
  phone: string;
}

export interface ResetPasswordRequest {
  phone: string;
  otpCode: string;
  newPassword: string;
}
