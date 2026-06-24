# Informe de compilación — Itinera 2.1.0

Generado: 24 de junio de 2026

## Cambios verificados

- Interfaz traducida íntegramente al castellano.
- Localización española de fechas, días, meses, categorías, permisos y roles.
- Calendario fluido sin desplazamiento horizontal.
- Hasta 10 columnas en escritorio, 5 en tablet, 2 en móvil y 1 en pantallas muy estrechas.
- Distribución automática en nuevas filas para itinerarios largos.
- Modo compacto para calendarios de ocho días o más.
- Hoja de estilos de impresión exclusiva para A4 apaisado.
- Ocultación en impresión de navegación, botones, avisos y paneles administrativos.
- Traducción de errores de red, validación y API.
- Mensajes y correo de recuperación de contraseña en castellano.

## Backend

- `npm ci`: correcto.
- Typecheck estricto de TypeScript: correcto.
- Vitest: 1 archivo y 3 pruebas superadas.
- Build de producción: correcto.
- `npm audit`: 0 vulnerabilidades.
- `npm audit --omit=dev`: 0 vulnerabilidades.

## Frontend

- `npm ci`: correcto.
- Typecheck de TypeScript: correcto.
- Build de producción con Vite 8.1.0: correcto.
- 148 módulos transformados.
- CSS: 17,41 KB; 4,44 KB gzip.
- JavaScript principal: 371,69 KB; 111,20 KB gzip.
- `npm audit`: 0 vulnerabilidades.
- `npm audit --omit=dev`: 0 vulnerabilidades.

## Base de datos

Esta versión no incluye migraciones nuevas ni cambios de esquema. El volumen PostgreSQL existente se conserva sin modificaciones.
