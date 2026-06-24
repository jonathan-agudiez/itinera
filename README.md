# Itinera 2.5.2

Itinera es una aplicación colaborativa para crear itinerarios de viaje claros, compartibles e imprimibles.

## Novedades de la versión 2.5.2

- Interfaz fijada exclusivamente en modo claro, también cuando el sistema operativo utiliza modo oscuro.
- Revisión específica de la experiencia móvil para conservar contraste, legibilidad y superficies claras.
- Nueva portada con el mensaje «Planifica tu viaje / Aquí, ahora».
- Eliminación de la frase «Una forma más tranquila de planificar juntos».
- Tarjetas de planes con mayor altura mínima y una jerarquía tipográfica más marcada:
  - hora más visible;
  - título dominante;
  - ubicación secundaria;
  - descripción legible y obligatoria.
- Se conservan sin cambios la cabecera de las columnas, el contenedor del planning, la paleta y el tratamiento de bordes.
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
