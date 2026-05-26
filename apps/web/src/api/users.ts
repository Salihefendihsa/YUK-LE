import { apiClient } from './client'
import type { ApprovalStatus } from './types'

export type UserProfile = {
  id: number
  fullName: string
  email: string
  phone: string
  companyName: string | null
  taxNumber: string | null
  companyAddress: string | null
  tcIdentityNumber: string | null
  iban: string | null
  licenseClass: string | null
  homeAddress: string | null
  vehiclePlate: string | null
  vehicleType: string | null
  averageRating: number
  totalRatingCount: number
  role: string
  approvalStatus: ApprovalStatus | string
  isDriverLicenseApproved?: boolean
  isSrcApproved?: boolean
  isPsychotechnicalApproved?: boolean
  lastValidationMessage?: string | null
}

function normalizeProfile(raw: unknown): UserProfile {
  const r = (raw ?? {}) as Record<string, unknown>
  const approvalRaw = r.approvalStatus ?? r.ApprovalStatus
  let approvalStatus: string
  if (typeof approvalRaw === 'number') {
    const byIndex = ['Pending', 'Approved', 'Rejected', 'Active', 'ManualApprovalRequired'] as const
    approvalStatus = byIndex[approvalRaw] ?? String(approvalRaw)
  } else {
    approvalStatus = String(approvalRaw ?? '')
  }
  return {
    id: Number(r.id ?? 0),
    fullName: String(r.fullName ?? r.FullName ?? ''),
    email: String(r.email ?? r.Email ?? ''),
    phone: String(r.phone ?? r.Phone ?? ''),
    companyName: r.companyName != null ? String(r.companyName) : r.CompanyName != null ? String(r.CompanyName) : null,
    taxNumber: r.taxNumber != null ? String(r.taxNumber) : r.TaxNumber != null ? String(r.TaxNumber) : null,
    companyAddress:
      r.companyAddress != null ? String(r.companyAddress) : r.CompanyAddress != null ? String(r.CompanyAddress) : null,
    tcIdentityNumber:
      r.tcIdentityNumber != null
        ? String(r.tcIdentityNumber)
        : r.TcIdentityNumber != null
          ? String(r.TcIdentityNumber)
          : null,
    iban: r.iban != null ? String(r.iban) : r.Iban != null ? String(r.Iban) : null,
    licenseClass: r.licenseClass != null ? String(r.licenseClass) : null,
    homeAddress: r.homeAddress != null ? String(r.homeAddress) : null,
    vehiclePlate: r.vehiclePlate != null ? String(r.vehiclePlate) : null,
    vehicleType: r.vehicleType != null ? String(r.vehicleType) : null,
    averageRating: Number(r.averageRating ?? r.AverageRating ?? 0),
    totalRatingCount: Number(r.totalRatingCount ?? r.TotalRatingCount ?? 0),
    role: String(r.role ?? r.Role ?? ''),
    approvalStatus,
    isDriverLicenseApproved:
      r.isDriverLicenseApproved != null
        ? Boolean(r.isDriverLicenseApproved)
        : r.IsDriverLicenseApproved != null
          ? Boolean(r.IsDriverLicenseApproved)
          : undefined,
    isSrcApproved:
      r.isSrcApproved != null ? Boolean(r.isSrcApproved) : r.IsSrcApproved != null ? Boolean(r.IsSrcApproved) : undefined,
    isPsychotechnicalApproved:
      r.isPsychotechnicalApproved != null
        ? Boolean(r.isPsychotechnicalApproved)
        : r.IsPsychotechnicalApproved != null
          ? Boolean(r.IsPsychotechnicalApproved)
          : undefined,
    lastValidationMessage:
      r.lastValidationMessage != null
        ? String(r.lastValidationMessage)
        : r.LastValidationMessage != null
          ? String(r.LastValidationMessage)
          : null,
  }
}

/** GET /Users/{id} — admin tüm profilleri görebilir */
export async function getUserProfile(userId: number): Promise<UserProfile> {
  const res = await apiClient.get(`/Users/${userId}`)
  return normalizeProfile(res.data)
}
