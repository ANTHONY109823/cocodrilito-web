import { create } from 'zustand'

interface NavSearchState {
  search: string
  syncFromWindow: () => void
  applyHref: (href: string) => void
}

export const useNavSearchStore = create<NavSearchState>((set) => ({
  search: '',
  syncFromWindow: () => {
    if (typeof window === 'undefined') return
    set({ search: window.location.search })
  },
  applyHref: (href: string) => {
    const q = href.includes('?') ? `?${href.split('?')[1]}` : ''
    set({ search: q })
  },
}))

interface NavigationState {
  pendingHref: string | null
  setPendingHref: (href: string | null) => void
}

export const useNavigationStore = create<NavigationState>((set) => ({
  pendingHref: null,
  setPendingHref: (href) => set({ pendingHref: href }),
}))
