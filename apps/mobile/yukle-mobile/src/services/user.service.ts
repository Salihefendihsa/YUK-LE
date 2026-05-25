import type { ChangePasswordRequest, UpdateUserProfileRequest, UserProfile } from '../types/user';
import { apiClient } from './api.client';

function normalizeProfile(raw: unknown): UserProfile {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    id: Number(r.id ?? 0),
    fullName: String(r.fullName ?? ''),
    email: String(r.email ?? ''),
    phone: String(r.phone ?? ''),
    companyName: r.companyName != null ? String(r.companyName) : null,
    taxNumber: r.taxNumber != null ? String(r.taxNumber) : null,
    companyAddress: r.companyAddress != null ? String(r.companyAddress) : null,
    tcIdentityNumber: r.tcIdentityNumber != null ? String(r.tcIdentityNumber) : null,
    iban: r.iban != null ? String(r.iban) : null,
    licenseClass: r.licenseClass != null ? String(r.licenseClass) : null,
    homeAddress: r.homeAddress != null ? String(r.homeAddress) : null,
    vehiclePlate: r.vehiclePlate != null ? String(r.vehiclePlate) : null,
    vehicleType: r.vehicleType != null ? String(r.vehicleType) : null,
    averageRating: Number(r.averageRating ?? 0),
    totalRatingCount: Number(r.totalRatingCount ?? 0),
    role: String(r.role ?? ''),
    approvalStatus: String(
      typeof r.approvalStatus === 'number'
        ? ['Pending', 'Approved', 'Rejected', 'Active', 'ManualApprovalRequired'][
            r.approvalStatus as number
          ] ?? r.approvalStatus
        : (r.approvalStatus ?? r.ApprovalStatus ?? '')
    ),
    isDriverLicenseApproved:
      r.isDriverLicenseApproved != null ? Boolean(r.isDriverLicenseApproved) : undefined,
    isSrcApproved: r.isSrcApproved != null ? Boolean(r.isSrcApproved) : undefined,
    isPsychotechnicalApproved:
      r.isPsychotechnicalApproved != null ? Boolean(r.isPsychotechnicalApproved) : undefined,
    lastValidationMessage:
      r.lastValidationMessage != null ? String(r.lastValidationMessage) : null,
  };
}

export async function getUserProfile(userId: number): Promise<UserProfile> {
  const res = await apiClient.get(`/Users/${userId}`);
  return normalizeProfile(res.data);
}

export async function updateUserProfile(
  userId: number,
  body: UpdateUserProfileRequest
): Promise<UserProfile> {
  const res = await apiClient.put(`/Users/${userId}`, body);
  return normalizeProfile(res.data);
}

export async function changePassword(body: ChangePasswordRequest): Promise<void> {
  await apiClient.post('/Auth/change-password', body);
}
