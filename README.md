# Itinera 2.5.3

Itinera es una aplicación colaborativa para crear itinerarios de viaje claros, compartibles e imprimibles.

## Novedades de la versión 2.5.3

Esta versión se concentra únicamente en el acabado de los planes dentro del planning:

- Tarjetas con mayor altura mínima y más espacio interior.
- Hora de mayor tamaño y peso ligero.
- Título dominante, con un contraste claro frente a la descripción.
- Descripción siempre visible en la web, incluso en itinerarios de diez días, y obligatoria al crear o editar un plan.
- Ubicación y descripción con pesos tipográficos más ligeros.
- Fondos, bordes y sombras coherentes con las tarjetas pastel de la portada.
- Eliminación de la línea lateral de color para evitar que cada plan parezca un componente distinto a los de la home.
- Cabeceras de fecha ligeramente mayores, sin alterar su estructura ni el contenedor del planning.
- Ajustes equivalentes en la vista móvil.
- Sin cambios de base de datos ni migraciones nuevas.

## Arquitectura

- **Frontend:** React 19 + Vite 8 + TypeScript.
- **Backend:** Fastify 5 + TypeScript.
- **Base de datos:** PostgreSQL 17 + Drizzle ORM.
- **Validación:** Zod en frontend y backend.
- **Autenticación:** sesiones opacas persistidas como hashes SHA-256.
- **Contraseñas:** Argon2id.
- **Producción:** frontend estático en Netlify; API y PostgreSQL en Hetzner; Caddy como gateway TLS compartido.

Frontend y backend mantienen sus propios `package.json` y `package-lock.json`.

## Funcionalidades

- Registro, inicio y cierre de sesión.
- Recuperación y cambio de contraseña.
- Panel de usuario y panel de administración.
- CRUD completo de itinerarios y planes.
- Itinerarios de entre 1 y 10 días.
- Vista multidía sin desplazamiento horizontal.
- Vista móvil de una fecha por pantalla.
- Paleta cerrada de doce colores para los planes.
- Descripción obligatoria en todos los planes nuevos y editados.
- Impresión A4 apaisada en una sola hoja.
- Enlaces públicos de solo lectura.
- Colaboradores con permiso de lectura o edición.
- Protección frente a modificaciones concurrentes.
- Límites de frecuencia, cabeceras de seguridad, cookies SameSite y auditoría.
- Healthchecks de aplicación y base de datos.

## Verificación de calidad

Backend:

```bash
cd backend
npm ci
npm run typecheck
npm test
npm run build
npm audit
npm audit --omit=dev
```

Frontend:

```bash
cd frontend
npm ci
npm run typecheck
npm run build
npm audit
npm audit --omit=dev
```

## Actualización de producción

Consulta [DEPLOY.md](DEPLOY.md). La actualización conserva `.env.production`, el volumen de PostgreSQL y todos los datos existentes.
