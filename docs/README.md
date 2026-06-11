# Documentación del proyecto Cocodrilito / Simulacros.pe

## Importar preguntas desde PDF → CSV

- Plantilla: [`plantillas/plantilla_preguntas_ascenso.csv`](./plantillas/plantilla_preguntas_ascenso.csv)
- Prompt para Claude: [`PROMPT-CLAUDE-PDF-A-CSV.md`](./PROMPT-CLAUDE-PDF-A-CSV.md)

---

## Configuración de producción (DNS, SendGrid, logos)

Guía paso a paso para los tres requisitos críticos:

- [`CONFIGURACION-PRODUCCION.md`](./CONFIGURACION-PRODUCCION.md)

---

## Informe para agencias — Onboarding y carga de alumnos (PDF)

**Documento comercial/operativo para ofrecer a agencias:**

- PDF: [`INFORME-ONBOARDING-AGENCIAS-SIMULACROS.pdf`](./INFORME-ONBOARDING-AGENCIAS-SIMULACROS.pdf)
- HTML (misma información): [`INFORME-ONBOARDING-AGENCIAS-SIMULACROS.html`](./INFORME-ONBOARDING-AGENCIAS-SIMULACROS.html)

### Regenerar el PDF de agencias

```bash
cd docs
node scripts/generate-onboarding-pdf.mjs
```

---

## Informe técnico de situación (PDF)

**Archivo principal (descargable):**

- [`INFORME-SITUACION-PROYECTO-COCODRILITO.pdf`](./INFORME-SITUACION-PROYECTO-COCODRILITO.pdf)

**Versión HTML** (misma información, útil para imprimir desde el navegador):

- [`INFORME-SITUACION-PROYECTO-COCODRILITO.html`](./INFORME-SITUACION-PROYECTO-COCODRILITO.html)

### Regenerar el PDF técnico

```bash
cd docs
node scripts/generate-informe-pdf.mjs
```

El informe técnico incluye: arquitectura, backend (controladores, entidades, auth, migraciones), frontend (rutas, APIs, stores, paneles admin), integración, despliegue e historial de cambios.
