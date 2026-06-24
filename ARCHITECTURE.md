# Arquitectura de Itinera 2.4.0

## Topología de producción

```text
Navegador
  │
  ├── aplicación estática ── Netlify / React + Vite
  │
  └── /api/* ─────────────── HTTPS / Caddy en Hetzner
                                  │
                                  └── itinera-v2-api:4000 / Fastify
                                            │
                                            └── PostgreSQL 17 privado
```

## Separación de responsabilidades

`frontend/` es una SPA estática sin secretos de base de datos. `backend/` controla autenticación, permisos, validación, auditoría y persistencia.

## Modelo de itinerario

PostgreSQL conserva `start_date` y `end_date`. La interfaz solicita `startDate` y `dayCount`; la API calcula la fecha final y valida una duración inclusiva de entre 1 y 10 días.

La edición de duración es segura: antes de acortar o desplazar el intervalo, el backend comprueba si existen planes fuera de las nuevas fechas. Si los hay, devuelve un conflicto y no modifica el itinerario.

El mismo conjunto de planes alimenta tres presentaciones:

- Escritorio: una columna por fecha, sin filas horarias y sin scroll horizontal.
- Móvil: una fecha por pantalla con navegación anterior, siguiente y selector directo.
- Impresión: todas las fechas en columnas compactas dentro de un A4 apaisado.

Los planes siempre se ordenan por hora de inicio y `sort_order`.

## Sistema visual

La interfaz utiliza iconos únicamente para acciones globales reconocibles. Cada control iconográfico incluye nombre accesible (`aria-label`) y descripción nativa (`title`). Las tarjetas de plan se apoyan en tipografía, hora y color, sin iconografía decorativa.

Cada plan guarda un token de color validado dentro de una paleta cerrada de doce valores. El frontend traduce ese token a fondo, borde y acento visual.

## Autenticación

El navegador recibe un token de sesión opaco en una cookie `HttpOnly`, `Secure` y `SameSite=Lax`. PostgreSQL almacena únicamente su hash SHA-256. Las contraseñas se procesan mediante Argon2id y admiten desde 6 caracteres.

## Compartición y autorización

- `OWNER`: control completo.
- `WRITE`: lectura y CRUD de planes.
- `READ`: lectura registrada.
- `PUBLIC`: lectura mediante token.
- `ADMIN`: gestión global.

Cada ruta privada calcula el acceso en el servidor.

## Migraciones

La versión 2.4.0 no añade ninguna migración. `0002_entry_colors.sql` continúa formando parte del historial para instalaciones limpias.

## Aislamiento del despliegue

Producción utiliza el proyecto Compose `itinera_v2`, el volumen `itinera_v2_postgres_data` y el alias de gateway `itinera-v2-api`. No sustituye los contenedores de Itinera v1 ni de Yieldsoft.
