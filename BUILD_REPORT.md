# Informe de compilación — Itinera 2.3.0

Generado: 24 de junio de 2026

## Cambios verificados

- Agenda de escritorio por días y franjas horarias de 05:00 a 00:00.
- Línea temporal móvil equivalente.
- Acciones con iconos y overlays para colaboración y eliminación.
- Paleta visual de doce colores persistentes.
- Política de contraseña mínima de 6 caracteres.
- Impresión de la agenda completa en una sola página A4 apaisada.
- Migración `0002_entry_colors.sql` incluida.

## Backend

- `npm ci`: correcto.
- Typecheck estricto de TypeScript: correcto.
- Build de producción: correcto.
- Vitest: 2 archivos y 5 pruebas superadas.
- `npm audit`: 0 vulnerabilidades.
- `npm audit --omit=dev`: 0 vulnerabilidades.

## Frontend

- `npm ci`: correcto.
- Typecheck de TypeScript: correcto.
- Build de producción con Vite 8.1.0: correcto.
- 149 módulos transformados.
- HTML: 0,59 KB; 0,36 KB gzip.
- CSS: 40,73 KB; 8,69 KB gzip.
- JavaScript principal: 385,34 KB; 114,95 KB gzip.
- `npm audit`: 0 vulnerabilidades.
- `npm audit --omit=dev`: 0 vulnerabilidades.

## Base de datos

La migración `0002_entry_colors.sql` añade una columna `color` no nula con valor predeterminado `sage`. No elimina ni transforma usuarios, itinerarios, colaboradores o planes existentes.
