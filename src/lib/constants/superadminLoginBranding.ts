import type { TenantLoginBranding } from '@/lib/constants/defaultLoginBranding'

/** Login en simulacros.pe — solo SuperAdmin, sin acceso de agencias ni alumnos. */
export const SUPERADMIN_LOGIN_BRANDING: TenantLoginBranding = {
  brandTagline: 'Panel de plataforma',
  brandSub: 'Acceso exclusivo SuperAdmin',
  headlineNormal: 'ADMINISTRACIÓN',
  headlineAccent: 'SIMULACROS.PE',
  description:
    'Este acceso es solo para el equipo de plataforma.\nAgencias y alumnos deben ingresar desde su URL: nombre-de-agencia.simulacros.pe',
  features: [
    'Gestión de agencias y academias',
    'Banco de preguntas global',
    'Configuración de planes y accesos',
  ],
  ctaTagline: '',
  stats: [],
  whatsappUrl: '',
  tiktokUrl: '',
  facebookUrl: '',
  instagramUrl: '',
}
