# Cocodrilito Web

Frontend Next.js del simulador de exámenes PNP — plataforma multi-tenant con paneles Admin, SuperAdmin y white label.

## Requisitos

- Node.js 20+
- Backend Cocodrilito API en ejecución

## Configuración

```bash
cp .env.example .env.local
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

### Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | URL base del API (ej. `http://localhost:5034/api`) |
| `API_URL` | URL del backend para rewrites del servidor (opcional) |

## Credenciales de prueba

Tras aplicar la migración multi-tenant del backend:

| Rol | Email | Contraseña |
|-----|-------|------------|
| SuperAdmin | `superadmin@cocodrilito.pe` | `CocodriloPNP2025!` |
| Admin Agencia | `agencia.demo@cocodrilito.pe` | `AgenciaDemo2025!` |
| Admin Academia | `academia.demo@cocodrilito.pe` | `AcademiaDemo2025!` |

## White label (login)

Accede con branding del tenant usando query params:

- Academia: `/login?academia=demo-academia`
- Agencia: `/login?agencia=demo-agencia`

El slug debe coincidir con el tenant registrado en el backend.

## Estructura principal

```
src/
├── app/(dashboard)/superadmin/   # Panel SuperAdmin (FASE 6)
├── app/(dashboard)/admin/        # Panel admin tenant (FASE 8)
├── components/ThemeProvider.tsx    # White label (FASE 7)
├── hooks/use*.ts                 # SWR data hooks (FASE 9)
└── lib/api/superadmin.ts         # Cliente API SuperAdmin
```

## Scripts

```bash
npm run dev      # Desarrollo
npm run build    # Build producción
npm run lint     # ESLint
npm run start    # Servidor producción
```

## Deploy

El proyecto incluye configuración Netlify (`netlify.toml`). Define `NEXT_PUBLIC_API_URL` apuntando al backend en producción.

## CI

GitHub Actions ejecuta lint y build en cada push/PR a `main` y `develop` (`.github/workflows/frontend-ci.yml`).
