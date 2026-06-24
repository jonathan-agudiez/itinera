# Itinera 2.5.1

Itinera es una aplicación colaborativa para crear itinerarios de viaje claros, compartibles e imprimibles.

## Novedades de la versión 2.5.1

- Rediseño exclusivo de las tarjetas de los planes con una jerarquía tipográfica más cercana a iOS:
  - hora como información secundaria;
  - título con mayor tamaño y peso;
  - ubicación y descripción con contraste progresivo;
  - color integrado de forma discreta mediante una guía lateral.
- Superficies de plan más limpias, menos brillantes y con sombras contenidas.
- Estados hover y pulsación más suaves, sin adornos ni iconos adicionales.
- Eliminación del hueco superior que provocaba desplazamiento vertical innecesario.
- Overlays más claros y luminosos en modo claro.
- Impresión A4 rehecha para mostrar exclusivamente el planning, conservando el lenguaje visual de la web.
- Densidad de impresión adaptativa según el número máximo de planes de cada día.

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

Consulta [DEPLOY.md](DEPLOY.md). La actualización conserva `.env.production`, el volumen de PostgreSQL y todos los datos existentes. No incorpora migraciones.
