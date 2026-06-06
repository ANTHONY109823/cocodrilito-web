import type { Metadata } from 'next'
import './globals.css'
import { AppProviders } from '@/components/AppProviders'
import { BRAND_DESCRIPTION, BRAND_PAGE_TITLE } from '@/lib/constants/brand'

export const metadata: Metadata = {
  title: BRAND_PAGE_TITLE,
  description: BRAND_DESCRIPTION,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
