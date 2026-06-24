# Informe de compilación — Itinera 2.5.2

Generado: 24 de junio de 2026

## Cambios verificados

- Modo claro forzado en escritorio y móvil.
- Eliminación completa de la adaptación CSS automática a modo oscuro.
- Metadatos del navegador configurados únicamente para superficies claras.
- Portada actualizada a «Planifica tu viaje / Aquí, ahora».
- Eliminación del antiguo antetítulo de la portada.
- Tarjetas de planes con mayor altura, hora más visible y mayor contraste tipográfico.
- Ajuste móvil específico de altura, espaciado y escala tipográfica de los planes.
- Descripción obligatoria tanto en el formulario como en la API.
- Cabeceras de columnas, contenedor del planning, colores y bordes conservados.
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
- HTML: 0,64 KB; 0,37 KB gzip.
- CSS: 37,96 KB; 8,44 KB gzip.
- JavaScript principal: 387,46 KB; 115,31 KB gzip.
- `npm audit`: 0 vulnerabilidades.
- `npm audit --omit=dev`: 0 vulnerabilidades.

## Base de datos

No se modifica el esquema. Se conservan usuarios, sesiones, itinerarios, colaboradores, planes y colores existentes.
