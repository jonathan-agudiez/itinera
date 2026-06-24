# Itinera 2.5.0

Itinera es una aplicación colaborativa para crear itinerarios de viaje claros, compartibles e imprimibles.

## Novedades de la versión 2.5.0

- Rediseño visual completo inspirado en el lenguaje de interfaz de iOS 27 y Liquid Glass.
- Barra principal flotante y translúcida en escritorio.
- Navegación inferior flotante en móvil, respetando la zona segura del dispositivo.
- Controles circulares, botones en cápsula y jerarquía visual basada en contenido.
- Formularios agrupados con campos de apariencia nativa y foco accesible.
- Modales de escritorio con material translúcido y hojas inferiores en móvil.
- Calendario multidía más limpio, con cabeceras y tarjetas de plan integradas en el material visual.
- Tarjetas de viaje, administración, acceso y página pública actualizadas con el mismo sistema de diseño.
- Compatibilidad automática con modo oscuro.
- Alternativas para reducción de movimiento y reducción de transparencia.
- Impresión A4 conservada sin efectos translúcidos ni elementos de navegación.
- Hoja de estilos consolidada: se eliminan capas antiguas y reglas visuales duplicadas.

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
- Vista móvil diaria.
- Paleta cerrada de doce colores para los planes.
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

Consulta [DEPLOY.md](DEPLOY.md). La actualización conserva `.env.production`, el volumen de PostgreSQL y todos los datos existentes. No incorpora una migración nueva.
