export interface UserProfile {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  companyName?: string | null;
  taxNumber?: string | null;
  companyAddress?: string | null;
  tcIdentityNumber?: string | null;
  iban?: string | null;
  licenseClass?: string | null;
  homeAddress?: string | null;
  vehiclePlate?: string | null;
  vehicleType?: string | null;
  averageRating: number;
  totalRatingCount: number;
  role: string;
  approvalStatus: string;
  isDriverLicenseApproved?: boolean;
  isSrcApproved?: boolean;
  isPsychotechnicalApproved?: boolean;
  lastValidationMessage?: string | null;
}

export interface UpdateUserProfileRequest {
  fullName: string;
  email: string;
  iban?: string;
  homeAddress?: string;
  companyName?: string;
  companyAddress?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
