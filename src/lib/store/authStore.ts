import { create } from 'zustand'

interface User {
  id: string
  fullName: string
  email: string
  dni: string
  rank: string
  unit: string
  planType: string
  role: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  setAuth: (user: User, token: string) => void
  logout: () => void
  loadFromStorage: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  setAuth: (user, token) => {
    localStorage.setItem('access_token', token)
    localStorage.setItem('user', JSON.stringify(user))
    set({ user, token, isAuthenticated: true })
  },

  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    set({ user: null, token: null, isAuthenticated: false })
  },

  loadFromStorage: () => {
    const token = localStorage.getItem('access_token')
    const userStr = localStorage.getItem('user')
    if (token && userStr) {
      set({
        token,
        user: JSON.parse(userStr),
        isAuthenticated: true
      })
    }
  }
}))