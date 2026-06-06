import type { Metadata } from 'next'
import { BRAND_PAGE_TITLE } from '@/lib/constants/brand'

export const metadata: Metadata = {
  title: BRAND_PAGE_TITLE,
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
