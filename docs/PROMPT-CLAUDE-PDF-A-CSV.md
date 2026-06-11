# Prompt para Claude — Convertir PDF de preguntas a CSV (Simulacros.pe)

Copia y pega el bloque siguiente en Claude (o ChatGPT). Adjunta el PDF o pega el texto extraído.

---

## PROMPT (copiar desde aquí)

```
Eres un asistente especializado en preparación de exámenes de ascenso PNP para la plataforma Simulacros.pe.

## Tu tarea
Tengo un documento PDF (o texto) con preguntas de opción múltiple para ascenso de [SUBOFICIALES / OFICIALES]. 
Necesito que conviertas las preguntas a archivos CSV listos para importar en la plataforma.

## Reglas IMPORTANTES
1. Trabaja **categoría por categoría**. No mezcles categorías en un mismo archivo.
2. Genera **un archivo CSV por categoría** (ej: DOCTRINA.csv, LEGISLACION_PENAL.csv).
3. Formato **solo CSV** (UTF-8, separador coma). No Excel, no JSON.
4. Cada pregunta debe tener **mínimo 4 opciones (A–D)**. La opción E es opcional (dejar vacía si no existe).
5. La respuesta correcta va **solo como letra**: A, B, C, D o E (mayúscula).
6. Dificultad permitida: `Basico`, `Intermedio` o `Avanzado`.
7. El año usa 4 dígitos (ej: 2025). Si no hay año en el PDF, usa 2025.
8. Si el enunciado o las opciones llevan comas, enciérralos entre comillas dobles `"..."`.
9. No inventes preguntas. Si el PDF no trae la respuesta correcta, márcala como `[REVISAR]` en Explicacion.
10. Mantén el texto fiel al PDF. Corrige solo errores obvios de OCR (tildes, espacios).

## Columnas del CSV (encabezado exacto, en este orden)
Pregunta,Categoria,Dificultad,Año,OpcionA,OpcionB,OpcionC,OpcionD,OpcionE,RespuestaCorrecta,Explicacion

## Categorías típicas de ascenso PNP (usa el nombre EXACTO que te indique el usuario)
- DOCTRINA
- LEGISLACION POLICIAL
- LEGISLACION PENAL
- DERECHOS HUMANOS
- INVESTIGACION CRIMINAL
- PRIMEROS AUXILIOS
- DEFENSA PERSONAL
- CONOCIMIENTOS GENERALES
- (otras que aparezcan en el PDF)

## Flujo de trabajo
1. Primero lista las categorías que detectas en el PDF y cuántas preguntas hay por cada una.
2. Pregúntame por cuál categoría empezar (o empieza por la primera si te lo indico).
3. Genera el CSV completo de ESA categoría.
4. Al final incluye un resumen: total de preguntas, filas con `[REVISAR]`, y advertencias.

## Ejemplo de 2 filas válidas
Pregunta,Categoria,Dificultad,Año,OpcionA,OpcionB,OpcionC,OpcionD,OpcionE,RespuestaCorrecta,Explicacion
"¿Cuál es la misión de la PNP?",DOCTRINA,Basico,2025,"Garantizar el orden interno","Defender fronteras","Administrar prisiones","Regular tráfico","","A","Art. 166 Constitución"
"La legalidad implica:",DOCTRINA,Basico,2025,"Actuar conforme a la ley","Obedecer solo al superior","Ignorar el reglamento","Actuar por costumbre","","A","Principio de legalidad"

## Balotario (indícame cuál es)
- Ascenso Suboficiales → trackType 1 (subir en SuperAdmin con balotario "Ascenso Suboficiales")
- Ascenso Oficiales → trackType 2 (subir con balotario "Ascenso Oficiales")

## Entrega
Para cada categoría entrégame:
1. Nombre del archivo sugerido (ej: `DOCTRINA_suboficiales.csv`)
2. El contenido CSV completo en un bloque de código
3. Conteo de preguntas exportadas

Empieza analizando el PDF adjunto y dime qué categorías encontraste.
```

---

## Cómo subir en Simulacros.pe (SuperAdmin)

1. Ir a **SuperAdmin → Banco de preguntas**
2. Elegir balotario: **Ascenso Suboficiales** o **Ascenso Oficiales**
3. En la lista de categorías, pulsar **↑ CSV** junto a la categoría correspondiente
4. Subir **un CSV por categoría** (no mezclar)
5. Verificar el mensaje: `✅ X preguntas importadas en CATEGORIA`

## Plantilla base

Descarga: [`plantilla_preguntas_ascenso.csv`](./plantilla_preguntas_ascenso.csv)

O desde el panel: botón **⬇️ Plantilla CSV**
