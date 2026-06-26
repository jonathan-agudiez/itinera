# Itinera 2.6.0

Itinera es una aplicación colaborativa para crear, compartir, copiar y editar itinerarios de viaje.

## Novedades de la versión 2.6.0

- Corregido el error al añadir colaboradores: `can't access property "reset", t.currentTarget is null`.
- Los propietarios pueden conceder permisos de lectura o edición a usuarios registrados.
- Cualquier usuario con acceso a un itinerario puede crear una copia independiente en sus propios viajes.
- Los itinerarios públicos compartidos incluyen una acción para copiarlos después de iniciar sesión.
- La copia conserva fechas, destino, descripción, zona horaria, planes, colores y orden.
- La copia no hereda colaboradores ni modifica el itinerario original.
- El enlace público de la copia queda desactivado hasta que su nuevo propietario decida compartirla.
- Notificación por correo al administrador cuando se registra un usuario.
- Notificación por correo al administrador cuando alguien copia un itinerario.
- Las notificaciones de administración son de tipo best effort: un fallo del proveedor de correo no bloquea el registro ni la copia.
- Sin migraciones ni cambios de esquema de PostgreSQL.

## Correo de administración

Las notificaciones se envían a `ADMIN_EMAIL`. Para la entrega real deben configurarse:

```env
ADMIN_EMAIL=jonathan.agudiez@gmail.com
RESEND_API_KEY=re_...
MAIL_FROM=Itinera <notificaciones@tu-dominio-verificado.com>
```

`MAIL_FROM` debe pertenecer a un dominio o remitente verificado por el proveedor. Si `RESEND_API_KEY` está vacío, la aplicación registra la notificación en los logs, pero no envía un correo real.

## Arquitectura

- **Frontend:** React 19 + Vite 8 + TypeScript.
- **Backend:** Fastify 5 + TypeScript.
- **Base de datos:** PostgreSQL 17 + Drizzle ORM.
- **Validación:** Zod en frontend y backend.
- **Autenticación:** sesiones opacas persistidas como hashes SHA-256.
- **Contraseñas:** Argon2id.
- **Correo:** API de Resend mediante `fetch`, sin SDK adicional.
- **Producción:** frontend estático en Netlify; API y PostgreSQL en Hetzner; Caddy como gateway TLS compartido.

Frontend y backend mantienen sus propios `package.json` y `package-lock.json`.

## Funcionalidades

- Registro, inicio y cierre de sesión.
- Recuperación y cambio de contraseña.
- Panel de usuario y panel de administración.
- CRUD completo de itinerarios y planes.
- Itinerarios de entre 1 y 10 días.
- Enlaces públicos de solo lectura.
- Colaboradores con permiso de lectura o edición.
- Copia independiente de itinerarios privados accesibles y enlaces públicos.
- Paleta cerrada de doce colores para los planes.
- Descripción obligatoria en todos los planes nuevos y editados.
- Exportación A4/PDF.
- Protección frente a modificaciones concurrentes.
- Auditoría de registros, accesos, cambios y copias.
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
