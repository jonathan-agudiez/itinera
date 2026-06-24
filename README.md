# Itinera 2.5.4

Itinera es una aplicación colaborativa para crear itinerarios de viaje claros, compartibles e imprimibles.

## Novedades de la versión 2.5.4

- Tarjetas de plan ligeramente menos altas, manteniendo la jerarquía tipográfica actual.
- Fechas de columna de mayor tamaño en escritorio, vista compacta y móvil.
- Navegación móvil flotante y fija en la zona inferior, sin logo ni barra superior.
- Respeto de áreas seguras y espacio reservado para que la navegación no cubra contenido.
- Overlays móviles con margen lateral para evitar que el formulario quede pegado a los bordes.
- A4/PDF con el planning completo y tarjetas más compactas solo durante la impresión.
- Interfaz exclusivamente en modo claro.
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
- Exportación A4/PDF apaisada en una sola página.
- Enlaces públicos de solo lectura.
- Colaboradores con permiso de lectura o edición.
- Protección frente a modificaciones concurrentes.
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
