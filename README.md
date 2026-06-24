# Itinera 2.3.0

Itinera es una aplicación colaborativa para crear itinerarios de viaje visuales, horarios y fáciles de compartir.

## Novedades de la versión 2.3.0

- El itinerario se representa como una agenda: columnas por día y filas horarias desde las 05:00 hasta las 00:00.
- La versión móvil conserva un solo día por pantalla y muestra el mismo horario vertical por horas.
- Colaboración y eliminación dejan de ocupar espacio permanente: ahora se abren desde iconos en overlays.
- Acciones principales con iconos de trazo limpio y menos texto visual.
- Paleta visual de 12 colores coherentes para cada plan.
- Los colores se guardan en PostgreSQL mediante la migración `0002_entry_colors.sql`.
- La política de contraseña acepta claves desde 6 caracteres, incluidos PIN numéricos de 6 cifras.
- Impresión compacta en una sola página A4 apaisada con todas las columnas y las 20 filas horarias.

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
- Agenda horaria multidía sin desplazamiento horizontal.
- Vista móvil diaria con navegación anterior/siguiente.
- Planes coloreables con 12 tonos.
- Impresión A4 apaisada en una sola hoja.
- Enlaces públicos de solo lectura.
- Colaboradores con permiso de lectura o edición.
- Protección frente a modificaciones concurrentes.
- Límites de frecuencia, cabeceras de seguridad, cookies SameSite y auditoría.
- Healthchecks de aplicación y base de datos.

## Desarrollo local

Requisitos: Node.js 22.12 o superior, npm y Docker.

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

docker compose -f docker-compose.dev.yml up -d

cd backend
npm ci
npm run build
node dist/db/migrate.js
node dist/seeds/admin.js
npm run dev
```

En otra terminal:

```bash
cd frontend
npm ci
npm run dev
```

Abrir `http://localhost:5173`.

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

Consulta [DEPLOY.md](DEPLOY.md). La actualización conserva `.env.production` y el volumen de PostgreSQL. La API aplica automáticamente la migración de color antes de arrancar.
