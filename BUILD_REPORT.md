# Informe de compilación — Itinera 2.5.3

Generado: 24 de junio de 2026

## Cambios verificados

- Tarjetas de planes con mayor altura mínima en escritorio, vista compacta de diez días y móvil.
- Hora ampliada y con peso tipográfico ligero.
- Título con mayor jerarquía visual.
- Descripción visible en la vista compacta, con peso ligero y hasta tres líneas.
- Ubicación secundaria y ligera; se oculta solo en la vista compacta para priorizar la descripción.
- Borde blanco translúcido, fondo pastel y sombra equivalentes a las tarjetas de la portada.
- Eliminación de la línea lateral cromática de las tarjetas.
- Cabeceras de fecha ligeramente ampliadas sin modificar su layout ni el contenedor del planning.
- Descripción obligatoria conservada en frontend y backend.
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
- CSS: 37,74 KB; 8,34 KB gzip.
- JavaScript principal: 387,49 KB; 115,31 KB gzip.
- `npm audit`: 0 vulnerabilidades.
- `npm audit --omit=dev`: 0 vulnerabilidades.

## Base de datos

No se modifica el esquema. Se conservan usuarios, sesiones, itinerarios, colaboradores, planes, descripciones y colores existentes.
