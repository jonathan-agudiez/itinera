# Build report — Itinera 2.6.0

Fecha de validación: 2026-06-25.

## Backend

- `npm ci`: correcto.
- `npm run typecheck`: correcto.
- `npm test`: 3 archivos, 8 pruebas superadas.
- `npm run build`: correcto.
- `npm audit`: 0 vulnerabilidades.
- `npm audit --omit=dev`: 0 vulnerabilidades.

## Frontend

- `npm ci`: correcto.
- `npm run typecheck`: correcto.
- `npm run build`: correcto.
- Vite 8.1.0: 149 módulos transformados.
- JavaScript: 388,61 kB; gzip 115,50 kB.
- CSS: 38,08 kB; gzip 8,37 kB.
- `npm audit`: 0 vulnerabilidades.
- `npm audit --omit=dev`: 0 vulnerabilidades.

## Base de datos

No hay migraciones nuevas. La copia reutiliza las tablas existentes y se ejecuta de forma transaccional.
