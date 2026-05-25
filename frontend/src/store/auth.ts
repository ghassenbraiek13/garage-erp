import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, UserRole } from '@/types'
import { setAccessToken as setTokenRef } from '@/utils/authToken'

export const useAuthStore = create<{
  user: User | null
  accessToken: string | null
  setUser: (user: User | null) => void
  setAccessToken: (token: string | null) => void
  login: (email: string, password: string, role: UserRole) => Promise<void>
  clearAuth: () => void
  logout: () => Promise<void>
}>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      setUser: (user) => set({ user }),
      setAccessToken: (accessToken) => {
        setTokenRef(accessToken)
        set({ accessToken })
      },
      login: async (email, password, role) => {
        const { default: api } = await import('@/utils/api')
        const { data } = await api.post('/auth/login', { email, password, role })
        const token = data.data.accessToken as string
        const u = data.data.user as User
        setTokenRef(token)
        set({ accessToken: token, user: u })
      },
      clearAuth: () => {
        setTokenRef(null)
        set({ accessToken: null, user: null })
      },
      logout: async () => {
        try {
          const { default: api } = await import('@/utils/api')
          await api.post('/auth/logout')
        } catch {
          /* ignore */
        }
        get().clearAuth()
      },
    }),
    {
      name: 'garageflow-auth',
      partialize: (s) => ({ user: s.user }),
    },
  ),
)
