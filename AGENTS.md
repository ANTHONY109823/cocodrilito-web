# AGENTS.md — Reglas del proyecto Cocodrilito

> **Lee este archivo completo antes de proponer o aplicar cualquier cambio.**

---

## 1. Qué es este proyecto

Cocodrilito es una plataforma **SaaS multi-tenant** de simulacros para el ascenso PNP.
Cada agencia/academia es un *tenant* con su propio subdominio (`{slug}.simulacros.pe`),
su marca (logo, textos de login) y sus propios alumnos. Hay tres roles:
**Estudiante**, **Admin de agencia** y **SuperAdmin**.

- **Backend** (`cocodrilito-backend`): .NET 9, Clean Architecture, EF Core 9, PostgreSQL,
  Redis (opcional), JWT Bearer + BCrypt, SendGrid, ClosedXML + CsvHelper.
  Proyectos: `Cocodrilito.API`, `Cocodrilito.Application`, `Cocodrilito.Domain`,
  `Cocodrilito.Infrastructure`.
- **Frontend** (`cocodrilito-web`): Next.js 16 (App Router), React 19, Tailwind 4,
  Zustand, Axios, SWR. Kit de UI propio en `src/components/ui/`.

## 2. Reglas que NO se rompen nunca

### 2.1 Multi-tenancy es sagrado
- **Toda** consulta a datos de tenant respeta los filtros globales de EF Core por `TenantId`.
  Nunca uses `IgnoreQueryFilters()` salvo en el flujo de impersonación de SuperAdmin,
  y cuando lo hagas debe quedar **auditado** (`AuditLog`).
- Ningún endpoint de tenant puede devolver datos de otro tenant. Si dudas, asume que es
  un bug de seguridad y deténte a preguntar.
- El ranking "nacional" es una feature de producto, pero solo puede exponer datos
  intencionalmente públicos (nombre o alias, score). **Nunca** PII completa cruzada entre tenants.

### 2.2 Una sola UI — prohibido forkear estilos
- Existe **un** sistema de diseño: los componentes de `src/components/ui/`
  (`Button`, `Input`, `Card`, `Badge`, `Modal`, `ProgressBar`) y los tokens modernos:
  - Primary `#318F48`, verde oscuro `#1A5C2E`, accent `#BDFFDF`,
    fondo `#080E0A`, cards `#0D1A10`, warning `#C9943A`, muted `#6B8A75`.
- **Prohibido**: estilos inline (`style={{}}`), bloques `<style>` embebidos, definir nuevas
  paletas, y reintroducir el theme legacy (`NEON`, `RED=#FF5252`, `GOLD=#FFD700`) o clases
  `gray-*` sueltas de Tailwind para superficies.
- Las páginas legacy (`history`, `ranking`, `profile`, `premium`) se **migran hacia** el kit,
  nunca se clonan sus estilos.

### 2.3 Nada de datos falsos en código que se envía
- Prohibido placeholders/fallbacks ficticios en producción
  (ej. `chartScores = [55,70,...]`, `examDate = '2026-10-15'`, `xp ?? 1240`).
- Si el dato aún no llega, muestra **loading**, **empty state** o **error state**
  (componentes reutilizables `EmptyState` / `ErrorState`), nunca un número inventado.

### 2.4 Errores visibles, nunca silenciados
- Prohibido `catch { /* ignore */ }`. Todo error de API se comunica al usuario
  (toast o `ErrorState`) y se registra. Nada de `alert()` — usar el sistema de toasts (Zustand).

### 2.5 Mobile-first
- El público estudia desde el celular. Toda ruta de estudiante debe ser 100% usable a **380px**,
  incluyendo poder **llegar a cada destino de navegación** (si está en el sidebar desktop,
  debe estar también en el bottom nav móvil).

### 2.6 Arquitectura backend
- Controllers **delgados**: la lógica de negocio vive en servicios de
  `Application`/`Infrastructure`, no en el controller. Nada de queries LINQ de 30 líneas
  dentro de un controller.
- DTOs en `Application`. Entidades de dominio no se exponen directo por la API.
- Nada de umbrales/valores mágicos hardcodeados (ej. tasa de aprobación 70%, distribución de
  preguntas): deben venir de configuración del tenant o de `ExamConfig`.

### 2.7 Seguridad
- `localStorage` (el `user` de Zustand) es **solo UX**, jamás fuente de verdad para
  autorización. El backend siempre decide.
- Los refresh tokens deben validarse contra BD/Redis antes de emitir uno nuevo.
- No loguear secretos, tokens ni contraseñas. No exponer stack traces al cliente en prod.

### 2.8 Dependencias y migraciones
- No agregar paquetes nuevos si ya hay uno instalado para el caso
  (usa **SWR**, **react-hook-form**, **zod** que ya están en `package.json`).
- No auto-migrar en producción dentro de `Program.cs`. Las migraciones se crean explícitamente
  y se aplican como paso de release.

### 2.9 Tests
- Una vez exista el proyecto xUnit, toda lógica de negocio nueva o refactorizada llega con su test.
  El primer test que importa es el de **aislamiento entre tenants**.

## 3. Definición de "terminado" (cada cambio)
1. Compila sin errores y sin nuevos warnings.
2. No introduce estilos inline ni nueva paleta.
3. No deja datos placeholder ni `catch` vacíos.
4. Probado mentalmente a 380px si toca UI de estudiante.
5. Respeta el aislamiento por `TenantId`.
6. El diff es pequeño y revisable; si crece demasiado, deténte y propón dividirlo.

## 4. Cómo trabajar conmigo (el agente)
- Antes de editar, **resume tu plan** y los archivos que tocarás.
- Aplica un lote a la vez. Al terminar, lista qué cambiaste y qué falta.
- Si encuentras algo fuera del alcance pedido, **anótalo pero no lo toques** sin permiso.

---

## Anexo: Next.js 16 en este repo

Esta versión de Next.js tiene cambios respecto a versiones anteriores. Antes de escribir código,
consulta la guía correspondiente en `node_modules/next/dist/docs/` y respeta los avisos de deprecación.
