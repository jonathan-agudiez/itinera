# Informe de compilación — Itinera 2.4.0

Generado: 24 de junio de 2026

## Cambios verificados

- Agenda por columnas de fecha sin filas horarias.
- Eliminación de etiquetas ordinales de día.
- Creación y edición de duración entre 1 y 10 días.
- Bloqueo seguro al reducir fechas con planes fuera del intervalo.
- Menú principal iconográfico y accesible.
- Tarjetas de plan simplificadas.
- Revisión visual de escritorio, móvil e impresión A4.
- Sin migraciones nuevas.

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
- HTML: 0,59 KB; 0,36 KB gzip.
- CSS: 37,06 KB; 8,11 KB gzip.
- JavaScript principal: 387,69 KB; 115,42 KB gzip.
- `npm audit`: 0 vulnerabilidades.
- `npm audit --omit=dev`: 0 vulnerabilidades.

## Base de datos

No se modifica el esquema. Se conservan usuarios, sesiones, itinerarios, colaboradores, planes y colores existentes.
