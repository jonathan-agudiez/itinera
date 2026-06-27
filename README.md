# Itinera v2.7.4

Itinera es una aplicación colaborativa para crear, compartir, copiar, editar y presentar itinerarios de viaje.

## Novedades de la versión 2.7.4

- Botón visible **Quitar de mis itinerarios** en `/dashboard` para viajes compartidos cuyo propietario es otro usuario.
- Detección robusta mediante `ownerId` y el usuario autenticado.
- Vista A4/PDF restaurada al diseño de v2.7.1.
- Cabecera A4 sin logotipo ni nombre de marca.

## Funcionalidades principales

- Registro, inicio de sesión y recuperación de contraseña.
- Itinerarios de 1 a 10 días.
- Planes con hora, título, descripción obligatoria, ubicación, categoría y color.
- Colaboradores con permisos de lectura o escritura.
- Enlaces públicos de solo lectura.
- Copias independientes desde vistas privadas o públicas.
- Ocultación personal de itinerarios compartidos.
- Eliminación permanente restringida al propietario.
- Exportación A4/PDF profesional.
- Notificaciones administrativas por registro y copia.
- Auditoría y protección frente a edición concurrente.

## Arquitectura

- **Frontend:** React 19, Vite 8 y TypeScript.
- **Backend:** Fastify 5 y TypeScript.
- **Base de datos:** PostgreSQL 17 y Drizzle ORM.
- **Validación:** Zod.
- **Autenticación:** sesiones opacas con hashes SHA-256.
- **Contraseñas:** Argon2id.
- **Correo:** Resend.
- **Producción:** Netlify para frontend; Hetzner y Caddy para API y PostgreSQL.

Consulta [DEPLOY.md](DEPLOY.md) para actualizar producción.
