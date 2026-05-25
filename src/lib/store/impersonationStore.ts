import { create } from 'zustand'

const STORAGE_KEY = 'cocodrilito_impersonation'

export interface ImpersonationState {
  active: boolean
  tenantId: string | null
  tenantName: string | null
  tenantType: string | null
  startImpersonation: (data: {
    tenantId: string
    tenantName: string
    tenantType: string
  }) => void
  stopImpersonation: () => void
  loadFromStorage: () => void
}

export const useImpersonationStore = create<ImpersonationState>((set) => ({
  active: false,
  tenantId: null,
  tenantName: null,
  tenantType: null,

  startImpersonation: (data) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    set({ active: true, ...data })
  },

  stopImpersonation: () => {
    localStorage.removeItem(STORAGE_KEY)
    set({ active: false, tenantId: null, tenantName: null, tenantType: null })
  },

  loadFromStorage: () => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    try {
      const data = JSON.parse(raw) as {
        tenantId: string
        tenantName: string
        tenantType: string
      }
      set({ active: true, ...data })
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
  },
}))
