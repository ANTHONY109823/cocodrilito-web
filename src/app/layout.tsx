import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Cocodrilito — Simulador PNP',
  description: 'Prepárate para tus ascensos policiales con simulacros reales',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
