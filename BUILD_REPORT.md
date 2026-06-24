# Informe de compilación — Itinera 2.5.4

Generado: 24 de junio de 2026

## Cambios verificados

- Tarjetas de plan ligeramente más compactas en web y móvil.
- Cabeceras de fecha de mayor tamaño en las variantes normal, compacta y móvil.
- Barra de navegación móvil fija abajo, sin logo ni marca en la parte superior.
- Reserva de espacio inferior y soporte para `safe-area-inset-bottom`.
- Overlays móviles con margen lateral y comportamiento de hoja inferior.
- Impresión/PDF A4 con la tabla completa y tarjetas compactadas únicamente dentro de `@media print`.
- Sin migraciones ni cambios de base de datos.

## Backend

- `npm ci`: correcto.
- Typecheck estricto de TypeScript: correcto.
- Build de producción: correcto.
- Vitest: 2 archivos y 7 pruebas superadas.
- `npm audit`: 0 vulnerabilidades.
- `npm audit --omit=dev`: 0 vulnerabilidades.

## Frontend

- `npm ci`: correcto.
- Typecheck de TypeScript: correcto.
- Build de producción con Vite 8.1.0: correcto.
- 149 módulos transformados.
- HTML: 0,64 KB; 0,37 KB gzip.
- CSS: 38,08 KB; 8,37 KB gzip.
- JavaScript principal: 387,49 KB; 115,31 KB gzip.
- `npm audit`: 0 vulnerabilidades.
- `npm audit --omit=dev`: 0 vulnerabilidades.

## Base de datos

No se modifica el esquema. Se conservan usuarios, sesiones, itinerarios, colaboradores, planes, descripciones y colores existentes.
