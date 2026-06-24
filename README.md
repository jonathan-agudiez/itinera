# Itinera 2.1.0

Itinera es una aplicación colaborativa para crear itinerarios de viaje claros, visuales y fáciles de compartir.

## Novedades de la versión 2.1.0

- Interfaz completa en castellano.
- Fechas, días de la semana, meses, categorías, permisos y roles adaptados a español.
- Calendario sin desplazamiento horizontal: las columnas se ajustan al contenedor y se redistribuyen de forma responsiva.
- Diseño compacto automático para itinerarios con muchos días.
- Botón **Imprimir itinerario** en la vista privada y en los enlaces compartidos.
- Maquetación exclusiva para impresión en A4 apaisado, sin navegación, formularios ni paneles de gestión.
- Cabecera de impresión con título, destino, fechas y descripción.
- Mensajes de validación, conexión y API en castellano.
- Correos de recuperación de contraseña en castellano.

## Arquitectura

- **Frontend:** React 19 + Vite 8 + TypeScript.
- **Backend:** Fastify 5 + TypeScript.
- **Base de datos:** PostgreSQL 17 + Drizzle ORM.
- **Validación:** Zod en frontend y backend.
- **Autenticación:** sesiones opacas persistidas como hashes SHA-256.
- **Contraseñas:** Argon2id.
- **Producción:** frontend estático en Netlify; API y PostgreSQL en Hetzner; Caddy como gateway TLS compartido.

Frontend y backend mantienen sus propios `package.json` y `package-lock.json`, sin workspaces ni dependencias acopladas.

## Funcionalidades

- Registro, inicio y cierre de sesión.
- Recuperación y cambio de contraseña.
- Eliminación permanente de cuenta.
- Panel de usuario y panel de administración.
- CRUD completo de itinerarios y actividades.
- Calendario por días con edición mediante doble clic.
- Impresión profesional del itinerario en A4.
- Enlaces públicos de solo lectura.
- Colaboradores con permiso de lectura o edición.
- Protección frente a modificaciones concurrentes.
- Límites de frecuencia, cabeceras de seguridad, cookies SameSite y registro de auditoría.
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

Consulta [DEPLOY.md](DEPLOY.md). La actualización conserva `.env.production`, la base de datos y el volumen de PostgreSQL existentes.
