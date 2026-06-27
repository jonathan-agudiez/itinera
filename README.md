# Itinera v2.7.6

Itinera es una aplicación colaborativa para crear, compartir, copiar, editar y presentar itinerarios de viaje.

## Novedades de la versión 2.7.6

- Separadores verticales de columnas más oscuros y definidos exclusivamente al imprimir o guardar en PDF.

- Acción de ocultar itinerarios en `/dashboard` presentada como icono elegante y accesible.
- Impresión A4 con textos negros, borde exterior negro y tipografía proporcionalmente mayor.
- Sombras eliminadas solo en `@media print` para reducir artefactos de impresión.

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
