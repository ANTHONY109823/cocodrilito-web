# Cocodrilito Web

Frontend Next.js del simulador de exámenes PNP — plataforma multi-tenant con paneles Admin, SuperAdmin y white label.

## Guía para agencias

**Manual de acceso y gestión** (importación Excel, login alumnos, suscripciones):

→ **[docs/GUIA-AGENCIA.md](./docs/GUIA-AGENCIA.md)**

Este documento **no incluye credenciales**. Los accesos de cada agencia se entregan por canal privado.

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

## Seguridad

- **No documentar credenciales** en este repositorio (usuarios, contraseñas, tokens, DNIs reales).
- Los archivos `.env*` locales están en `.gitignore`; use solo `.env.example` como plantilla sin secretos.
- Las credenciales de desarrollo o prueba se configuran en el backend o se solicitan al administrador del proyecto.

## White label (login)

Cada agencia accede por subdominio:

```text
https://[slug].simulacros.pe/login
```

En desarrollo local: `http://[slug].localhost:3000/login`

## Estructura principal

```
src/
├── app/(dashboard)/superadmin/   # Panel SuperAdmin
├── app/(dashboard)/admin/        # Panel admin tenant
├── components/tenant/            # Branding, favicon, login bootstrap
├── docs/GUIA-AGENCIA.md          # Guía operativa para agencias
└── lib/api/                      # Clientes API
```

Documentación adicional: [docs/CONFIGURACION-PRODUCCION.md](./docs/CONFIGURACION-PRODUCCION.md)

## Scripts

```bash
npm run dev      # Desarrollo
npm run build    # Build producción
npm run lint     # ESLint
npm run start    # Servidor producción
```

## Deploy

Proyecto desplegado en **Vercel**. Defina `NEXT_PUBLIC_API_URL` y `API_URL` en Environment Variables apuntando al backend en producción.

## CI

GitHub Actions ejecuta lint y build en cada push/PR a `main` y `develop` (`.github/workflows/frontend-ci.yml`).
