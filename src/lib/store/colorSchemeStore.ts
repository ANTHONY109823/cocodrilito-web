import { create } from 'zustand'

export type ColorScheme = 'light' | 'dark'

export const COLOR_SCHEME_STORAGE_KEY = 'simulacros-color-scheme'

interface ColorSchemeState {
  scheme: ColorScheme
  hydrated: boolean
  setScheme: (scheme: ColorScheme) => void
  toggle: () => void
  hydrate: () => void
}

function applySchemeToDocument(scheme: ColorScheme) {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('data-theme', scheme)
  document.documentElement.style.colorScheme = scheme
}

function persistScheme(scheme: ColorScheme) {
  try {
    localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, scheme)
  } catch {
    /* ignore */
  }
}

export function readStoredColorScheme(): ColorScheme {
  if (typeof window === 'undefined') return 'dark'
  try {
    return localStorage.getItem(COLOR_SCHEME_STORAGE_KEY) === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

export const useColorSchemeStore = create<ColorSchemeState>((set, get) => ({
  scheme: 'dark',
  hydrated: false,
  setScheme: (scheme) => {
    persistScheme(scheme)
    applySchemeToDocument(scheme)
    set({ scheme })
  },
  toggle: () => {
    const next = get().scheme === 'dark' ? 'light' : 'dark'
    get().setScheme(next)
  },
  hydrate: () => {
    const scheme = readStoredColorScheme()
    applySchemeToDocument(scheme)
    set({ scheme, hydrated: true })
  },
}))
