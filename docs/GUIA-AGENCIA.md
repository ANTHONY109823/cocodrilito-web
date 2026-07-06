# Guía de acceso y gestión — Simulacros.pe para agencias

Manual operativo para administradores de agencias. **Versión:** junio 2026.

> **Seguridad:** este documento no contiene credenciales reales. Cada agencia recibe sus accesos por canal privado (WhatsApp, email o reunión).

---

## 1. URL de su agencia

Cada institución tiene una URL exclusiva:

```text
https://[nombre-agencia].simulacros.pe/login
```

Reemplace `[nombre-agencia]` por el **slug** asignado por Simulacros.pe (ej. `mi-academia` → `https://mi-academia.simulacros.pe/login`).

---

## 2. Tipos de acceso

| Perfil | URL | Usuario | Contraseña |
|--------|-----|---------|------------|
| **Administrador de agencia** | `https://[slug].simulacros.pe/login` | Correo entregado por Simulacros.pe | Contraseña entregada por Simulacros.pe |
| **Alumno** | `https://[slug].simulacros.pe/login` | Código de usuario (generado al dar de alta) | Su DNI de 8 dígitos |

**Importante:**

- Los alumnos **no usan correo electrónico** para ingresar.
- El registro público está **desactivado**: solo entran quienes usted da de alta.
- Las credenciales de prueba o producción **nunca** deben publicarse en repositorios ni documentos compartidos.

---

## 3. Primer acceso del administrador

1. Abra la URL de login de su agencia.
2. Inicie sesión con el **correo y contraseña** que le entregó el equipo Simulacros.pe.
3. Vaya al **Panel Admin** (`/admin`).
4. En **Admin → Configuración**, cambie su contraseña (recomendado).

**Logo y colores:** los configura Simulacros.pe (SuperAdmin). Para cambios visuales, contacte soporte.

---

## 4. Panel de administración

| Sección | Función |
|---------|---------|
| **Dashboard** | Usuarios, exámenes, tasa de aprobación, ranking interno |
| **Usuarios** | Crear alumnos, importar Excel, editar, extender plan, resetear contraseña |
| **Suscripciones** | Planes activos; aprobar/rechazar solicitudes premium |
| **Configuración** | Cambiar contraseña del administrador; ver nombre de la institución |

---

## 5. Alta individual de alumnos

**Ruta:** Admin → Usuarios → Crear usuario

| Campo | Notas |
|-------|-------|
| Nombres / Apellidos | Obligatorio; el apellido paterno forma parte del usuario |
| DNI | 8 dígitos; también es la **contraseña inicial** |
| Grado actual | Define categoría, jerarquía y balotario PNP |
| Plan | 30, 60 o 180 días de acceso |
| Fecha de activación | Inicio del conteo del plan |

**Usuario generado automáticamente:** inicial del nombre + apellido paterno en mayúsculas.

Ejemplo de **formato** (no use estos datos como credenciales reales):

```text
Nombre: Juan García
Usuario generado: JGARCIA
Contraseña inicial: DNI del alumno (8 dígitos)
```

Tras crear el alumno, **copie las credenciales** que muestra el sistema y entréguelas por un canal seguro.

---

## 6. Importación masiva (Excel)

### Paso a paso

1. Admin → Usuarios → **Descargar plantilla** (`.xlsx`).
2. Complete las filas según las columnas de la plantilla.
3. Guarde como **`.xlsx`** (no `.xls`, no `.csv`).
4. Suba el archivo → revise el **preview editable**.
5. Corrija errores por fila si los hay.
6. **Grabar importación**.
7. Copie las credenciales y la URL del modal final.

### Columnas de la plantilla

| Columna | Obligatorio | Notas |
|---------|-------------|-------|
| Nombres | Sí | Primer nombre |
| Apellido paterno | Sí | Genera el usuario de acceso |
| Apellido materno | No | Opcional |
| DNI | Sí | 8 dígitos, **único en todo el sistema** |
| Grado actual | Sí | Grado PNP actual del postulante |
| Días plan | Sí | `30`, `60` o `180` |

**Sin columna Email.** Contraseña = DNI del alumno.

### Advertencias

- Un **DNI duplicado** (en su lista o en otra agencia) hará fallar la fila.
- Dos alumnos con el mismo nombre y apellido paterno generan el **mismo usuario**; la segunda fila fallará.
- Solo archivos **`.xlsx`** válidos (use la plantilla del panel).

---

## 7. Entregar acceso a un alumno

Comparta por WhatsApp, correo o presencialmente (nunca en repos públicos):

```text
URL: https://[su-slug].simulacros.pe/login
Usuario: [código generado por el sistema]
Contraseña: [DNI de 8 dígitos del alumno]
```

Instrucciones para el alumno:

1. Entrar a la URL de la agencia.
2. Escribir **Usuario** (código entregado).
3. Escribir **Contraseña** (su DNI; si tiene 7 dígitos, el sistema puede completar con un cero al inicio).
4. Practicar simulacros, revisar historial y ranking.

---

## 8. Gestión de suscripciones

| Plan | Duración |
|------|----------|
| Mensual | 30 días |
| Bimestral | 60 días |
| Full Proceso | 180 días |

**Acciones frecuentes:**

- **Extender plan** — alumno renueva.
- **Desactivar** — suspende acceso sin borrar historial.
- **Resetear contraseña** — genera contraseña temporal si la olvidó.
- **Aprobar premium** — Admin → Suscripciones, cuando el alumno sube comprobante de pago.

---

## 9. Preguntas frecuentes

| Pregunta | Respuesta |
|----------|-----------|
| ¿Los alumnos necesitan email? | No. Usuario + DNI. |
| ¿Puedo usar Excel .csv? | No. Use la plantilla `.xlsx` del panel. |
| ¿Puedo crear preguntas propias? | Las agencias usan el banco central PNP de Simulacros.pe. |
| ¿Funciona en celular? | Sí. Chrome o Safari recomendados. |
| ¿Alumno olvidó contraseña? | Reseteé desde Admin → Usuarios. |
| ¿Puedo cambiar el logo yo? | Solicítelo a soporte Simulacros.pe. |

---

## 10. Checklist antes de usuarios reales

- [ ] URL de la agencia confirmada y probada
- [ ] Logo y pantalla de login correctos
- [ ] Acceso de administrador verificado
- [ ] Plantilla Excel descargada del panel
- [ ] Lista de DNI validada (sin duplicados)
- [ ] Importación piloto (3–5 alumnos) y login probado
- [ ] Importación completa; credenciales guardadas en lugar seguro
- [ ] Credenciales entregadas a alumnos por canal privado

---

## Soporte

Incidencias técnicas, branding, vigencia institucional o dudas sobre importación: contacte al equipo Simulacros.pe por el canal acordado.

---

*Documento operativo · Simulacros.pe · Uso interno para instituciones asociadas*
