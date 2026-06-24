# Informe de compilación — Itinera 2.5.0

Generado: 24 de junio de 2026

## Cambios verificados

- Rediseño completo inspirado en iOS 27 y Liquid Glass.
- Navegación flotante adaptada a escritorio y móvil.
- Hojas inferiores para overlays móviles.
- Formularios, tarjetas, calendario, administración y acceso unificados visualmente.
- Modo oscuro y preferencias de accesibilidad.
- Consolidación de la hoja de estilos sin reglas heredadas duplicadas.
- Impresión A4 preservada.
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
- HTML: 0,72 KB; 0,40 KB gzip.
- CSS: 37,15 KB; 8,40 KB gzip.
- JavaScript principal: 387,34 KB; 115,27 KB gzip.
- `npm audit`: 0 vulnerabilidades.
- `npm audit --omit=dev`: 0 vulnerabilidades.

## Base de datos

No se modifica el esquema. Se conservan usuarios, sesiones, itinerarios, colaboradores, planes y colores existentes.
