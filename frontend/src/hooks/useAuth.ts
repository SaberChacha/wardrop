import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authAPI } from '../services/api'

interface User {
  id: number
  email: string
  name: string
}

interface AuthState {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: true,

      login: async (email: string, password: string) => {
        const data = await authAPI.login(email, password)
        localStorage.setItem('token', data.access_token)
        set({ token: data.access_token, isAuthenticated: true })
        
        // Fetch user data
        const user = await authAPI.getMe()
        set({ user })
      },

      register: async (email: string, password: string, name: string) => {
        await authAPI.register({ email, password, name })
        // After registration, login
        await get().login(email, password)
      },

      logout: () => {
        localStorage.removeItem('token')
        set({ token: null, user: null, isAuthenticated: false })
      },

      checkAuth: async () => {
        const token = localStorage.getItem('token')
        if (!token) {
          set({ isLoading: false, isAuthenticated: false })
          return
        }

        try {
          set({ token })
          const user = await authAPI.getMe()
          set({ user, isAuthenticated: true, isLoading: false })
        } catch {
          localStorage.removeItem('token')
          set({ token: null, user: null, isAuthenticated: false, isLoading: false })
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token }),
    }
  )
)

