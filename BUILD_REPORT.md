# Informe de compilación — Itinera 2.5.1

Generado: 24 de junio de 2026

## Cambios verificados

- Tarjetas de planes rediseñadas con jerarquía tipográfica y superficies de estilo iOS.
- Sin iconos decorativos adicionales dentro de las tarjetas.
- Corrección del espacio superior y del scroll vertical no deseado.
- Overlays aclarados en modo claro.
- Impresión A4 completamente rehecha para mostrar únicamente el planning.
- Densidad de impresión adaptativa según la cantidad de planes.
- Sin cambios funcionales ni migraciones nuevas.

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
- HTML: 0,72 KB; 0,40 KB gzip.
- CSS: 39,56 KB; 8,76 KB gzip.
- JavaScript principal: 387,48 KB; 115,33 KB gzip.
- `npm audit`: 0 vulnerabilidades.
- `npm audit --omit=dev`: 0 vulnerabilidades.

## Base de datos

No se modifica el esquema. Se conservan usuarios, sesiones, itinerarios, colaboradores, planes y colores existentes.
