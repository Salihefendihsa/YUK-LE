import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { LoginResponse } from '../api/types'

interface AuthUser {
  userId: number
  fullName: string
  role: 'Customer' | 'Driver' | 'Admin'
  isPhoneVerified: boolean
  isActive: boolean
  approvalStatus: string
}

interface AuthState {
  user: AuthUser | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  setAuth: (data: LoginResponse) => void
  logout: () => void
  updateTokens: (token: string, refreshToken: string) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (data: LoginResponse) =>
        set({
          token: data.token,
          refreshToken: data.refreshToken,
          isAuthenticated: true,
          user: {
            userId: data.userId,
            fullName: data.fullName,
            role: data.role,
            isPhoneVerified: data.isPhoneVerified,
            isActive: data.isActive,
            approvalStatus: data.approvalStatus,
          },
        }),

      logout: () =>
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
        }),

      updateTokens: (token, refreshToken) =>
        set({ token, refreshToken }),
    }),
    { name: 'yükle-auth' }
  )
)
