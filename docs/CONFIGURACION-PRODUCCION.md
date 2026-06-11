# Configuración de producción — Simulacros.pe

Guía para resolver los tres requisitos críticos antes del onboarding masivo de agencias.

---

## 1. DNS wildcard (`*.simulacros.pe`)

Cada agencia accede por `nombre-agencia.simulacros.pe`. Requiere configuración en **Vercel** y en tu **registrador de dominio**.

### Vercel (frontend)

1. Ir a [vercel.com](https://vercel.com) → proyecto `cocodrilito-web` → **Settings** → **Domains**
2. Agregar dominios:
   - `simulacros.pe`
   - `www.simulacros.pe`
   - `*.simulacros.pe` ← **wildcard obligatorio**
3. Vercel mostrará los registros DNS requeridos.

### Registrador DNS (donde compraste simulacros.pe)

| Tipo  | Nombre | Valor                    |
|-------|--------|--------------------------|
| A     | `@`    | `76.76.21.21` (Vercel)   |
| CNAME | `www`  | `cname.vercel-dns.com`   |
| CNAME | `*`    | `cname.vercel-dns.com`   |

### Verificar

```bash
nslookup jraasecurity.simulacros.pe
```

Debe resolver a Vercel. Luego abrir `https://jraasecurity.simulacros.pe/login` (con una agencia existente).

---

## 2. SendGrid (emails)

Sin SendGrid, las suscripciones se aprueban pero **no llega email** al alumno, y las solicitudes de unión fallan con error 503.

### SendGrid

1. Crear cuenta en [sendgrid.com](https://sendgrid.com)
2. **Settings** → **API Keys** → Create API Key (Full Access o Mail Send)
3. **Settings** → **Sender Authentication** → verificar dominio `simulacros.pe` o un remitente individual

### Railway (backend)

Variables de entorno en el servicio `cocodrilito-backend`:

| Variable | Ejemplo | Obligatorio |
|----------|---------|-------------|
| `SendGrid__ApiKey` | `SG.xxxx...` | Sí |
| `SendGrid__FromEmail` | `noreply@simulacros.pe` | Sí |
| `SendGrid__FromName` | `Simulacros.pe` | No |
| `SendGrid__AdminEmail` | `admin@simulacros.pe` | Sí (solicitudes de agencias) |

### Verificar

- SuperAdmin → **Inicio** → panel **Estado del sistema** (debe mostrar SendGrid ✅)
- O: `GET /api/health/readiness` (requiere login SuperAdmin)

---

## 3. Persistencia de logos (Railway Volume)

Los logos se guardan en disco. Sin volumen persistente, **se pierden en cada redeploy**.

### Railway

1. Abrir servicio **cocodrilito-backend** en Railway
2. Pestaña **Volumes** → **Add Volume**
3. Mount path: `/data/uploads`
4. Variables de entorno:

| Variable | Valor |
|----------|-------|
| `UPLOADS_PATH` | `/data/uploads` |
| `PUBLIC_BASE_URL` | `https://cocodrilito-backend-production.up.railway.app` |

`PUBLIC_BASE_URL` debe ser la URL pública del backend (donde se sirven `/uploads/logos/...`).

### Verificar

1. Subir logo desde Admin → Configuración
2. Redeployar el backend en Railway
3. El logo debe seguir visible

---

## Panel de salud (SuperAdmin)

En `simulacros.pe/superadmin?tab=inicio` aparece **Estado del sistema** con checks en tiempo real.

---

## Resumen de variables Railway

```
DATABASE_URL=postgresql://...
Jwt__Key=(mínimo 32 caracteres)
REDIS_URL=redis://...

SendGrid__ApiKey=SG.xxxx
SendGrid__FromEmail=noreply@simulacros.pe
SendGrid__AdminEmail=admin@simulacros.pe
SendGrid__FromName=Simulacros.pe

UPLOADS_PATH=/data/uploads
PUBLIC_BASE_URL=https://cocodrilito-backend-production.up.railway.app
App__TenantDomain=simulacros.pe
```
